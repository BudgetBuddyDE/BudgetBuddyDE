import {PutObjectCommand} from '@aws-sdk/client-s3';
import type {TAttachment, TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {attachments, transactionAttachments} from '@budgetbuddyde/db/backend';
import {and, count, eq, inArray} from 'drizzle-orm';
import {uuidv7} from 'uuidv7';
import {db} from '../../db';
import {AttachmentHandler} from './attachment.handler';

type AttachmentWithSignedUrl = {
  id: TAttachment['id'];
  ownerId: string;
  fileName: string;
  fileExtension: string;
  contentType: string;
  location: string;
  createdAt: Date;
  signedUrl: TAttachmentWithUrl['signedUrl'];
};

type PaginationQuery = {
  from?: number;
  to?: number;
  ttl?: number;
};

export class TransactionAttachmentHandler extends AttachmentHandler {
  private generateAttachmentStoragePath(
    userId: string,
    transactionId: string,
    attachmentId: string,
    fileExtension: string,
  ): string {
    return `${userId}/transactions/${transactionId}/${attachmentId}.${fileExtension}`;
  }

  /**
   * Upload one or more files for a specific transaction.
   * Creates attachment records, uploads to S3, and creates junction table entries.
   */
  async uploadTransactionAttachments(
    userId: string,
    transactionId: string,
    files: Express.Multer.File[],
  ): Promise<AttachmentWithSignedUrl[]> {
    const prepared = files.map(file => {
      const attachmentId = uuidv7() as TAttachment['id'];
      const fileExtension = AttachmentHandler.getFileExtension(file);
      const mimeType = AttachmentHandler.resolveMimeType(file);
      const location = this.generateAttachmentStoragePath(userId, transactionId, attachmentId, fileExtension);
      return {attachmentId, fileExtension, mimeType, location, file};
    });

    // Insert all attachment records and junction table entries in a single transaction
    await db.transaction(async tx => {
      await tx.insert(attachments).values(
        prepared.map(({attachmentId, fileExtension, mimeType, location, file}) => ({
          id: attachmentId,
          ownerId: userId,
          fileName: file.originalname,
          fileExtension,
          contentType: mimeType,
          location,
        })),
      );
      await tx.insert(transactionAttachments).values(prepared.map(({attachmentId}) => ({transactionId, attachmentId})));
      this.logger.debug('Registered %d attachments for transaction %s', prepared.length, transactionId, {
        transactionId,
      });
    });

    // Upload all files to S3 in parallel
    await Promise.all(
      prepared.map(({attachmentId, mimeType, location, file}) => {
        this.logger.debug('Uploading attachment %s to S3 at %s', attachmentId, location, {attachmentId, location});
        return this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: location,
            Body: file.buffer,
            ContentType: mimeType,
          }),
        );
      }),
    );
    this.logger.info('Uploaded %d attachments for transaction %s', prepared.length, transactionId, {transactionId});

    // Generate signed URLs for all uploaded files
    const {signedUrls} = await this.generateSignedUrls(
      prepared.map(({attachmentId, location}) => ({attachmentId, objectStoreLocation: location})),
      {ttl: this.defaultTtl},
    );

    return prepared.map(({attachmentId, fileExtension, mimeType, location, file}) => ({
      id: attachmentId,
      ownerId: userId,
      fileName: file.originalname,
      fileExtension,
      contentType: mimeType,
      location,
      createdAt: new Date(),
      signedUrl: signedUrls.get(attachmentId) as TAttachmentWithUrl['signedUrl'],
    }));
  }

  /**
   * Find all transaction attachments for the authenticated user (paginated).
   */
  async findTransactionAttachmentsByOwner(
    userId: string,
    query: PaginationQuery = {},
  ): Promise<{attachments: AttachmentWithSignedUrl[]; totalCount: number}> {
    const {from = 0, to, ttl} = query;
    const limit = to !== undefined ? to - from : 50;

    const [totalCountResult, records] = await Promise.all([
      db
        .select({count: count()})
        .from(attachments)
        .innerJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
        .where(eq(attachments.ownerId, userId)),
      db
        .select({
          id: attachments.id,
          ownerId: attachments.ownerId,
          fileName: attachments.fileName,
          fileExtension: attachments.fileExtension,
          contentType: attachments.contentType,
          location: attachments.location,
          createdAt: attachments.createdAt,
        })
        .from(attachments)
        .innerJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
        .where(eq(attachments.ownerId, userId))
        .offset(from)
        .limit(limit),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;

    if (records.length === 0) {
      this.logger.warn('No transaction attachments found for user %s', userId);
      return {attachments: [], totalCount};
    }

    const {signedUrls} = await this.generateSignedUrls(
      records.map(r => ({
        attachmentId: r.id as TAttachment['id'],
        objectStoreLocation: r.location,
      })),
      {ttl},
    );

    const result: AttachmentWithSignedUrl[] = records.map(r => ({
      ...r,
      id: r.id as TAttachment['id'],
      signedUrl: signedUrls.get(r.id as TAttachment['id']) as TAttachmentWithUrl['signedUrl'],
    }));

    this.logger.info('Retrieved %d/%d transaction attachments for user %s', result.length, totalCount, userId);
    return {attachments: result, totalCount};
  }

  /**
   * Find all attachments for a specific transaction (paginated).
   */
  async findAttachmentsByTransactionId(
    userId: string,
    transactionId: string,
    query: PaginationQuery = {},
  ): Promise<{attachments: AttachmentWithSignedUrl[]; totalCount: number}> {
    const {from = 0, to, ttl} = query;
    const limit = to !== undefined ? to - from : 50;

    const ownerAndTransaction = and(
      eq(attachments.ownerId, userId),
      eq(transactionAttachments.transactionId, transactionId),
    );

    const [totalCountResult, records] = await Promise.all([
      db
        .select({count: count()})
        .from(attachments)
        .innerJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
        .where(ownerAndTransaction),
      db
        .select({
          id: attachments.id,
          ownerId: attachments.ownerId,
          fileName: attachments.fileName,
          fileExtension: attachments.fileExtension,
          contentType: attachments.contentType,
          location: attachments.location,
          createdAt: attachments.createdAt,
        })
        .from(attachments)
        .innerJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
        .where(ownerAndTransaction)
        .offset(from)
        .limit(limit),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;

    if (records.length === 0) {
      this.logger.warn('No attachments found for transaction %s (user %s)', transactionId, userId);
      return {attachments: [], totalCount};
    }

    const {signedUrls} = await this.generateSignedUrls(
      records.map(r => ({
        attachmentId: r.id as TAttachment['id'],
        objectStoreLocation: r.location,
      })),
      {ttl},
    );

    const result: AttachmentWithSignedUrl[] = records.map(r => ({
      ...r,
      id: r.id as TAttachment['id'],
      signedUrl: signedUrls.get(r.id as TAttachment['id']) as TAttachmentWithUrl['signedUrl'],
    }));

    this.logger.info('Retrieved %d/%d attachments for transaction %s', result.length, totalCount, transactionId);
    return {attachments: result, totalCount};
  }

  /**
   * Delete specific attachments from a transaction.
   * If no attachmentIds are provided, all attachments for that transaction are deleted.
   */
  async deleteTransactionAttachments(userId: string, transactionId: string, attachmentIds?: string[]): Promise<number> {
    const baseCondition = and(eq(attachments.ownerId, userId), eq(transactionAttachments.transactionId, transactionId));
    const whereCondition =
      attachmentIds && attachmentIds.length > 0
        ? and(baseCondition, inArray(attachments.id, attachmentIds))
        : baseCondition;

    const targets = await db
      .select({id: attachments.id, location: attachments.location})
      .from(attachments)
      .innerJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
      .where(whereCondition);

    if (targets.length === 0) {
      this.logger.warn('No attachments found to delete for transaction %s (user %s)', transactionId, userId);
      return 0;
    }

    const deletedCount = await this.deleteAttachments(
      userId,
      targets.map(t => t.id),
    );

    this.logger.info('Deleted %d attachments for transaction %s (user %s)', deletedCount, transactionId, userId);
    return deletedCount;
  }
}
