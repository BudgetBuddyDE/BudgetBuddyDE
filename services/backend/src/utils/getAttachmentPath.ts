export type AttachmentPath =
  | `avatars/${string}/${string}.${string}`
  | `transactions/${string}/${string}/${string}.${string}`
  | `transactions/${string}/`;
export type GetAttachmentPathArgs =
  | {usage: 'avatar'; userId: string; attachmentId: string; fileExtension: string}
  | {usage: 'transaction'; userId: string; transactionId: string; attachmentId: string; fileExtension: string}
  | {usage: 'transaction_base'; userId: string};

export function getAttachmentPath(args: GetAttachmentPathArgs): AttachmentPath {
  switch (args.usage) {
    case 'avatar':
      return `avatars/${args.userId}/${args.attachmentId}.${args.fileExtension}`;
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
