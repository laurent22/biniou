import db, { Event } from '../db';
import config from '../config';
import uuidgen from '../utils/uuidgen';
import BaseModel, { ModelOptions } from './BaseModel';

export default class EventModel extends BaseModel {

	get tableName():string {
		return 'events';
	}

	async loadByHash(hash:string):Promise<Event> {
		return this.db(this.tableName).select(this.defaultFields).where({ hash: hash }).first();
	}

}
