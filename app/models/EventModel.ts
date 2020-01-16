import { Event } from '../db';
import BaseModel from './BaseModel';

export default class EventModel extends BaseModel {

	get tableName():string {
		return 'events';
	}

	async loadByHash(hash:string):Promise<Event> {
		return this.db(this.tableName).select(this.defaultFields).where({ hash: hash }).first();
	}

}
