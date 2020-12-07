import Logger from './Logger';

import { sleep} from '../utils/timeUtils';

interface Task {
	id: string,
	callback: Function,
}

interface ProcessingTasks {
	[key:string]: Task,
}

interface TaskResult {
	id: string,
	result: any,
	error?: Error,
}

interface TaskResults {
	[key:string]: TaskResult,
}

export default class TaskQueue {

	waitingTasks_: Task[] = [];
	processingTasks_:ProcessingTasks = {};
	processingQueue_:boolean = false;
	stopping_:boolean = false;
	results_:TaskResults = {};
	name_:string;
	logger_:Logger;

	constructor(name:string = 'untitled') {
		this.name_ = name;
		this.logger_ = new Logger();
	}

	get logger():Logger {
		return this.logger_;
	}

	setLogger(v:Logger) {
		this.logger_ = v;
	}

	private concurrency() {
		return 1;
	}

	push(id:string, callback:Function) {
		if (this.stopping_) throw new Error('Cannot push task when queue is stopping');

		this.waitingTasks_.push({
			id: id,
			callback: callback,
		});

		this.processQueue();
	}

	private processQueue() {
		if (this.processingQueue_ || this.stopping_) return;

		this.processingQueue_ = true;

		const completeTask = (task:Task, result:any, error:Error) => {
			delete this.processingTasks_[task.id];

			const r:TaskResult = {
				id: task.id,
				result: result,
			};

			if (error) r.error = error;

			this.results_[task.id] = r;

			this.processQueue();
		};

		while (this.waitingTasks_.length > 0 && Object.keys(this.processingTasks_).length < this.concurrency()) {
			if (this.stopping_) break;

			const task = this.waitingTasks_.splice(0, 1)[0];
			this.processingTasks_[task.id] = task;

			task.callback().then((result:any) => {
				completeTask(task, result, null);
			}).catch((error:Error) => {
				if (!error) error = new Error('Unknown error');
				completeTask(task, null, error);
			});
		}

		this.processingQueue_ = false;
	}

	isWaiting(taskId:string) {
		return this.waitingTasks_.find(task => task.id === taskId);
	}

	isProcessing(taskId:string) {
		return taskId in this.processingTasks_;
	}

	isDone(taskId:string) {
		return taskId in this.results_;
	}

	async waitForResult(taskId:string) {
		if (!this.isWaiting(taskId) && !this.isProcessing(taskId) && !this.isDone(taskId)) throw new Error(`No such task: ${taskId}`);

		while (true) {
			const task = this.results_[taskId];
			if (task) return task;
			await sleep(0.1);
		}
	}

	async stop() {
		this.stopping_ = true;

		this.logger.info(`TaskQueue.stop: ${this.name_}: waiting for tasks to complete: ${Object.keys(this.processingTasks_).length}`);

		// In general it's not a big issue if some tasks are still running because
		// it won't call anything unexpected in caller code, since the caller has
		// to explicitely retrieve the results
		const startTime = Date.now();
		while (Object.keys(this.processingTasks_).length) {
			await sleep(0.1);
			if (Date.now() - startTime >= 30000) {
				this.logger.warn(`TaskQueue.stop: ${this.name_}: timed out waiting for task to complete`);
				break;
			}
		}

		this.logger.info(`TaskQueue.stop: ${this.name_}: Done, waited for ${Date.now() - startTime}`);
	}

	isStopping() {
		return this.stopping_;
	}
}
