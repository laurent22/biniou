import services from '../services';
import BaseCommand from './BaseCommand';
import { sleep } from '../utils/timeUtils';
import Logger from '../utils/Logger';
import config from '../config';

const logger = Logger.create('StartCommand');

export default class StartCommand extends BaseCommand {

	public command() {
		return 'start';
	}

	public description() {
		return 'starts the server';
	}

	public async run(): Promise<void> {
		logger.info(`Env: ${config.env}`);
		logger.info(`Config dir: ${config.configDir}`);
		logger.info(`Data dir: ${config.dataDir}`);

		await services.jobService.start();
		while (true) await sleep(60);
	}

}
