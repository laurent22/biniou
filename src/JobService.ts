import { loadJsonFromFile, basename, filename } from './fileUtils';
import * as fs from 'fs-extra';
import Job from './Job';
import config from './config';
import * as vm from 'vm';
import * as moment from 'moment';
import * as md5 from 'md5';
import Datastore from 'nedb';

export default class JobService {

	jobs_:Job[];
	// = new Datastore({ filename: 'path/to/datafile' });

	get jobs():Job[] {
		return this.jobs_;
	}

	async loadJobs() {
		const folders = await fs.readdir(config.jobsDir);
		const jobs = [];
		for (const folder of folders) {
			const folderPath = config.jobsDir + '/' + folder;
			const f = await fs.stat(folderPath);
			if (!f.isDirectory()) continue;
			jobs.push(await Job.loadJobFromDir(folderPath));
		}
		this.jobs_ = jobs;
	}

	jobById(id:string):Job {
		for (const job of this.jobs) {
			if (job.id === id) return job;
		}
		throw new Error('Could not find job with ID: ' + id);
	}

	async postEvent(jobId:string, eventBody:any, options:any = {}) {
		const createIfUnique:boolean = options.createIfUnique === true;
		await fs.mkdirp(config.jobEventsDir(jobId));
		const eventFilePath = config.jobEventsDir(jobId) + '/' + moment(Date.now()).format('YYYYMMDD-HHmmss-SSS') + '.json';
		const bodyType = typeof eventBody === 'string' ? 'string' : 'object';
		const hash = md5(escape(bodyType === 'object' ? JSON.stringify(eventBody) : eventBody));

		const event = {
			hash: hash,
			bodyType: bodyType,
			createdTime: Date.now(),
			body: eventBody,
		};

		await fs.writeFile(eventFilePath, JSON.stringify(event));
	}
	
	async execScript(job:Job, events:any[]):Promise<string> {
		if (job.type === 'shell') {
			// const result = await execCommand(job.script);
			// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
		} else if (job.type === 'js') {
			const scriptContent = (await fs.readFile(config.jobDir(job.id) + '/' + job.scriptFile)).toString();
	
			const sandbox = {
				console: console,
				biniou: {
					postEvent: (event:any) => {
						return this.postEvent(job.id, event);
					},
				},
			};
		
			vm.createContext(sandbox);
		
			const result = vm.runInContext(scriptContent, sandbox);
		
			for (const event of events) {
				await result.handleEvent(event);
			}
		}

		return '';
	}

	async loadEvent(path:string):Promise<any> {
		return loadJsonFromFile(path);
	}

	async jobEventsSince(job:any, eventName:string):Promise<any[]> {
		const eventFiles = await fs.readdir(config.eventsDir + '/' + job.id);
		const output = [];
		for (const eventFile of eventFiles) {
			const n = filename(eventFile);
			if (eventName !== null && n < eventName) continue;
			output.push(await this.loadEvent(config.jobEventsDir(job.id) + '/' + eventFile));
		}
		return output;
	}

	async processJobs(jobs:Job[]) {
		for (const job of jobs) {
			if (!(await fs.pathExists(config.eventsDir))) await fs.mkdirp(config.eventsDir);
			const inputJob = job.input ? this.jobById(job.input) : null;
			const events = inputJob ? await this.jobEventsSince(inputJob, null) : [];
			await this.execScript(job, events);
			// const eventFilePath = job.eventsDir + '/' + moment(Date.now()).format('YYYYMMDD-HHmmss-SSS') + '.json'
			// const inputJob = job.input ? this.jobById(jobs, job.input) : null;
			// const events = inputJob ? await this.jobEventsSince(inputJob, null) : [];

			// if (job.type === 'shell') {
			// 	// const result = await execCommand(job.script);
			// 	// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
			// } else if (job.type === 'js') {
			// 	// await execJsScriptFile(job.assetDir + '/' + job.scriptFile, job.id, events);
			// }
		}
	}

}