import BaseCommand from './BaseCommand';
import { Job } from '../db';
import config from '../config';
import JobModel from '../models/JobModel';

export default class JobsCommand extends BaseCommand {

	public command() {
		return 'jobs [job-id]';
	}

	public description() {
		return 'displays job information';
	}

	private renderJob(job: Job) {
		const lines = [];
		lines.push(`Job ${job.id}`);
		lines.push(`Enabled: ${job.enabled ? 'yes' : 'no'}`);
		lines.push(`Config dir: ${config.jobDir(job.id)}`);
		lines.push(`Last started: ${job.state ? (new Date(job.state.last_started)).toISOString() : 'Never started'}`);
		lines.push(`Last finished: ${job.state ? (new Date(job.state.last_finished)).toISOString() : 'Never finished'}`);

		return lines.join('\n');
	}

	public async run(argv: any): Promise<void> {
		const jobModel = new JobModel();
		let jobs = await jobModel.all();

		if (argv['job-id']) jobs = jobs.filter(job => job.id === argv['job-id']);

		const renderedJobs: string[] = [];

		for (const job of jobs) {
			renderedJobs.push(this.renderJob(job));
		}

		this.stdout(renderedJobs.join('\n\n'));
	}

}
