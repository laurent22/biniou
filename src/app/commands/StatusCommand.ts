import BaseCommand from './BaseCommand';
import config from '../config';

export default class StartCommand extends BaseCommand {

	public command() {
		return 'status';
	}

	public description() {
		return 'displays status information';
	}

	public async run(): Promise<void> {
		console.info(`Env: ${config.env}`);
		console.info(`Config dir: ${config.configDir}`);
		console.info(`Data dir: ${config.dataDir}`);
	}

}
