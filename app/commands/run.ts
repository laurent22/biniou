require('source-map-support').install();

import JobModel from '../models/JobModel';
import services from '../services';

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
		await services.jobService.processJob(job);
	},
};