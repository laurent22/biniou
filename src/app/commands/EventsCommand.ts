import BaseCommand from './BaseCommand';
import db, { Event, eventBodyTypeToString } from '../db';

export default class StartCommand extends BaseCommand {

	public command() {
		return 'events [event-id]';
	}

	public options() {
		return {
			'filter-job-id': {
				type: 'string',
			},
			'filter-event-type': {
				type: 'string',
			},
			'content': {
				type: 'boolean',
			},
		};
	}

	public description() {
		return 'displays event information';
	}

	private renderEvent(event: Event, argv: any) {
		if (argv['content']) {
			return event.body;
		}

		const lines = [];
		lines.push(`Event ${event.id}`);
		lines.push(`Job:  ${event.job_id}`);
		lines.push(`Type: ${event.type}`);
		lines.push(`Date: ${(new Date(event.created_time)).toISOString()}`);
		lines.push(`Body: ${eventBodyTypeToString(event.body_type)}`);
		lines.push('');

		const body = typeof event.body === 'object' ? JSON.stringify(event.body) : event.body;
		lines.push(body.substr(0, 255));

		return lines.join('\n');
	}

	public async run(argv: any): Promise<void> {
		const query = db()('events').select('*');
		if (argv['filter-event-type']) void query.where('type', '=', argv['filter-event-type']);
		if (argv['filter-job-id']) void query.where('job_id', '=', argv['filter-job-id']);
		if (argv['event-id']) void query.where('id', '=', argv['event-id']);

		const events = await query.orderBy('created_time', 'desc');

		const renderedEvents: string[] = [];

		for (const event of events) {
			renderedEvents.push(this.renderEvent(event, argv));
		}

		this.stdout(renderedEvents.join('\n\n'));
	}

}
