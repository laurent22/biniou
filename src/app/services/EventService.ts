import BaseService from './BaseService';
import { Event, EventBodyType } from '../db';
import md5 = require('md5');
import EventModel from '../models/EventModel';
import JobResultModel from '../models/JobResultModel';

export default class EventService extends BaseService {

	// private dispatchCount_: number = 0;

	public async waitForDispatches(): Promise<boolean> {
		return new Promise((resolve) => {
			const iid = setInterval(() => {
				clearInterval(iid);
				resolve(true);
			}, 50);
		});
	}

	public async dispatchEvent(jobId: string, eventType: string, eventBody: any, options: any = {}): Promise<boolean> {
		options = Object.assign({
			allowDuplicates: true,
		}, options);

		const bodyType: EventBodyType = typeof eventBody === 'string' ? EventBodyType.String : EventBodyType.Object;
		const eventBodySerialized: string = bodyType === EventBodyType.String ? eventBody : JSON.stringify(eventBody);
		const hash = md5(escape(eventBodySerialized));

		const eventModel = new EventModel();

		if (!options.allowDuplicates) {
			const existingEvent = await eventModel.loadByHash(hash);
			if (existingEvent) return false;
		}

		const now = Date.now();

		const event: Event = {
			job_id: jobId,
			type: eventType,
			body_type: bodyType,
			body: eventBodySerialized,
			created_time: now,
			updated_time: now,
			hash: hash,
		};

		await eventModel.save(event);

		return true;
	}

	public async nextEvents(jobId: string, eventType: string): Promise<Event[]> {
		const jobResultModel = new JobResultModel();
		const lastJobResult = await jobResultModel.lastByJobAndEvent(jobId, eventType);
		const eventModel: EventModel = new EventModel();

		return eventModel.eventsSince2(
			eventType,
			lastJobResult ? lastJobResult.event_id : null,
			lastJobResult ? lastJobResult.created_time : 0,
			100,
		);
	}

}
