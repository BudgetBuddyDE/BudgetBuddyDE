export type AttachmentPath =
  | `transactions/${string}/${string}/${string}.${string}`
  | `transactions/${string}/`;
export type GetAttachmentPathArgs =
  | {usage: 'transaction'; userId: string; transactionId: string; attachmentId: string; fileExtension: string}
  | {usage: 'transaction_base'; userId: string};

export function getAttachmentPath(args: GetAttachmentPathArgs): AttachmentPath {
  switch (args.usage) {
    case 'transaction':
    case 'transaction_base': {
      const base = `transactions/${args.userId}/` as const;
      return args.usage === 'transaction_base'
        ? base
        : `${base}${args.transactionId}/${args.attachmentId}.${args.fileExtension}`;
    }
    default:
      throw new Error(`Unsupported attachment usage: ${args}`);
  }
}