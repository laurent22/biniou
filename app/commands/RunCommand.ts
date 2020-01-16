require('source-map-support').install();

import JobModel from '../models/JobModel';
import services from '../services';
import BaseCommand from './BaseCommand';

export default class RunCommand extends BaseCommand {

	command() {
		return 'run <job-id>';
	}

	description() {
		return 'runs the specified job once';
	}

	positionals() {
		return [
			{
				name: 'job-id',
				// options: {},
			},
		];
	}

	async run(argv:any):Promise<void> {
		const jobId = argv.jobId;
		const jobModel = new JobModel();
		const job = await jobModel.load(jobId);
		await services.jobService.processJob(job);
	}

}
