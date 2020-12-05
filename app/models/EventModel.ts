import { Event } from '../db';
import BaseModel from './BaseModel';

export default class EventModel extends BaseModel {

	get tableName():string {
		return 'events';
	}

	async loadByHash(hash:string):Promise<Event> {
		return this.db(this.tableName).select(this.defaultFields).where({ hash: hash }).first();
	}

	public async eventsSince2(eventName:string, eventId:string, eventCreatedTime:number, limit:number = 10):Promise<Event[]> {
		if (!eventId) {
			return this
				.db(this.tableName)
				.select(this.defaultFields)
				.where('name', '=', eventName)
				.orderBy([
					{ column: 'created_time', order: 'asc' },
					{ column: 'id', order: 'asc' },
				])
				.limit(limit);
		} else {
			const lastEvent = await this.load(eventId) as Event;

			if (!lastEvent) {
				// Fallback - normally shouldn't be needed
				// TODO: log: throw new Error('Cannot return events since event "' + eventId + '" as this is an invalid ID or the event has been deleted');
				return this
					.db(this.tableName)
					.select(this.defaultFields)
					.where('name', '=', eventName)
					.andWhere('created_time', '>=', eventCreatedTime)
					.orderBy([
						{ column: 'created_time', order: 'asc' },
						{ column: 'id', order: 'asc' },
					])
					.limit(limit);
			} else {
				// Make use of SQL Row Values to iterate over the events, starting
				// from the last event that was processed. Since events don't have a
				// numeric ID, but a random string, we need to iterate based on both
				// the ID and created_time. We also can't iterate based on
				// created_time only since two events might have the same timestamp.
				//
				// https://use-the-index-luke.com/sql/partial-results/fetch-next-page

				return this
					.db(this.tableName)
					.select(this.defaultFields)
					.where('name', '=', eventName)
					.whereRaw('(created_time, id) > (?, ?)', [lastEvent.created_time, eventId])
					.orderBy([
						{ column: 'created_time', order: 'asc' },
						{ column: 'id', order: 'asc' },
					])
					.limit(limit);
			}
		}
	}

	async eventsSince(eventName:string, sinceDate:number, sinceIds:string[], limit:number = 100):Promise<Event[]> {
		const results = await this
			.db(this.tableName)
			.select(this.defaultFields)
			.where('name', '=', eventName)
			.where('created_time', '>=', sinceDate)
			.limit(limit);

		return results.filter((e:Event) => {
			if (e.created_time > sinceDate) return true;
			return !sinceIds.includes(e.id);
		});
	}

}
