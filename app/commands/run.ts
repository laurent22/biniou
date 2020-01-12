require('source-map-support').install();

import JobService from '../JobService';
import JobModel from '../models/JobModel';

export default {
	command: () => 'run <job-id>',
	description: () => 'runs the specified job once',
	positionals: () => {
		return [
			{
				name: 'job-id',
				options: {},
			},
		];
	},
	run: async (argv:any) => {
		const jobId = argv.jobId;
		const job = await JobModel.load(jobId);
		const jobService = new JobService();
		await jobService.processJob(job);
	},
};