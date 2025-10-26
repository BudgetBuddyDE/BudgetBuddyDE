import type { OdataQuery } from "@tklein1801/o.js";

export interface IEntityService {
	$servicePath: string;
	$entityPath: string;
	$valueHelpPath: string | undefined;
	create<Payload, Response>(payload: Payload): Promise<Response>;
	getAll<Query extends OdataQuery, Response>(
		query?: Query,
	): Promise<Response[]>;
	getById<IdType, Query extends OdataQuery, Response>(
		id: IdType,
		query?: Query,
	): Promise<Response>;
	getValueHelps?<Query extends OdataQuery, Response>(
		query?: Query,
	): Promise<Response>;
	updateById<IdType, Payload, Response>(
		id: IdType,
		payload: Payload,
	): Promise<Response>;
	deleteById<IdType>(id: IdType): Promise<boolean>;
}

export type TEntityServiceOptions = {
	$servicePath: string;
	$entityPath: string;
	$valueHelpPath?: string;
};
