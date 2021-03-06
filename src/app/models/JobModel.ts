import { Job, JobTrigger, JobState } from '../db';
import { loadJsonFromFile, basename } from '../fileUtils';
import JobStateModel from './JobStateModel';
import config from '../config';
import * as fs from 'fs-extra';
const cronParser = require('cron-parser');

interface JobCache {
	[key: string]: Job;
}

export default class JobModel {

	private cache_: JobCache = {};
	private templateCache_: JobCache = {};
	// private cacheAllDone_: boolean = false;

	private async loadFromPath(path: string, isTemplate: boolean = false): Promise<Job> {
		const o: any = await loadJsonFromFile(`${path}/job.json`);

		const job: Job = {
			id: basename(path),
			type: o.type,
			enabled: ('enabled' in o) ? !!o.enabled : true,
		};

		if (o.trigger) job.trigger = o.trigger;
		if (o.triggerSpec) job.triggerSpec = o.triggerSpec;
		if (o.scriptFile) job.scriptFile = o.scriptFile;
		if (o.script) job.script = o.script;
		if (o.input) job.input = o.input;
		if (o.template) job.template = o.template;
		if (o.params) job.params = o.params;

		if (!isTemplate && job.trigger === JobTrigger.Event && !Array.isArray(job.triggerSpec)) throw new Error('Trigger spec must be an array of event types');
		if (!isTemplate && job.trigger === JobTrigger.Cron && typeof job.triggerSpec !== 'string') throw new Error('Trigger spec must be a cron string');

		return job;
	}

	private async loadTemplate(id: string): Promise<Job> {
		if (this.templateCache_[id]) return this.templateCache_[id];
		const templatePath = config.templateDir(id);
		const templateJob = await this.loadFromPath(templatePath, true);
		this.templateCache_[id] = templateJob;
		return templateJob;
	}

	public async load(id: string): Promise<Job> {
		if (this.cache_[id]) return this.cache_[id];

		const path = config.jobDir(id);
		let job = await this.loadFromPath(path);
		job.state = await this.loadState_(id);

		if (job.template) {
			const templateJob = await this.loadTemplate(job.template);

			job = {
				...templateJob,
				...job,
			};

			if (!job.type) job.type = templateJob.type;
		}

		this.cache_[id] = job;

		return job;
	}

	public async allEnabled(): Promise<Job[]> {
		const output = await this.all();
		return output.filter(job => job.enabled);
	}

	public async all(): Promise<Job[]> {
		const output = [];
		const dirs = await fs.readdir(config.jobsDir);
		for (const dir of dirs) {
			const stat = await fs.stat(`${config.jobsDir}/${dir}`);
			if (!stat.isDirectory()) continue;
			const job = await this.load(dir);
			output.push(job);
		}
		// this.cacheAllDone_ = true;
		return output;
	}

	private async loadState_(jobId: string): Promise<JobState> {
		const jobStateModel = new JobStateModel();
		const jobState = await jobStateModel.loadByJobId(jobId);
		if (jobState) return jobState;

		const newJobState = await jobStateModel.save({
			job_id: jobId,
			last_started: 0,
			last_finished: 0,
		}) as JobState;

		return newJobState;
	}

	public async saveState(stateId: string, state: JobState) {
		state = Object.assign({}, state, { id: stateId });
		const jobStateModel = new JobStateModel();
		await jobStateModel.save(state);
	}

	private previousIterationDate(job: Job): Date {
		if (job.trigger === JobTrigger.Cron) {
			const interval = cronParser.parseExpression(job.triggerSpec);
			return interval.prev().toDate();
		}

		throw new Error(`Unsupported job trigger: ${job.trigger}`);
	}

	public async scriptPath(job: Job): Promise<string> {
		const defaultFilename = 'index.js';

		if (job.template) {
			const template = await this.loadTemplate(job.template);
			return `${config.templateDir(job.template)}/${template.scriptFile || defaultFilename}`;
		}

		return `${config.jobDir(job.id)}/${job.scriptFile || defaultFilename}`;
	}

	// private nextIterationDate(job:Job):Date {
	// 	if (job.trigger === JobTrigger.Cron) {
	// 		const interval = cronParser.parseExpression(job.triggerSpec);
	// 		return interval.next().toDate();
	// 	}

	// 	throw new Error(`Unsupported job trigger: ${job.trigger}`);
	// }

	// Finds jobs that have not been started when they should have (eg. because the service was not running).
	public async jobsThatNeedToRunNow(jobs: Job[]): Promise<Job[]> {
		const output: Job[] = [];
		for (const job of jobs) {
			if (job.trigger !== JobTrigger.Cron) continue;
			if (!job.enabled) continue;
			const lastRunDate = job.state.last_started;
			const shouldHaveRanDate = this.previousIterationDate(job);
			if (lastRunDate < shouldHaveRanDate.getTime()) output.push(job);
		}
		return output;
	}

}
