import JobModel from '../models/JobModel';
import services from '../services';
import BaseCommand from './BaseCommand';

export default class RunCommand extends BaseCommand {

	public command() {
		return 'run <job-id>';
	}

	public description() {
		return 'runs the specified job once';
	}

	public positionals() {
		return [
			{
				name: 'job-id',
			},
		];
	}

	public async run(argv: any): Promise<void> {
		const jobId = argv.jobId;
		const jobModel = new JobModel();
		const job = await jobModel.load(jobId);
		await services.jobService.processJob(job);
	}

}
