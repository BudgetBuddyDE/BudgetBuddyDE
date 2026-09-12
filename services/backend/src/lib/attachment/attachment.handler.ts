import path from 'node:path';
import {promisify} from 'node:util';
import {gzip} from 'node:zlib';
import type {S3Client} from '@aws-sdk/client-s3';
import {DeleteObjectsCommand, GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import type {TypeOfSchema} from '@budgetbuddyde/api';
import type {IGetAllAttachmentsQuery, TAttachment, TSignedAttachmentUrl} from '@budgetbuddyde/api/attachment';
import {type AttachmentSchemas, attachments} from '@budgetbuddyde/db/backend';
import type {Logger} from '@budgetbuddyde/logger';
import {and, eq, inArray} from 'drizzle-orm';
import sharp from 'sharp';
import {config} from '../../config';
import {db} from '../../db';
import {AttachmentCache} from '../cache/attachment.cache';
import {logger} from '../logger';
import {getS3Client} from '../s3';

type AttachmentRecord = TypeOfSchema<typeof AttachmentSchemas.select>;

type SignedUrlOptions = Partial<Pick<IGetAllAttachmentsQuery, 'ttl'>>;

type PreparedAttachmentBuffer = {
  buffer: Buffer;
  contentEncoding?: string;
  optimization: 'image' | 'gzip' | 'none';
};

const STORAGE_CLEANUP_ATTEMPTS = 3;
const gzipAsync = promisify(gzip);

/** Magic-byte checks for the image types the API accepts. */
const IMAGE_SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  'image/png': buffer =>
    buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/jpg': buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/webp': buffer =>
    buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
  'image/heic': buffer => isIsoBmffImage(buffer),
  'image/heif': buffer => isIsoBmffImage(buffer),
};

function isIsoBmffImage(buffer: Buffer): boolean {
  return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
}

type AttachmentHandlerOptions = {
  ttl: number;
};

export abstract class AttachmentHandler {
  protected readonly s3Client: S3Client;
  protected readonly logger: Logger;
  protected readonly bucketName: string;
  protected readonly cache: AttachmentCache;
  protected readonly defaultTtl: number = config.attachments.signedUrlTtlSeconds;

  constructor(bucket: string, options?: Partial<AttachmentHandlerOptions>) {
    this.s3Client = getS3Client();
    this.logger = logger.child({module: this.constructor.name});
    this.bucketName = bucket;
    this.cache = new AttachmentCache();
    if (options?.ttl) this.defaultTtl = options.ttl;
  }

  /**
   * Get file extension from multer file
   */
  static getFileExtension(file: Express.Multer.File): string {
    return path.extname(file.originalname).slice(1).toLowerCase();
  }

  /**
   * Return the correct MIME type for a multer file.
   * When the browser reports `application/octet-stream`, the actual type is
   * derived from the configured file-extension overrides.
   */
  static resolveMimeType(file: Express.Multer.File): string {
    if (file.mimetype !== 'application/octet-stream') {
      return file.mimetype;
    }
    const ext = AttachmentHandler.getFileExtension(file);
    return config.attachments.mimeTypeOverrides[ext] ?? file.mimetype;
  }

  private static isOptimizableImage(contentType: string): boolean {
    return config.attachments.imageOptimization.mimeTypes.has(contentType);
  }

  /**
   * Returns whether the buffer matches the declared image type. Unknown or
   * non-image content types are not signature-checked here.
   */
  static hasValidImageSignature(fileBuffer: Buffer, contentType: string): boolean {
    const signature = IMAGE_SIGNATURES[contentType];
    return signature ? signature(fileBuffer) : true;
  }

  private static assertValidImageSignature(fileBuffer: Buffer, contentType: string): void {
    if (!AttachmentHandler.hasValidImageSignature(fileBuffer, contentType)) {
      throw new Error('Attachment content does not match its declared image type');
    }
  }

  private static async optimizeImageBuffer(fileBuffer: Buffer, contentType: string): Promise<Buffer> {
    const image = sharp(fileBuffer, {
      failOn: 'none',
      limitInputPixels: config.attachments.imageOptimization.maxInputPixels,
    })
      .rotate()
      .resize({
        width: config.attachments.imageOptimization.maxDimensionPx,
        height: config.attachments.imageOptimization.maxDimensionPx,
        fit: 'inside',
        withoutEnlargement: true,
      });

    switch (contentType) {
      case 'image/jpeg':
      case 'image/jpg':
        return image.jpeg({quality: config.attachments.imageOptimization.jpegQuality, mozjpeg: true}).toBuffer();
      case 'image/png':
        return image
          .png({compressionLevel: config.attachments.imageOptimization.pngCompressionLevel, palette: true})
          .toBuffer();
      case 'image/webp':
        return image.webp({quality: config.attachments.imageOptimization.webpQuality}).toBuffer();
      default:
        return fileBuffer;
    }
  }

