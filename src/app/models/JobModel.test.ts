import { afterAllSetup, beforeEachSetup, installJob } from '../utils/testUtils';

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
		expect(job.template).toBe('template_test');
	});

});
