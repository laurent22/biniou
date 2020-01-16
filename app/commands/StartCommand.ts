require('source-map-support').install();

import JobModel from '../models/JobModel';
import services from '../services';
import BaseCommand from './BaseCommand';

const schedule = require('node-schedule');

export default class StartCommand extends BaseCommand {

	command() {
		return 'start';
	}

	description() {
		return 'starts the server';
	}

	async run():Promise<void> {
		console.info('START');
		const jobModel = new JobModel();
		const jobs = await jobModel.all();
		const needToRunJobs = await jobModel.jobsThatNeedToRunNow(jobs);
		await services.jobService.processJobs(needToRunJobs);

		// var j = schedule.scheduleJob('42 * * * *', function(){
		// 	console.log('The answer to life, the universe, and everything!');
		// });
	}

}