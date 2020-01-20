import * as fs from 'fs-extra';
import config from '../config';
import * as vm from 'vm';
import * as puppeteer from 'puppeteer';
import { Job, Event, JobTrigger } from '../db';
import BaseService from './BaseService';
import EventService from './EventService';
import JobModel from '../models/JobModel';
import JobStateModel from '../models/JobStateModel';
import EventModel from '../models/EventModel';
import fetch from 'node-fetch';

const schedule = require('node-schedule');

interface ExecScriptOptions {
	events:Event[],
}

export default class JobService extends BaseService {

	eventService_:EventService;

	constructor(eventService:EventService) {
		super();
		this.eventService_ = eventService;
	}

	get eventService():EventService {
		return this.eventService_;
	}

	private async execScript(job:Job, options:ExecScriptOptions):Promise<string> {
		if (job.type === 'shell') {
			// const result = await execCommand(job.script);
			// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
		} else if (job.type === 'js') {
			const scriptFile = job.scriptFile ? job.scriptFile : 'index.js';
			const scriptPath = `${config.jobDir(job.id)}/${scriptFile}`;
			const scriptContent = (await fs.readFile(scriptPath)).toString();

			const sandbox = (function(that:JobService) {
				let browser_:puppeteer.Browser = null;

				const biniou:any = {
					dispatchEvent: (name:string, body:any, options:any) => {
						return that.eventService.dispatchEvent(job.id, name, body, options);
					},
					dispatchEvents: async (name:string, bodies:any[], options:any) => {
						for (let body of bodies) {
							await that.eventService.dispatchEvent(job.id, name, body, options);
						}
					},
					browser: async () => {
						if (browser_) return browser_;
						browser_ = await puppeteer.launch();
						return browser_;
					},
					browserClose: async () => {
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

				biniou.gotoPageAndWaitForSelector = async (url:string, selector:string, callback:Function) => {
					const page = await biniou.browserNewPage();
					await page.goto(url);
					await page.waitForSelector(selector);
					return page.$$eval(selector, callback);
				};

				return {
					console: console,
					fetch: fetch,
					biniou: biniou,
				};
			}(this));

			vm.createContext(sandbox);

			const result = vm.runInContext(scriptContent, sandbox);

			if (result.run) {
				const jobModel = new JobModel();
				await jobModel.saveState(job.state.id, { last_started: Date.now() });

				const startTime = Date.now();

				try {
					this.logger.info(`Starting job: ${job.id}`);
					await result.run(options.events);
				} catch (error) {
					this.logger.error(`In script ${scriptPath}\n`, error);
				}

				await sandbox.biniou.browserClose();
				await jobModel.saveState(job.state.id, { last_finished: Date.now() });
				this.logger.info(`Finished job: ${job.id} (Took ${Date.now() - startTime}ms)`);
			}
		}

		return '';
	}

	async scheduleJob(job:Job) {
		if (job.trigger === JobTrigger.Cron) {
			schedule.scheduleJob(job.triggerSpec, () => {
				this.processJob(job);
			});
		} else if (job.trigger === JobTrigger.Event) {
			schedule.scheduleJob('* * * * *', () => {
				this.processJob(job);
			});
		}
	}

	async scheduleJobs(jobs:Job[]) {
		for (let job of jobs) {
			this.scheduleJob(job);
		}
	}

	async processJob(job:Job) {
		// if (!(await fs.pathExists(config.eventsDir))) await fs.mkdirp(config.eventsDir);
		// const inputJob = job.input ? this.jobById(job.input) : null;
		// const events = inputJob ? await this.jobEventsSince(inputJob, null) : [];
		// const events = [];

		let events:Event[] = [];

		if (job.trigger === JobTrigger.Event) {
			const stateModel = new JobStateModel();
			const context = stateModel.parseContext(job.state);
			for (const eventName of job.triggerSpec) {
				events = events.concat(await this.eventService.eventsSince(eventName, context));
			}
		}

		await this.execScript(job, {
			events: events,
		});
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