  /**
   * Prepare an attachment payload for storage. Images are optimized with
   * image-aware resizing/re-encoding first because gzip usually does not reduce
   * already-compressed image formats. Non-images still use gzip when it reduces
   * the payload size.
   */
  static async prepareAttachmentBuffer(fileBuffer: Buffer, contentType: string): Promise<PreparedAttachmentBuffer> {
    AttachmentHandler.assertValidImageSignature(fileBuffer, contentType);

    if (AttachmentHandler.isOptimizableImage(contentType)) {
      try {
        const optimizedImageBuffer = await AttachmentHandler.optimizeImageBuffer(fileBuffer, contentType);

        if (optimizedImageBuffer.length < fileBuffer.length) {
          return {buffer: optimizedImageBuffer, optimization: 'image'};
        }
      } catch {
        // Keep the original upload if an image is malformed or libvips cannot decode it.
      }

      return {buffer: fileBuffer, optimization: 'none'};
    }

    const compressedBuffer = await gzipAsync(fileBuffer);

    if (compressedBuffer.length >= fileBuffer.length) {
      return {buffer: fileBuffer, optimization: 'none'};
    }

    return {buffer: compressedBuffer, contentEncoding: 'gzip', optimization: 'gzip'};
  }

  /**
   * Verify if user is authorized to access attachment
   */
  public async verifyOwnership(attachmentId: string, userId: string): Promise<AttachmentRecord | null> {
    const attachment = await db.query.attachments.findFirst({
      where: and(eq(attachments.ownerId, userId), eq(attachments.id, attachmentId)),
    });

    return attachment || null;
  }

  /**
   * Find attachments by owner and IDs
   */
  protected async findByOwnerAndIds(userId: string, attachmentIds: string[]) {
    return db.query.attachments.findMany({
      where: and(eq(attachments.ownerId, userId), inArray(attachments.id, attachmentIds)),
    });
  }

  /**
   * Generate signed URL for a single attachment
   */
  public async generateSignedUrl(attachment: AttachmentRecord, options: SignedUrlOptions = {}): Promise<string> {
    const ttl = options.ttl || this.defaultTtl;
    // Only the default TTL is cached; custom TTLs would otherwise collide on the same key.
    const cacheable = ttl === this.defaultTtl;

    if (cacheable) {
      const cachedUrl = await this.cache.retrieveSignedAttachmentUrl(attachment.id);
      if (cachedUrl) {
        this.logger.debug('Serving signed URL for attachment %s from cache', attachment.id);
        return cachedUrl;
      }
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: attachment.location,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {expiresIn: ttl});

    if (cacheable) {
      await this.cache.writeSignedAttachmentUrl(attachment.id, signedUrl, ttl);
      this.logger.debug('Generated signed URL for attachment %s and cached with TTL %d', attachment.id, ttl);
    }

    return signedUrl;
  }

