import * as fs from 'fs-extra';
import * as vm from 'vm';
import { Job, Event, JobTrigger, JobResult } from '../db';
import BaseService from './BaseService';
import EventService from './EventService';
import JobModel from '../models/JobModel';
import fetch from 'node-fetch';
import TaskQueue from '../utils/TaskQueue';
import JobResultModel from '../models/JobResultModel';
import Logger from '../utils/Logger';
import JobSandbox from './JobSandbox';

const schedule = require('node-schedule');

const logger = Logger.create('JobService');

interface ExecScriptOptions {
	events? : Event[];
	params? : any;
}

interface JobContext {
	params: any;
	event?: Event;
}

interface ScheduledJobs {
	[key: string]: any;
}

export default class JobService extends BaseService {

	private eventService_: EventService;
	private eventCheckSchedule_: any = null;
	private scheduledJobs_: ScheduledJobs = {};
	private jobModel_: JobModel;
	private jobQueue_: TaskQueue;

	public constructor(eventService: EventService) {
		super();

		this.eventService_ = eventService;
		this.jobQueue_ = new TaskQueue();
	}

	private get eventService(): EventService {
		return this.eventService_;
	}

	private get jobModel(): JobModel {
		if (!this.jobModel_) this.jobModel_ = new JobModel();
		return this.jobModel_;
	}

	private serializeError(error: any): string {
		if (!error) return '';
		const output = [];
		if (error.message) output.push(error.message);
		if (error.stack) output.push(error.stack);
		return output.join('\n');
	}

	private async execJobRunFunction(runFn: Function, jobId: string, context: JobContext) {
		let processingError = null;
		let success = true;

		try {
			await runFn(context);
		} catch (error) {
			// Error thrown from the Node VM are not of type "Error" so
			// recreate one so that log entry is correctly displayed, with
			// message and stack trace

			if (error.message) {
				processingError = new Error(error.message);
			} else {
				// Some libs, like the Twitter one throw whatever as errors
				// so in that case we just send back everything encoded as
				// JSON.
				processingError = new Error(JSON.stringify(error));
			}

			if (error.stack) processingError.stack = error.stack;

			success = false;
		}

		const jobResult: JobResult = {
			job_id: jobId,
			event_id: context.event ? context.event.id : '',
			event_created_time: context.event ? context.event.created_time : 0,
			success: success ? 1 : 0,
			error: this.serializeError(processingError),
		};

		const processEventModel = new JobResultModel();
		await processEventModel.save(jobResult);

		if (!success) {
			logger.error(`Job #${jobId}: Error running script:`, processingError);
		}
	}

	private async execScript(job: Job, options: ExecScriptOptions = null): Promise<void> {
		options = {
			events: [],
			params: {},
			...options,
		};

		if (job.type === 'shell') {
			// const result = await execCommand(job.script);
			// await fs.writeFile(eventFilePath, JSON.stringify({ created_time: Date.now(), body: result }));
		} else if (job.type === 'js') {
			const jobModel = new JobModel();

			const scriptPath = await jobModel.scriptPath(job);
			const scriptContent = (await fs.readFile(scriptPath)).toString();
			const jobLogger = Logger.create(`Job #${job.id}`);

			const sandbox = (function(that: JobService) {
				const biniou: JobSandbox = new JobSandbox(job.id, that.eventService);

				return {
					console: jobLogger,
					fetch: fetch,
					require: (filePath: string): any => require(filePath),
					biniou: biniou,
				};
			}(this));

			vm.createContext(sandbox);

			const result = vm.runInContext(scriptContent, sandbox);
			if (!result) {
				throw new Error(`Script "${scriptPath}" must export an object with a "run()" function`);
			}

			if (result.run) {
				await this.jobModel.saveState(job.state.id, { last_started: Date.now() });

				const startTime = Date.now();

				const jobContext: JobContext = { params: { ...job.params, ...options.params } };

				try {
					logger.info(`Job #${job.id}: Starting...`);

					if (job.trigger === JobTrigger.Event) {
						for (let event of options.events) {
							await this.execJobRunFunction(
								result.run,
								job.id,
								{ ...jobContext, event },
							);
						}
					} else {
						await this.execJobRunFunction(
							result.run,
							job.id,
							jobContext,
						);
					}

					logger.info(`Job #${job.id}: Dispatched events: ${sandbox.biniou.dispatchEventCount}; Created: ${sandbox.biniou.createdEventCount}`);
				} catch (error) {
					// For some reason, error thrown from the executed script do not have the type "Error"
					// but are instead plain object. So recreate the Error object here so that it can
					// be handled correctly by loggers, etc.
					const newError: Error = new Error(error.message);
					newError.stack = error.stack;
					logger.jobError(job.id, `In script ${scriptPath}:`, newError);
				}

				await sandbox.biniou.browserClose();
				await this.jobModel.saveState(job.state.id, { last_finished: Date.now() });
				logger.info(`Job #${job.id}: Finished (Took ${Date.now() - startTime}ms)`);
			}
		}
	}

