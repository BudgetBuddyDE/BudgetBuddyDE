import {z} from 'zod';

const recurringPaymentSnapshotSchema = z.object({
  version: z.literal(1),
  ownerId: z.string(),
  scheduledFor: z.iso.date(),
  categoryId: z.uuid(),
  paymentMethodId: z.uuid(),
  receiver: z.string(),
  transferAmount: z.number(),
  information: z.string().nullable(),
});

type TRecurringPaymentSnapshotInput = z.input<typeof recurringPaymentSnapshotSchema>;

export function createPaymentSnapshot(
  payment: Omit<TRecurringPaymentSnapshotInput, 'version' | 'scheduledFor'>,
  scheduledFor: string,
): string {
  return JSON.stringify(recurringPaymentSnapshotSchema.parse({...payment, version: 1, scheduledFor}));
}

export function parsePaymentSnapshot(content: string) {
  return recurringPaymentSnapshotSchema.parse(JSON.parse(content));
}
