export type Entity = 'transaction' | 'recurringPayment' | 'budget' | 'category' | 'paymentMethod';

export type EntityOperation = 'create' | 'read' | 'update' | 'delete';

export type Permission = `${Entity}:${EntityOperation}`;

export type PermissionConfig = Partial<Record<Entity, EntityOperation[]>>;
