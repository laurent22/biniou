import db, { WithDates, WithUuid, Event, Job, JobState, databaseSchema, JobResult } from '../db';
import * as Knex from 'knex';
import uuidgen from '../utils/uuidgen';
import { ErrorUnprocessableEntity, ErrorBadRequest } from '../utils/errors';
import TransactionHandler from '../utils/TransactionHandler';

export interface ModelOptions {

}

export interface SaveOptions {
	isNew?: boolean;
	skipValidation?: boolean;
	validationRules?: any;
	autoTimestamp?: boolean;
}

export interface DeleteOptions {
	validationRules?: any;
}

export interface ValidateOptions {
	isNew?: boolean;
	rules?: any;
}

export default abstract class BaseModel {

	// private options_: ModelOptions = null;
	private defaultFields_: string[] = [];
	private transactionHandler_: TransactionHandler = null;
	private db_: Knex;

	public constructor(_options: ModelOptions = null) {
		// this.options_ = Object.assign({}, options);
		this.db_ = db();
	}

	protected hasUuid(): boolean {
		return true;
	}

	private get transactionHandler(): TransactionHandler {
		if (this.transactionHandler_) return this.transactionHandler_;
		this.transactionHandler_ = new TransactionHandler(this.db_);
		return this.transactionHandler_;
	}

	// get options(): ModelOptions {
	// 	return this.options_;
	// }

	protected get db(): Knex<any, any[]> {
		if (this.transactionHandler.activeTransaction) return this.transactionHandler.activeTransaction;
		return this.db_;
	}

	protected get defaultFields(): string[] {
		if (!this.defaultFields_.length) {
			const schema = databaseSchema[this.tableName];
			if (!schema) throw new Error(`Invalid table name: ${this.tableName}`);
			this.defaultFields_ = Object.keys(schema);
		}
		return this.defaultFields_.slice();
	}

	protected get tableName(): string {
		throw new Error('Not implemented');
	}

	protected hasDateProperties(): boolean {
		return true;
	}

	// async startTransaction(): Promise<number> {
	// 	return this.transactionHandler.start();
	// }

	// async commitTransaction(txIndex: number): Promise<void> {
	// 	return this.transactionHandler.commit(txIndex);
	// }

	// async rollbackTransaction(txIndex: number): Promise<void> {
	// 	return this.transactionHandler.rollback(txIndex);
	// }

	public async all(): Promise<Event[] | Job[] | JobState[] | JobResult[]> {
		return this.db(this.tableName).select(...this.defaultFields);
	}

	// async fromApiInput(object: Event | Job | JobState | JobResult): Promise<Event | Job | JobState | JobResult> {
	// 	return object;
	// }

	// toApiOutput(object: any): any {
	// 	return { ...object };
	// }

	protected async validate(object: Event | Job | JobState | JobResult, options: ValidateOptions = {}): Promise<Event | Job | JobState | JobResult> {
		if (!options.isNew && !(object as WithUuid).id) throw new ErrorUnprocessableEntity('id is missing');
		return object;
	}

	private async isNew(object: Event | Job | JobState | JobResult, options: SaveOptions): Promise<boolean> {
		if (options.isNew === false) return false;
		if (options.isNew === true) return true;
		return !(object as WithUuid).id;
	}

	public async save(object: Event | Job | JobState | JobResult, options: SaveOptions = {}): Promise<Event | Job | JobState | JobResult> {
		if (!object) throw new Error('Object cannot be empty');
		if (options.autoTimestamp === undefined) options.autoTimestamp = true;

		const toSave = Object.assign({}, object);

		const isNew = await this.isNew(object, options);

		if (isNew && !(toSave as WithUuid).id && this.hasUuid()) {
			(toSave as WithUuid).id = uuidgen();
		}

		if (this.hasDateProperties() && options.autoTimestamp) {
			const timestamp = Date.now();
			if (isNew) {
				(toSave as WithDates).created_time = timestamp;
			}
			(toSave as WithDates).updated_time = timestamp;
		}

		if (options.skipValidation !== true) object = await this.validate(object, { isNew: isNew, rules: options.validationRules ? options.validationRules : {} });

		if (isNew) {
			await this.db(this.tableName).insert(toSave);
		} else {
			const objectId: string = (toSave as WithUuid).id;
			if (!objectId) throw new Error('Missing "id" property');
			// await cache.delete(objectId);
			delete (toSave as WithUuid).id;
			const updatedCount: number = await this.db(this.tableName).update(toSave).where({id: objectId });
			toSave.id = objectId;

			// Sanity check:
			if (updatedCount !== 1) throw new ErrorBadRequest(`one row should have been updated, but ${updatedCount} row(s) were updated`);
		}

		return toSave;
	}

	public async load(id: string): Promise<Event | Job | JobState | JobResult> {
		if (!id) throw new Error('id cannot be empty');

		return this.db(this.tableName).select(this.defaultFields).where({ id: id }).first();

		// let cached:object = await cache.object(id);
		// if (cached) return cached;

		// cached = await this.db(this.tableName).select(this.defaultFields).where({ id: id }).first();
		// await cache.setObject(id, cached);
		// return cached;
	}

	public async delete(id: string | string[]): Promise<void> {
		if (!id) throw new Error('id cannot be empty');

		const ids = typeof id === 'string' ? [id] : id;

		if (!ids.length) throw new Error('no id provided');

		const query = this.db(this.tableName).where({ id: ids[0] });
		for (let i = 1; i < ids.length; i++) void query.orWhere({ id: ids[i] });

		// await cache.delete(ids);

		const deletedCount = await query.del();
		if (deletedCount !== ids.length) throw new Error(`${ids.length} row(s) should have been deleted by ${deletedCount} row(s) were deleted`);
	}

}
