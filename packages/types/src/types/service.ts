export type ServiceResponse<T, E extends Error = Error> = [T, null] | [null, E];
