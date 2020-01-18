require('source-map-support').install();

import JobModel from '../models/JobModel';
import services from '../services';
import BaseCommand from './BaseCommand';
import { wait } from '../utils/timeUtils';

export default class StartCommand extends BaseCommand {

	command() {
		return 'start';
	}

	description() {
		return 'starts the server';
	}

	async run():Promise<void> {
		const jobModel = new JobModel();
		const jobs = await jobModel.all();
		const needToRunJobs = await jobModel.jobsThatNeedToRunNow(jobs);
		await services.jobService.processJobs(needToRunJobs);
		await services.jobService.scheduleJobs(jobs);

		while (true) await wait(60);
	}

}
