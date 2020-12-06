import { afterAllSetup, beforeEachSetup, jobDir } from '../../tests/testUtils';
import config from '../config';
import JobModel from '../models/JobModel';
import * as fs from 'fs-extra';
import JobService from './JobService';
import services from '../services';
import EventModel from '../models/EventModel';

describe('JobService', function() {

	beforeEach(async () => {
		await beforeEachSetup();
	});

	afterAll(async () => {
		await afterAllSetup();
	});

	test('should run a job', async function() {
		await fs.copy(`${jobDir}/create_event`, `${config.jobsDir}/create_event`);
		const jobModel = new JobModel();
		const jobService = services.jobService;
		const jobs = await jobModel.all();

		await jobService.processJob(jobs[0]);

		const eventModel = new EventModel();
		const events = await eventModel.allByJobId('create_event');

		expect(events.length).toBe(3);

		const titles = events.map(event => JSON.parse(event.body).title);
		titles.sort();
		expect(titles).toEqual(['title 0', 'title 1', 'title 2']);
	});

});
