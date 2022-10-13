import BaseCommand from './BaseCommand';
import db, { JobResult } from '../db';

export default class JobLogCommand extends BaseCommand {

	public command() {
		return 'job-log [job-id]';
	}

	public description() {
		return 'displays job log';
	}

	public options() {
		return {
			'filter-error': {
				type: 'boolean',
			},
			'filter-success': {
				type: 'boolean',
			},
		};
	}

	private renderJobLog(r: JobResult) {
		const lines = [];
		lines.push(`Log entry ${r.id}`);
		lines.push(`Job ID: ${r.job_id}`);
		if (r.event_id) lines.push(`Event ID: ${r.event_id}`);
		lines.push(`Date: ${(new Date(r.created_time)).toISOString()}`);
		lines.push(`Success: ${r.success ? 'yes' : 'no'}`);
		if (!r.success || r.error) lines.push(`Error: ${r.error}`);

		return lines.join('\n');
	}

	public async run(argv: any): Promise<void> {
		const query = db()('job_results').select('*');
		if (argv['job-id']) void query.where('job_id', '=', argv['job-id']);
		if (argv['filter-error']) void query.where('success', '=', 0);
		if (argv['filter-success']) void query.where('success', '=', 1);

		const jobResults = await query.orderBy('created_time', 'desc');

		const renderedLogs: string[] = [];

		for (const jobResult of jobResults) {
			renderedLogs.push(this.renderJobLog(jobResult));
		}

		this.stdout(renderedLogs.join('\n\n'));
	}

}
