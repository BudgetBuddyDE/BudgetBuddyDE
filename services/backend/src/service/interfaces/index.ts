export interface ICRUDService<EntityId, Entity, UpdatePayload> {
  search(query: string): Promise<Entity[]>;
  // getAll(): Promise<Entity[]>;
  getById(entityId: EntityId): Promise<Entity | null>;
  // create(entity: CreatePayload[]): Promise<Entity[]>;
  updateById(entityId: EntityId, payload: UpdatePayload): Promise<Entity | null>;
  deleteById(entityId: EntityId): Promise<Entity | null>;
}
