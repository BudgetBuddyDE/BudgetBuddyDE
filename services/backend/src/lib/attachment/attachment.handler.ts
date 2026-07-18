import path from 'node:path';
import {gzipSync} from 'node:zlib';
import type {S3Client} from '@aws-sdk/client-s3';
import {DeleteObjectsCommand, GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import type {TypeOfSchema} from '@budgetbuddyde/api';
import type {IGetAllAttachmentsQuery, TAttachment, TSignedAttachmentUrl} from '@budgetbuddyde/api/attachment';
import {type AttachmentSchemas, attachments} from '@budgetbuddyde/db/backend';
import {and, eq, inArray} from 'drizzle-orm';
import sharp from 'sharp';
import type winston from 'winston';
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

type UploadFileOptions = Pick<
  TAttachment,
  'id' | 'ownerId' | 'fileName' | 'fileExtension' | 'contentType' | 'location'
> & {
  fileBuffer: Buffer;
};

export type AttachmentHandlerOptions = {
  ttl: number;
};

export abstract class AttachmentHandler {
  protected readonly s3Client: S3Client;
  protected readonly logger: winston.Logger;
  protected readonly bucketName: string;
  protected readonly cache: AttachmentCache;
  protected readonly defaultTtl: number = config.attachments.signedUrlTtlSeconds;

  constructor(bucket: string, options?: Partial<AttachmentHandlerOptions>) {
    this.s3Client = getS3Client();
    this.logger = logger.child({label: this.constructor.name});
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

  private static async optimizeImageBuffer(fileBuffer: Buffer, contentType: string): Promise<Buffer> {
    const image = sharp(fileBuffer, {failOn: 'none'}).rotate().resize({
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

    const compressedBuffer = gzipSync(fileBuffer);

    if (compressedBuffer.length >= fileBuffer.length) {
      return {buffer: fileBuffer, optimization: 'none'};
    }

    return {buffer: compressedBuffer, contentEncoding: 'gzip', optimization: 'gzip'};
  }

  private static readonly MAX_IMAGE_DIMENSION_PX = 1920;

  private static readonly OPTIMIZABLE_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);

  private static isOptimizableImage(contentType: string): boolean {
    return AttachmentHandler.OPTIMIZABLE_IMAGE_MIME_TYPES.has(contentType);
  }

  private static async optimizeImageBuffer(fileBuffer: Buffer, contentType: string): Promise<Buffer> {
    const image = sharp(fileBuffer, {failOn: 'none'}).rotate().resize({
      width: AttachmentHandler.MAX_IMAGE_DIMENSION_PX,
      height: AttachmentHandler.MAX_IMAGE_DIMENSION_PX,
      fit: 'inside',
      withoutEnlargement: true,
    });

    switch (contentType) {
      case 'image/jpeg':
      case 'image/jpg':
        return image.jpeg({quality: 82, mozjpeg: true}).toBuffer();
      case 'image/png':
        return image.png({compressionLevel: 9, palette: true}).toBuffer();
      case 'image/webp':
        return image.webp({quality: 82}).toBuffer();
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

    const compressedBuffer = gzipSync(fileBuffer);

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

    // Check cache first
    const cachedUrl = await this.cache.retrieveSignedAttachmentUrl(attachment.id);
    if (cachedUrl) {
      this.logger.debug('Serving signed URL for attachment %s from cache', attachment.id);
      return cachedUrl;
    }

    // Generate new signed URL
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: attachment.location,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {expiresIn: ttl});

    // Cache the URL
    await this.cache.writeSignedAttachmentUrl(attachment.id, signedUrl, ttl);
    this.logger.debug('Generated signed URL for attachment %s and cached with TTL %d', attachment.id, ttl);

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

    // Check cache for all attachments in parallel
    const cachedResults = await Promise.all(
      attachments.map(async attachment => ({
        attachment,
        cachedUrl: await this.cache.retrieveSignedAttachmentUrl(attachment.attachmentId),
      })),
    );

    // Separate cached from non-cached attachments
    const attachmentsWithCache: {attachmentId: TAttachment['id']; signedUrl: TSignedAttachmentUrl}[] = [];
    const attachmentsToGenerate: typeof attachments = [];

    for (const {attachment, cachedUrl} of cachedResults) {
      if (cachedUrl) {
        attachmentsWithCache.push({attachmentId: attachment.attachmentId, signedUrl: cachedUrl});
      } else {
        attachmentsToGenerate.push({
          attachmentId: attachment.attachmentId,
          objectStoreLocation: attachment.objectStoreLocation,
        });
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

      // Cache newly generated URLs in parallel
      await Promise.all(
        newlyGeneratedResults.map(({attachmentId, signedUrl: url}) =>
          this.cache.writeSignedAttachmentUrl(attachmentId, url, ttl),
        ),
      );

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

  /**
   * Upload file to S3 and create database record
   */
  public async uploadFile(options: UploadFileOptions): Promise<void> {
    // Insert into database first
    await db.insert(attachments).values({
      id: options.id,
      ownerId: options.ownerId,
      fileName: options.fileName,
      fileExtension: options.fileExtension,
      contentType: options.contentType as string,
      location: options.location,
    });

    this.logger.debug('Inserted attachment metadata into database', {attachmentId: options.id});

    const preparedBuffer = await AttachmentHandler.prepareAttachmentBuffer(
      options.fileBuffer,
      options.contentType as string,
    );

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: options.location,
      Body: preparedBuffer.buffer,
      ContentType: options.contentType as string,
      ContentEncoding: preparedBuffer.contentEncoding,
    });

    this.logger.debug('Uploading file %s to S3 at %s', options.id, options.location);
    await this.s3Client.send(command);
    this.logger.info('File uploaded successfully', {attachmentId: options.id});
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

    // Delete from S3
    const objectsToDelete = targetAttachments.map(({location}) => ({Key: location}));
    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: objectsToDelete,
      },
    });

    await this.s3Client.send(command);
    this.logger.debug('Deleted %d attachments from S3', objectsToDelete.length);

    // Delete from database
    await db.delete(attachments).where(and(eq(attachments.ownerId, userId), inArray(attachments.id, attachmentIds)));
    this.logger.info('Deleted %d attachment entries from database for user %s', attachmentIds.length, userId);

    // Clear cache for deleted attachments
    await Promise.all(attachmentIds.map(id => this.cache.deleteSignedAttachmentUrl(id)));

    return targetAttachments.length;
  }
}
