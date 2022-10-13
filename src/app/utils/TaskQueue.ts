// import Logger from './Logger';

// import { sleep} from '../utils/timeUtils';

interface Task {
	id: string;
	callback: Function;
}

interface ProcessingTasks {
	[key: string]: Task;
}

interface TaskResult {
	id: string;
	result: any;
	error?: Error;
}

interface TaskResults {
	[key: string]: TaskResult;
}

export default class TaskQueue {

	private waitingTasks_: Task[] = [];
	private processingTasks_: ProcessingTasks = {};
	private processingQueue_: boolean = false;
	private stopping_: boolean = false;
	private results_: TaskResults = {};
	// private name_: string;
	// private logger_: Logger;

	// public constructor(name: string = 'untitled') {
	// 	// this.name_ = name;
	// 	this.logger_ = new Logger();
	// }

	// private get logger(): Logger {
	// 	return this.logger_;
	// }

	// public setLogger(v: Logger) {
	// 	this.logger_ = v;
	// }

	private concurrency() {
		return 1;
	}

	public push(id: string, callback: Function) {
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

		const completeTask = (task: Task, result: any, error: Error) => {
			delete this.processingTasks_[task.id];

			const r: TaskResult = {
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

			task.callback().then((result: any) => {
				completeTask(task, result, null);
			}).catch((error: Error) => {
				if (!error) error = new Error('Unknown error');
				completeTask(task, null, error);
			});
		}

		this.processingQueue_ = false;
	}

	// private isWaiting(taskId: string) {
	// 	return this.waitingTasks_.find(task => task.id === taskId);
	// }

	// private isProcessing(taskId: string) {
	// 	return taskId in this.processingTasks_;
	// }

	// private isDone(taskId: string) {
	// 	return taskId in this.results_;
	// }

	// private async waitForResult(taskId: string) {
	// 	if (!this.isWaiting(taskId) && !this.isProcessing(taskId) && !this.isDone(taskId)) throw new Error(`No such task: ${taskId}`);

	// 	while (true) {
	// 		const task = this.results_[taskId];
	// 		if (task) return task;
	// 		await sleep(0.1);
	// 	}
	// }

	// private async stop() {
	// 	this.stopping_ = true;

	// 	this.logger.info(`TaskQueue.stop: ${this.name_}: waiting for tasks to complete: ${Object.keys(this.processingTasks_).length}`);

	// 	// In general it's not a big issue if some tasks are still running because
	// 	// it won't call anything unexpected in caller code, since the caller has
	// 	// to explicitely retrieve the results
	// 	const startTime = Date.now();
	// 	while (Object.keys(this.processingTasks_).length) {
	// 		await sleep(0.1);
	// 		if (Date.now() - startTime >= 30000) {
	// 			this.logger.warn(`TaskQueue.stop: ${this.name_}: timed out waiting for task to complete`);
	// 			break;
	// 		}
	// 	}

	// 	this.logger.info(`TaskQueue.stop: ${this.name_}: Done, waited for ${Date.now() - startTime}`);
	// }

	// private isStopping() {
	// 	return this.stopping_;
	// }
}
