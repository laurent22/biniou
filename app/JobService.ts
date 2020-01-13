import { loadJsonFromFile, basename, filename } from './fileUtils';
import * as fs from 'fs-extra';
import config from './config';
import * as vm from 'vm';
import * as moment from 'moment';
import * as md5 from 'md5';
import * as puppeteer from 'puppeteer';
import { Event, EventBodyType, Job } from './db';
import EventModel from './models/EventModel';

export default class JobService {

	// jobs_:Job[];

	// get jobs():Job[] {
	// 	return this.jobs_;
	// }

	// jobDir(name:string):string {
	// 	return config.jobsDir + '/' + name;
	// }

	// async loadJob(name:string):Promise<Job> {
	// 	const path = this.jobDir(name);
	// 	return Job.loadJobFromDir(path);
	// }

	// async loadJobs() {
	// 	const folders = await fs.readdir(config.jobsDir);
	// 	const jobs = [];
	// 	for (const folder of folders) {
	// 		const folderPath = config.jobsDir + '/' + folder;
	// 		const f = await fs.stat(folderPath);
	// 		if (!f.isDirectory()) continue;
	// 		jobs.push(await Job.loadJobFromDir(folderPath));
	// 	}
	// 	this.jobs_ = jobs;
	// }

	// jobById(id:string):Job {
	// 	for (const job of this.jobs) {
	// 		if (job.id === id) return job;
	// 	}
	// 	throw new Error('Could not find job with ID: ' + id);
	// }

	async dispatchEvent(jobId:string, eventName:string, eventBody:any, options:any = {}) {
		options = Object.assign({
			allowDuplicates: false,
		}, options);

		const bodyType:EventBodyType = typeof eventBody === 'string' ? EventBodyType.String : EventBodyType.Object;
		const eventBodySerialized:string = bodyType === EventBodyType.String ? eventBody : JSON.stringify(eventBody)
		const hash = md5(escape(eventBodySerialized));
		
		const eventModel= new EventModel(); 
		
		const existingEvent = await eventModel.loadByHash(hash);		
		if (existingEvent) return;

		const now = Date.now();

		const event:Event = {
			name: eventName,
			body_type: bodyType,
			body: eventBodySerialized,
			created_time: now,
			updated_time: now,
			hash: hash,
		};

		await eventModel.save(event);
	}
	
	async execScript(job:Job, events:any[]):Promise<string> {
		if (job.type === 'shell') {
			// const result = await execCommand(job.script);
			// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
		} else if (job.type === 'js') {
			const scriptFile = job.scriptFile ? job.scriptFile : 'index.js';
			const scriptPath = config.jobDir(job.id) + '/' + scriptFile;
			const scriptContent = (await fs.readFile(scriptPath)).toString();

			const sandbox = (function(jobService:JobService) {
				let browser_:puppeteer.Browser = null;

				const biniou:any = {
					dispatchEvent: (name:string, body:any) => {
						return jobService.dispatchEvent(job.id, name, body);
					},
					dispatchEvents: async(name:string, bodies:any[]) => {
						for (let body of bodies) {
							await jobService.dispatchEvent(job.id, name, body);
						}
					},
					browser: async () => {
						if (browser_) return browser_;
						browser_ = await puppeteer.launch();
						return browser_;
					},
					browserClose: async() => {
						if (!browser_) return;
						await browser_.close();
						browser_ = null;
					},
				};

				biniou.browserNewPage = async () => {
					const b = await biniou.browser();
					const page = await b.newPage();
					return page;
				};

				biniou.gotoPageAndWaitForSelector = async(url:string, selector:string, callback:Function) => {
					const page = await biniou.browserNewPage();
					await page.goto(url);
					await page.waitForSelector(selector);
					return page.$$eval(selector, callback);
				}

				return {
					console: console,
					biniou: biniou,
				};
			}(this));
		
			vm.createContext(sandbox);
		
			const result = vm.runInContext(scriptContent, sandbox);

			if (result.run) {
				try {
					await result.run();
				} catch (error) {
					console.error('In script ' + scriptPath + "\n", error);
				} finally {
					await sandbox.biniou.browserClose();
				}
			}
		
			for (const event of events) {
				await result.handleEvent(event);
			}
		}

		return '';
	}

	async loadEvent(path:string):Promise<any> {
		// return loadJsonFromFile(path);
	}

	async jobEventsSince(job:any, eventName:string):Promise<any[]> {
		return [];
		// const eventFiles = await fs.readdir(config.eventsDir + '/' + job.id);
		// const output = [];
		// for (const eventFile of eventFiles) {
		// 	const n = filename(eventFile);
		// 	if (eventName !== null && n < eventName) continue;
		// 	output.push(await this.loadEvent(config.jobEventsDir(job.id) + '/' + eventFile));
		// }
		// return output;
	}

	async processJob(job:Job) {
		if (!(await fs.pathExists(config.eventsDir))) await fs.mkdirp(config.eventsDir);
		// const inputJob = job.input ? this.jobById(job.input) : null;
		// const events = inputJob ? await this.jobEventsSince(inputJob, null) : [];
		const events = [];
		await this.execScript(job, events);
	}

	async processJobs(jobs:Job[]) {
		for (const job of jobs) {
			await this.processJob(job);
			// if (!(await fs.pathExists(config.eventsDir))) await fs.mkdirp(config.eventsDir);
			// const inputJob = job.input ? this.jobById(job.input) : null;
			// const events = inputJob ? await this.jobEventsSince(inputJob, null) : [];
			// await this.execScript(job, events);



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