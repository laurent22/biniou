import BaseService from "./BaseService";
import { Event, EventBodyType } from "../db";
import md5 = require("md5");
import EventModel from "../models/EventModel";

export default class EventService extends BaseService {

	async dispatchEvent(jobId:string, eventName:string, eventBody:any, options:any = {}) {
		options = Object.assign({
			allowDuplicates: true,
		}, options);

		const bodyType:EventBodyType = typeof eventBody === 'string' ? EventBodyType.String : EventBodyType.Object;
		const eventBodySerialized:string = bodyType === EventBodyType.String ? eventBody : JSON.stringify(eventBody)
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
	}

}