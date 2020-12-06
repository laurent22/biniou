import { afterAllSetup, beforeEachSetup, jobDir } from '../../tests/testUtils';
import config from '../config';
import JobModel from '../models/JobModel';
import * as fs from 'fs-extra';
import JobService from './JobService';
import services from '../services';
import EventModel from '../models/EventModel';
import JobResultModel from '../models/JobResultModel';
import { JobResult } from '../db';

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
	// TODO: test resuming processing events

	test('should process events', async function() {
		const eventModel = new EventModel();
		const jobService = services.jobService;

		const createEventJob = await installJob('create_event');
		const processEventJob = await installJob('process_event');

		await jobService.processJob(createEventJob, { batchId: 'A' });
		const createdEvents = await eventModel.allByJobId('create_event');

		await jobService.processJob(processEventJob);

		const events = await eventModel.allByJobId('process_event');

		expect(events.length).toBe(3);
		const titles = events.map(event => JSON.parse(event.body).title);
		titles.sort();
		expect(titles).toEqual(['Processed: title A 0', 'Processed: title A 1', 'Processed: title A 2']);

		// Verify that all events have been processed and that each has
		// generated a JobResult object
		const jobResultModel = new JobResultModel();
		const jobResults = (await jobResultModel.allByJobId('process_event')) as JobResult[];
		expect(jobResults.map(jr => jr.event_id).sort())
			.toEqual(createdEvents.map(e => e.id).sort());

		expect(jobResults.map(jr => jr.success)).toEqual([1,1,1]);
	});

	test('should resume processing events', async function() {
		const eventModel = new EventModel();
		const jobService = services.jobService;

		const createEventJob = await installJob('create_event');
		const processEventJob = await installJob('process_event');

		// Generate 3 events and process them
		await jobService.processJob(createEventJob, { batchId: 'A' });
		await jobService.processJob(processEventJob);

		// Generate 3 more events and process them
		await jobService.processJob(createEventJob, { batchId: 'B' });
		await jobService.processJob(processEventJob);

		// Verify that no more than 6 events has been processed. The
		// "processed_event" job has the "allowDuplicates" property set to true,
		// so if the resuming mechanism doesn't work it would generate 9 events.
		const events = await eventModel.allByJobId('process_event');
		expect(events.length).toBe(6);
	});

});
