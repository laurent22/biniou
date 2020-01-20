import { Event } from '../db';
import BaseModel from './BaseModel';

export default class EventModel extends BaseModel {

	get tableName():string {
		return 'events';
	}

	async loadByHash(hash:string):Promise<Event> {
		return this.db(this.tableName).select(this.defaultFields).where({ hash: hash }).first();
	}

	async eventsSince(eventName:string, sinceDate:number, sinceIds:string[], limit:number = 100):Promise<Event[]> {
		return this
			.db(this.tableName)
			.select(this.defaultFields)
			.where('name', '=', eventName)
			.where('created_time', '>=', sinceDate)
			.whereNotIn('id', sinceIds)
			.limit(limit);
	}

}