  /**
   * Generate signed URLs for multiple attachments with cache optimization
   */
  public async generateSignedUrls(
    attachments: {attachmentId: TAttachment['id']; objectStoreLocation: string}[],
    options: SignedUrlOptions = {},
  ): Promise<{
    signedUrls: Map<TAttachment['id'], TSignedAttachmentUrl>;
    source: 'cache' | 'object_store' | undefined;
  }> {
    if (attachments.length === 0) {
      return {signedUrls: new Map(), source: undefined};
    }

    const ttl = options.ttl || this.defaultTtl;
    const cacheable = ttl === this.defaultTtl;

    // Bulk-read cached URLs for the default TTL only.
    const cachedUrls = cacheable
      ? await this.cache.retrieveSignedAttachmentUrls(attachments.map(attachment => attachment.attachmentId))
      : new Map<string, string>();

    const attachmentsWithCache: {attachmentId: TAttachment['id']; signedUrl: TSignedAttachmentUrl}[] = [];
    const attachmentsToGenerate: typeof attachments = [];

    for (const attachment of attachments) {
      const cachedUrl = cachedUrls.get(attachment.attachmentId);
      if (cachedUrl) {
        attachmentsWithCache.push({
          attachmentId: attachment.attachmentId,
          signedUrl: cachedUrl as TSignedAttachmentUrl,
        });
      } else {
        attachmentsToGenerate.push(attachment);
      }
    }

    this.logger.debug(
      'Cache status: %d/%d URLs cached, %d to generate',
      attachmentsWithCache.length,
      attachments.length,
      attachmentsToGenerate.length,
    );

    // Generate signed URLs only for non-cached attachments
    let newlyGeneratedResults: {attachmentId: TAttachment['id']; signedUrl: TSignedAttachmentUrl}[] = [];
    if (attachmentsToGenerate.length > 0) {
      this.logger.debug('Generating %d signed URLs from S3', attachmentsToGenerate.length);

      newlyGeneratedResults = await Promise.all(
        attachmentsToGenerate.map(async attachment => {
          const signedUrl = await getSignedUrl(
            this.s3Client,
            new GetObjectCommand({
              Bucket: this.bucketName,
              Key: attachment.objectStoreLocation,
            }),
            {expiresIn: ttl},
          );
          return {
            attachmentId: attachment.attachmentId,
            signedUrl,
          } as (typeof newlyGeneratedResults)[number];
        }),
      );

      if (cacheable) {
        await this.cache.writeSignedAttachmentUrls(
          newlyGeneratedResults.map(({attachmentId, signedUrl}) => ({
            attachmentId,
            signedUrl,
            ttlSeconds: ttl,
          })),
        );
      }

      this.logger.debug('Successfully cached %d newly generated signed URLs', newlyGeneratedResults.length);
    }

    // Combine all URLs maintaining original order
    const urlMap = new Map<TAttachment['id'], TSignedAttachmentUrl>();
    for (const {attachmentId, signedUrl: url} of [...attachmentsWithCache, ...newlyGeneratedResults]) {
      urlMap.set(attachmentId, url);
    }
    const allSignedUrls = attachments.map(({attachmentId}) => ({
      attachmentId: attachmentId,
      signedUrl: urlMap.get(attachmentId),
    }));

    const source =
      attachmentsWithCache.length > 0 && newlyGeneratedResults.length > 0
        ? undefined // "mixed" source
        : attachmentsWithCache.length > 0
          ? 'cache'
          : 'object_store';

    this.logger.info(
      'Successfully retrieved %d attachments (%d cached, %d generated) with ttl %ds',
      allSignedUrls.length,
      attachmentsWithCache.length,
      newlyGeneratedResults.length,
      ttl,
    );

    return {signedUrls: urlMap, source};
  }

  protected async cleanupStorageObjects(locations: readonly string[]): Promise<void> {
    if (locations.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {Objects: locations.map(Key => ({Key}))},
    });

    for (let attempt = 1; attempt <= STORAGE_CLEANUP_ATTEMPTS; attempt += 1) {
      try {
        await this.s3Client.send(command);
        return;
      } catch (error) {
        if (attempt === STORAGE_CLEANUP_ATTEMPTS) {
          this.logger.error(
            'Unable to clean up attachment objects from storage',
            error instanceof Error ? error : new Error(String(error)),
            {
              locations,
            },
          );
          return;
        }

        this.logger.warn('Retrying attachment object cleanup', {attempt, locations});
      }
    }
  }

  /**
   * Delete attachments from S3 and database
   */
  public async deleteAttachments(userId: string, attachmentIds: string[]): Promise<number> {
    // Find attachments owned by user
    const targetAttachments = await this.findByOwnerAndIds(userId, attachmentIds);

    if (targetAttachments.length === 0) {
      this.logger.warn('No valid attachments found to delete for user %s', userId);
      return 0;
    }

    // Delete database metadata first so failed storage cleanup cannot leave broken attachment records.
    await db.delete(attachments).where(and(eq(attachments.ownerId, userId), inArray(attachments.id, attachmentIds)));
    this.logger.info('Deleted %d attachment entries from database for user %s', attachmentIds.length, userId);

    // ponytail: request-scoped cleanup retries; persist an outbox if crash recovery is required.
    await this.cleanupStorageObjects(targetAttachments.map(({location}) => location));
    this.logger.debug('Deleted %d attachments from S3', targetAttachments.length);

    // Clear cache for deleted attachments
    await Promise.all(targetAttachments.map(({id}) => this.cache.deleteSignedAttachmentUrl(id)));

    return targetAttachments.length;
  }
}
