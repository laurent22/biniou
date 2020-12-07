import services from '../services';
import BaseCommand from './BaseCommand';
import { sleep } from '../utils/timeUtils';

export default class StartCommand extends BaseCommand {

	public command() {
		return 'start';
	}

	public description() {
		return 'starts the server';
	}

	public async run(): Promise<void> {
		await services.jobService.start();
		while (true) await sleep(60);
	}

}
