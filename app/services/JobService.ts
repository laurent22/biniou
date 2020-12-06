import * as fs from 'fs-extra';
import config from '../config';
import * as vm from 'vm';
import * as puppeteer from 'puppeteer';
import { Job, Event, JobTrigger, JobType } from '../db';
import BaseService from './BaseService';
import EventService from './EventService';
import JobModel from '../models/JobModel';
import JobStateModel from '../models/JobStateModel';
import fetch from 'node-fetch';
import TaskQueue from '../utils/TaskQueue';
import Logger from '../utils/Logger';
import {sleep} from '../utils/timeUtils';
import * as Twitter from 'twitter';

const RssParser = require('rss-parser');
const schedule = require('node-schedule');

interface ExecScriptOptions {
	events:Event[],
}

interface ScheduledJobs {
	[key:string]: any
}

export default class JobService extends BaseService {

	eventService_:EventService;
	eventCheckSchedule_:any = null;
	scheduledJobs_:ScheduledJobs = {};
	jobs_:Job[] = null;
	jobModel_:JobModel;
	jobQueue_:TaskQueue;

	constructor(eventService:EventService) {
		super();

		this.eventService_ = eventService;
		this.jobQueue_ = new TaskQueue();
	}

	setLogger(v:Logger) {
		super.setLogger(v);
		this.jobQueue_.setLogger(v);
	}

	private get eventService():EventService {
		return this.eventService_;
	}

	private get jobModel():JobModel {
		if (!this.jobModel_) this.jobModel_ = new JobModel();
		return this.jobModel_;
	}

	private async execScript(job:Job, options:ExecScriptOptions = null):Promise<any> {
		const eventsProcessed = [];

		if (job.type === 'shell') {
			// const result = await execCommand(job.script);
			// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
		} else if (job.type === 'js') {
			const scriptFile = job.scriptFile ? job.scriptFile : 'index.js';
			const scriptPath = `${config.jobDir(job.id)}/${scriptFile}`;
			const scriptContent = (await fs.readFile(scriptPath)).toString();

			const sandbox = (function(that:JobService) {
				let browser_:puppeteer.Browser = null;
				let rssParser_:any = null;
				let twitterClients_:any = {};

				const biniou:any = {
					dispatchEventCount_: 0,
					createdEventCount_: 0,
					dispatchEvent: async (name:string, body:any, options:any) => {
						biniou.dispatchEventCount_++;
						const created = await that.eventService.dispatchEvent(job.id, name, body, options);
						if (created) biniou.createdEventCount_++;
					},
					dispatchEvents: async (name:string, bodies:any[], options:any) => {
						for (let body of bodies) {
							biniou.dispatchEventCount_++;
							const created = await that.eventService.dispatchEvent(job.id, name, body, options);
							if (created) biniou.createdEventCount_++;
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
					rssParser: () => {
						if (!rssParser_) rssParser_ = new RssParser();
						return rssParser_;
					},
					twitterClient: (options:any) => {
						const key = JSON.stringify(options);
						if (twitterClients_[key]) return twitterClients_[key];
						twitterClients_[key] = new Twitter(options);
						return twitterClients_[key];
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
				await this.jobModel.saveState(job.state.id, { last_started: Date.now() });

				const startTime = Date.now();

				try {
					this.logger.info(`Starting job: ${job.id}`);
					if (job.trigger === JobTrigger.Event) {
						this.logger.info(`Number of events: ${options.events.length}`);
						for (let event of options.events) {
							await result.run(event);
							eventsProcessed.push(event.id);
						}
					} else {
						await result.run(null);
					}
					this.logger.info(`Events: Dispatched: ${sandbox.biniou.dispatchEventCount_}; Created: ${sandbox.biniou.createdEventCount_}`);
				} catch (error) {
					// For some reason, error thrown from the executed script do not have the type "Error"
					// but are instead plain object. So recreate the Error object here so that it can
					// be handled correctly by loggers, etc.
					const newError:Error = new Error(error.message);
					newError.stack = error.stack;
					this.logger.jobError(job.id, `In script ${scriptPath}:`, newError);
				}

				await sandbox.biniou.browserClose();
				await this.jobModel.saveState(job.state.id, { last_finished: Date.now() });
				this.logger.info(`Finished job: ${job.id} (Took ${Date.now() - startTime}ms)`);
			}
		}

		return {
			eventsProcessed: eventsProcessed,
		};
	}

	async scheduleJob(job:Job) {
		if (this.scheduledJobs_[job.id]) throw new Error(`Job is already scheduled: ${job.id}`);

		const jobTaskId = `${job.id}_${Date.now()}_${Math.random()}`;

		this.logger.info(`Scheduling: ${job.id}`);

		if (job.trigger === JobTrigger.Cron) {
			this.scheduledJobs_[job.id] = schedule.scheduleJob(job.triggerSpec, () => {
				this.jobQueue_.push(jobTaskId, async () => {
					await this.processJob(job);
				});
			});
		} else if (job.trigger === JobTrigger.Event) {
			if (!this.eventCheckSchedule_) {
				this.eventCheckSchedule_ = schedule.scheduleJob('*/5 * * * *', () => {
					this.logger.info('Running event-based jobs...');
					this.jobQueue_.push(jobTaskId, async () => {
						await this.processEventJobs();
					});
				});
			}
		}
	}

	async scheduleJobs(jobs:Job[]) {
		for (let job of jobs) {
			this.scheduleJob(job);
		}
	}

	async scheduleAllJobs() {
		const jobs = await this.jobModel.all();
		const enabledJobs = jobs.filter(j => j.enabled);
		const disabledCount = jobs.length - enabledJobs.length;
		this.logger.info(`JobService: Scheduling ${enabledJobs.length} job(s). ${disabledCount} job(s) disabled.`);
		await this.scheduleJobs(enabledJobs);
	}

	async processJob(job:Job) {
		if (job.trigger === JobTrigger.Event) {

			let events:Event[] = [];
			const stateModel = new JobStateModel();
			const context = stateModel.parseContext(job.state);
			for (const eventName of job.triggerSpec) {
				const events = await this.eventService.eventsSince(eventName, context);
				// const result = await this.execScript(job, { events: events });

				// Create processed_events table - (id, job_id, event_id, success, error)
				// Record result every time an event is processed
				// Use numeric ID for events - check last event that was done and resume from there

				// context.events[eventName].lastEventIds

				// if (result.eventsProcessed.length === events.length) {

				// } else {

				// }
			}
		} else {
			await this.execScript(job);
		}
	}

	private async processJobs(jobs:Job[], jobTrigger:JobTrigger = null) {
		for (const job of jobs) {
			if (jobTrigger !== null && job.trigger !== jobTrigger) continue;
			await this.processJob(job);
		}
	}

	async processJobsThatNeedToRunNow() {
		const jobs = await this.jobModel.allEnabled();
		const needToRunJobs = await this.jobModel.jobsThatNeedToRunNow(jobs);
		this.logger.info(`JobService: Running ${needToRunJobs.length} job(s) now`);
		await this.processJobs(needToRunJobs);
	}

	private async processEventJobs() {
		const jobModel = new JobModel();
		const jobs = await jobModel.allEnabled();
		const eventJobs = jobs.filter(job => job.trigger === JobTrigger.Event);
		this.logger.info(`JobService: Processing ${eventJobs.length} event job(s)...`);
		return this.processJobs(eventJobs);
	}

	async start() {
		await this.processJobsThatNeedToRunNow();
		await this.scheduleAllJobs();
		await this.processEventJobs();
	}

}
