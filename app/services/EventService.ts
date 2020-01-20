import BaseService from './BaseService';
import { Event, EventBodyType } from '../db';
import md5 = require('md5');
import EventModel from '../models/EventModel';
import { JobStateContext } from '../models/JobStateModel';

export default class EventService extends BaseService {

	dispatchCount_:number = 0;

	async waitForDispatches():Promise<boolean> {
		return new Promise((resolve) => {
			const iid = setInterval(() => {
				clearInterval(iid);
				resolve(true);
			}, 50);
		});
	}

	async dispatchEvent(jobId:string, eventName:string, eventBody:any, options:any = {}) {
		this.dispatchCount_++;

		options = Object.assign({
			allowDuplicates: true,
		}, options);

		try {
			const bodyType:EventBodyType = typeof eventBody === 'string' ? EventBodyType.String : EventBodyType.Object;
			const eventBodySerialized:string = bodyType === EventBodyType.String ? eventBody : JSON.stringify(eventBody);
			const hash = md5(escape(eventBodySerialized));

			const eventModel = new EventModel();

			if (!options.allowDuplicates) {
				const existingEvent = await eventModel.loadByHash(hash);
				if (existingEvent) return;
			}

			const now = Date.now();

			const event:Event = {
				job_id: jobId,
				name: eventName,
				body_type: bodyType,
				body: eventBodySerialized,
				created_time: now,
				updated_time: now,
				hash: hash,
			};

			await eventModel.save(event);
		} catch (error) {
			this.dispatchCount_--;
			throw error;
		}

		this.dispatchCount_--;
	}

	async eventsSince(eventName:string, context:JobStateContext):Promise<Event[]> {
		const eventModel:EventModel = new EventModel();
		const c = context.events[eventName];
		const sinceTime = c && c.lastTimestamp ? c.lastTimestamp : 0;
		const sinceHashes = c && c.lastHashes ? c.lastHashes : [];
		return eventModel.eventsSince(eventName, sinceTime, sinceHashes);
	}

}
