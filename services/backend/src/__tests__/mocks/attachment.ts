import {mock, type AnyMock} from './mock';

type AttachmentServiceMock = {
  verifyOwnership: AnyMock;
  generateSignedUrl: AnyMock;
  generateSignedUrls: AnyMock;
  findAttachmentsByTransactionId: AnyMock;
  deleteAttachmentsByTransactionId: AnyMock;
  deleteAttachments: AnyMock;
  uploadTransactionAttachments: AnyMock;
  uploadAttachments: AnyMock;
};

/** Instance methods used by the shared attachment service across all tests. */
export const attachmentService: AttachmentServiceMock = {
  verifyOwnership: mock(),
  generateSignedUrl: mock(),
  generateSignedUrls: mock(),
  findAttachmentsByTransactionId: mock(),
  deleteAttachmentsByTransactionId: mock(),
  deleteAttachments: mock(),
  uploadTransactionAttachments: mock(),
  uploadAttachments: mock(),
};

type HandlerMock = AnyMock & {
  getFileExtension: AnyMock;
  resolveMimeType: AnyMock;
  hasValidImageSignature: AnyMock;
  prepareAttachmentBuffer: AnyMock;
};

/** Constructor double; `new TransactionAttachmentHandler(...)` yields `attachmentService`. */
export const TransactionAttachmentHandler = Object.assign(
  mock(function TransactionAttachmentHandlerMock() {
    return attachmentService;
  }),
  {
    getFileExtension: mock(() => 'pdf'),
    resolveMimeType: mock((file: Express.Multer.File) => file.mimetype),
    hasValidImageSignature: mock(() => true),
    prepareAttachmentBuffer: mock(),
  },
) as HandlerMock;

export function resetAttachmentMock(): void {
  for (const fn of Object.values(attachmentService)) fn.mockReset();
  for (const value of Object.values(TransactionAttachmentHandler)) {
    if (typeof value === 'function' && 'mockReset' in value) (value as AnyMock).mockReset();
  }
  TransactionAttachmentHandler.getFileExtension.mockReturnValue('pdf');
  TransactionAttachmentHandler.resolveMimeType.mockImplementation(file => file.mimetype);
  TransactionAttachmentHandler.hasValidImageSignature.mockReturnValue(true);
}
