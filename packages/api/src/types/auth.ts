export type Entity = 'transaction' | 'recurringPayment' | 'budget' | 'category' | 'paymentMethod';

export type EntityAction = 'create' | 'read' | 'update' | 'delete';

export type EntityOperation = 'read' | 'write';

export type Permission = `${Entity}:${EntityOperation}`;

export type PermissionConfig = Partial<Record<Entity, EntityOperation[]>>;
