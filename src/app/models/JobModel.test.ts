import { afterAllSetup, beforeEachSetup, installJob } from '../utils/testUtils';
import EventModel from './EventModel';
import { msleep } from '../utils/timeUtils';
import { Event } from '../db';
import { SaveOptions } from './BaseModel';
import JobModel from './JobModel';

describe('JobModel', function() {

	beforeEach(async () => {
		await beforeEachSetup();
	});

	afterAll(async () => {
		await afterAllSetup();
	});

	it('should load jobs from templates', async function() {
		const job = await installJob('from_template');
		expect(job.id).toBe('from_template');
		expect(job.type).toBe('js');
		expect(job.params).toEqual({ batchId: 'TEMPLATE' });
	});

});
