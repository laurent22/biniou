import { afterAllSetup, beforeEachSetup, initDatabase } from '../../tests/testUtils';
import EventModel from './EventModel';
import { msleep } from '../utils/timeUtils';
import { Event } from '../db';
import { SaveOptions } from './BaseModel';

describe('EventModel', function() {

	beforeEach(async () => {
		await beforeEachSetup();
	});

	afterAll(async () => {
		await afterAllSetup();
	});

	it('should return last events 2', async function() {
		const eventModel = new EventModel();
		const baseProps:Event = { name: 'test', job_id: 'test', hash: '123' };

		await eventModel.save({ ...baseProps, body: 'one' }); await msleep(1);
		await eventModel.save({ ...baseProps, body: 'two' }); await msleep(1);
		await eventModel.save({ ...baseProps, body: 'three' }); await msleep(1);

		const events = await eventModel.eventsSince2('test', null, 0);
		expect(events.length).toBe(3);
		expect(events[0].body).toBe('one');
		expect(events[1].body).toBe('two');
		expect(events[2].body).toBe('three');

		const events2 = await eventModel.eventsSince2('test', events[2].id, 0);
		expect(events2.length).toBe(0);
	});

	it('should return last events - several events with same timestamp', async function() {
		// In this case, the first three events are created simultaneously (same
		// created_time) and the last one separately. Then when we retrieve the
		// events 2 by 2, we need to check that we get all the events at the
		// end.
		const eventModel = new EventModel();
		const baseProps:Event = { name: 'test', job_id: 'test', hash: '123', created_time: 1000, updated_time: 1000 };
		const saveOptions:SaveOptions = { autoTimestamp: false };

		await eventModel.save({ ...baseProps, body: 'a' }, saveOptions);
		await eventModel.save({ ...baseProps, body: 'b' }, saveOptions);
		await eventModel.save({ ...baseProps, body: 'c' }, saveOptions);
		await eventModel.save({ ...baseProps, body: 'd', created_time: 2000, updated_time: 2000 }, saveOptions);

		const events1 = await eventModel.eventsSince2('test', '', 0, 2);
		expect(events1.length).toBe(2);

		const events2 = await eventModel.eventsSince2('test', events1[events1.length - 1].id, 0);
		expect(events2.length).toBe(2);

		const allBodies = events1.concat(events2).map(event => event.body);
		allBodies.sort();
		expect(allBodies).toEqual(['a', 'b', 'c', 'd']);
	});

	it('should return last events - previous event missing', async function() {
		// Handle case where the previous event, from which processing should
		// have resumed, has been deleted. In this case, we proceed based on the
		// deleted event timestamp (since it's recorded in processed_events
		// table).

		const eventModel = new EventModel();
		const baseProps:Event = { name: 'test', job_id: 'test', hash: '123' };

		await eventModel.save({ ...baseProps, body: 'a' }); await msleep(1);
		await eventModel.save({ ...baseProps, body: 'b' }); await msleep(1);
		await eventModel.save({ ...baseProps, body: 'c' }); await msleep(1);

		const events = await eventModel.eventsSince2('test', null, 2);
		expect(events[0].body).toBe('a');
		expect(events[1].body).toBe('b');

		await eventModel.delete(events[1].id);

		const events2 = await eventModel.eventsSince2('test', events[1].id, events[1].created_time);
		expect(events2.length).toBe(1);
		expect(events2[0].body).toBe('c');
	});

});