	private async scheduleJob(job: Job) {
		if (this.scheduledJobs_[job.id]) throw new Error(`Job is already scheduled: ${job.id}`);

		const jobTaskId = `${job.id}_${Date.now()}_${Math.random()}`;

		logger.info(`Scheduling: ${job.id}`);

		if (job.trigger === JobTrigger.Cron) {
			this.scheduledJobs_[job.id] = schedule.scheduleJob(job.triggerSpec, () => {
				this.jobQueue_.push(jobTaskId, async () => {
					await this.processJob(job);
				});
			});
		} else if (job.trigger === JobTrigger.Event) {
			if (!this.eventCheckSchedule_) {
				this.eventCheckSchedule_ = schedule.scheduleJob('*/5 * * * *', () => {
					logger.info('Running event-based jobs...');
					this.jobQueue_.push(jobTaskId, async () => {
						await this.processEventJobs();
					});
				});
			}
		}
	}

	private async scheduleJobs(jobs: Job[]) {
		for (let job of jobs) {
			await this.scheduleJob(job);
		}
	}

	private async scheduleAllJobs() {
		const jobs = await this.jobModel.all();
		const enabledJobs = jobs.filter(j => j.enabled);
		const disabledCount = jobs.length - enabledJobs.length;
		logger.info(`Scheduling ${enabledJobs.length} job(s). ${disabledCount} job(s) disabled.`);
		await this.scheduleJobs(enabledJobs);
	}

	public async processJob(job: Job, params: any = null) {
		params = params || {};

		if (job.trigger === JobTrigger.Event) {
			for (const eventType of job.triggerSpec) {
				logger.info(`Job #${job.id}: Processing events with type "${eventType}"...`);
				for (let i = 0; i < 1000; i++) {
					const events = await this.eventService.nextEvents(job.id, eventType);
					logger.info(`Job #${job.id}: Number of events: ${events.length}`);
					if (!events.length) break;
					await this.execScript(job, { events, params });
				}
			}
		} else {
			await this.execScript(job, { params });
		}
	}

	private async processJobs(jobs: Job[], jobTrigger: JobTrigger = null) {
		for (const job of jobs) {
			if (jobTrigger !== null && job.trigger !== jobTrigger) continue;
			await this.processJob(job);
		}
	}

	private async processJobsThatNeedToRunNow() {
		const jobs = await this.jobModel.allEnabled();
		const needToRunJobs = await this.jobModel.jobsThatNeedToRunNow(jobs);
		logger.info(`Running ${needToRunJobs.length} job(s) now`);
		await this.processJobs(needToRunJobs);
	}

	private async processEventJobs() {
		const jobModel = new JobModel();
		const jobs = await jobModel.allEnabled();
		const eventJobs = jobs.filter(job => job.trigger === JobTrigger.Event);
		logger.info(`Processing ${eventJobs.length} event job(s)...`);
		return this.processJobs(eventJobs);
	}

	public async start() {
		await this.processJobsThatNeedToRunNow();
		await this.scheduleAllJobs();
		await this.processEventJobs();
	}

}
