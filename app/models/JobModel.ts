import { Job, JobTrigger, JobState } from "../db";
import { loadJsonFromFile, basename } from '../fileUtils';
import JobStateModel from './JobStateModel';
import config from '../config';
const cronParser = require('cron-parser');

export default class JobModel {

	jobDir(id:string):string {
		return config.jobsDir + '/' + id;
	}

	async load(id:string):Promise<Job> {
		const path = this.jobDir(id);
		const o:any = await loadJsonFromFile(path + '/job.json');

		const job:Job = {
			id: basename(path),
			type: o.type,
			state: await this.loadState_(id),
		};

		if (o.trigger) job.trigger = o.trigger;
		if (o.triggerSpec) job.triggerSpec = o.triggerSpec;
		if (o.scriptFile) job.scriptFile = o.scriptFile;
		if (o.script) job.script = o.script;
		if (o.input) job.input = o.input;

		return job;
	}

	async loadState_(jobId:string):Promise<JobState> {
		const jobStateModel = new JobStateModel();
		const jobState = await jobStateModel.loadByJobId(jobId);
		if (jobState) return jobState;

		const newJobState = await jobStateModel.save({
			job_id: jobId,
		});

		return newJobState;
	}

	async saveState(stateId:string, state:JobState) {
		state = Object.assign({}, state, { id: stateId });
		const jobStateModel = new JobStateModel();
		await jobStateModel.save(state);
	}

	nextIteration(job:Job):Date {
		if (job.trigger === JobTrigger.Cron) {
			const interval = cronParser.parseExpression(job.triggerSpec);
			return interval.next().toDate();
		}

		throw new Error('Unsupported job trigger: ' + job.trigger);
	}

}