import { afterAllSetup, beforeEachSetup, jobDir } from '../../tests/testUtils';
import config from '../config';
import JobModel from '../models/JobModel';
import * as fs from 'fs-extra';
import JobService from './JobService';
import services from '../services';
import EventModel from '../models/EventModel';
import ProcessedEventModel from '../models/ProcessedEventModel';
import { ProcessedEvent } from '../db';

async function installJob(jobName:string) {
	await fs.copy(`${jobDir}/${jobName}`, `${config.jobsDir}/${jobName}`);
	const jobModel = new JobModel();
	return jobModel.load(jobName);
}

describe('JobService', function() {

	beforeEach(async () => {
		await beforeEachSetup();
	});

	afterAll(async () => {
		await afterAllSetup();
	});

	test('should run a job', async function() {
		const job = await installJob('create_event');
		const jobService = services.jobService;

		await jobService.processJob(job);

		const eventModel = new EventModel();
		const events = await eventModel.allByJobId('create_event');

		expect(events.length).toBe(3);

		const titles = events.map(event => JSON.parse(event.body).title);
		titles.sort();
		expect(titles).toEqual(['title 0', 'title 1', 'title 2']);

		expect(events.map(event => event.name)).toEqual(['my_event', 'my_event', 'my_event']);
	});

	// TODO: test error when processing event

	test('should process events', async function() {
		const eventModel = new EventModel();

		const createEventJob = await installJob('create_event');
		const processEventJob = await installJob('process_event');

		const jobService = services.jobService;

		await jobService.processJob(createEventJob);
		const createdEvents = await eventModel.allByJobId('create_event');

		await jobService.processJob(processEventJob);

		const events = await eventModel.allByJobId('process_event');

		expect(events.length).toBe(3);
		const titles = events.map(event => JSON.parse(event.body).title);
		titles.sort();
		expect(titles).toEqual(['Processed: title 0', 'Processed: title 1', 'Processed: title 2']);

		const processedEventModel = new ProcessedEventModel();
		const processedEvents = (await processedEventModel.all()) as ProcessedEvent[];

		const createdEventsIds = createdEvents.map(event => event.id);
		expect(processedEvents.map(pe => pe.event_id).sort()).toEqual(createdEventsIds.sort());
	});

});
