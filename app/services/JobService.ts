import * as fs from 'fs-extra';
import config from '../config';
import * as vm from 'vm';
import * as puppeteer from 'puppeteer';
import { Job } from '../db';
import BaseService from './BaseService';
import EventService from './EventService';
import JobModel from '../models/JobModel';

export default class JobService extends BaseService {

	eventService_:EventService;

	constructor(eventService:EventService) {
		super();
		this.eventService_ = eventService;
	}

	get eventService():EventService {
		return this.eventService_;
	}
	
	async execScript(job:Job, events:any[]):Promise<string> {
		if (job.type === 'shell') {
			// const result = await execCommand(job.script);
			// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
		} else if (job.type === 'js') {
			const scriptFile = job.scriptFile ? job.scriptFile : 'index.js';
			const scriptPath = config.jobDir(job.id) + '/' + scriptFile;
			const scriptContent = (await fs.readFile(scriptPath)).toString();

			const sandbox = (function(that:JobService) {
				let browser_:puppeteer.Browser = null;

				const biniou:any = {
					dispatchEvent: (name:string, body:any, options:any) => {
						return that.eventService.dispatchEvent(job.id, name, body, options);
					},
					dispatchEvents: async(name:string, bodies:any[], options:any) => {
						for (let body of bodies) {
							await that.eventService.dispatchEvent(job.id, name, body, options);
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
				const jobModel = new JobModel();
				await jobModel.saveState(job.state.id, { last_started: Date.now() });
				
				try {
					this.logger.info('Starting job: ' + job.id);
					await result.run();
				} catch (error) {
					this.logger.error('In script ' + scriptPath + "\n", error);
				}
				
				await sandbox.biniou.browserClose();
				await jobModel.saveState(job.state.id, { last_finished: Date.now() });
				this.logger.info('Finished job: ' + job.id);
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