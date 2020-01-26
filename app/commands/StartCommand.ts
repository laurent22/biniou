require('source-map-support').install();

import services from '../services';
import BaseCommand from './BaseCommand';

export default class StartCommand extends BaseCommand {

	command() {
		return 'start';
	}

	description() {
		return 'starts the server';
	}

	async run():Promise<void> {
		await services.jobService.start();
	}

}
