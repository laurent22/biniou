import * as fs from 'fs-extra';

const moment = require('moment');

export enum LogLevel {
    None = 0,
	Error = 10,
	Warn = 20,
	Info = 30,
	Debug = 40,
}

export enum TargetType {
	None = 0,
	Console = 1,
	File = 2,
	EventLog = 3,
}

export interface LoggerWrapper {
	debug: Function;
	info: Function;
	warn: Function;
	error: Function;
	jobInfo: Function;
	jobWarn: Function;
	jobError: Function;
}

interface LoggerTarget {
	type: TargetType;
	level?: LogLevel;
	console?: any;
	path?: string;
}

interface LogOptions {
	jobId?: string;
}

export default class Logger {

	private targets_: LoggerTarget[] = [];
	private level_: LogLevel = LogLevel.Info;
	private static globalLogger_: Logger = null;
	private static services_: any = null;

	public static initializeGlobalLogger(services: any, logger: Logger) {
		this.globalLogger_ = logger;
		this.services_ = services;
	}

	private static get globalLogger(): Logger {
		if (!this.globalLogger_) throw new Error('Global logger has not been initialized!!');
		return this.globalLogger_;
	}

	public static create(prefix: string): LoggerWrapper {
		return {
			debug: (...object: any[]) => this.globalLogger.log(LogLevel.Debug, `${prefix}:`, ...object),
			info: (...object: any[]) => this.globalLogger.log(LogLevel.Info, `${prefix}:`, ...object),
			warn: (...object: any[]) => this.globalLogger.log(LogLevel.Warn, `${prefix}:`, ...object),
			error: (...object: any[]) => this.globalLogger.log(LogLevel.Error, `${prefix}:`, ...object),
			jobInfo: (jobId: string, ...object: any[]) => this.globalLogger.jobInfo(jobId, ...object),
			jobWarn: (jobId: string, ...object: any[]) => this.globalLogger.jobWarn(jobId, ...object),
			jobError: (jobId: string, ...object: any[]) => this.globalLogger.jobError(jobId, ...object),
		};
	}

	public setLevel(level: LogLevel) {
		this.level_ = level;
	}

	public level() {
		return this.level_;
	}

	public clearTargets() {
		this.targets_ = [];
	}

	public addTarget(type: TargetType, options: any = null) {
		const target = { type: type };
		for (let n in options) {
			(target as any)[n] = options[n];
		}
		this.targets_.push(target);
	}

	private objectToString(object: any): string {
		let output = '';

		if (typeof object === 'object') {
			if (object instanceof Error) {
				object = object as any;
				output = object.toString();
				if (object.code) output += `\nCode: ${object.code}`;
				if (object.headers) output += `\nHeader: ${JSON.stringify(object.headers)}`;
				if (object.request) output += `\nRequest: ${object.request.substr ? object.request.substr(0, 1024) : ''}`;
				if (object.stack) output += `\n${object.stack}`;

				// output = object.toString();
				// if (object.stack) output += `\n${object.stack}`;
			} else {
				output = JSON.stringify(object);
			}
		} else {
			output = object;
		}

		return output;
	}

	private objectsToString(...object: any[]): string {
		let output = [];
		for (let i = 0; i < object.length; i++) {
			output.push(`${this.objectToString(object[i])}`);
		}
		return output.join(' ');
	}

	private targetLevel(target: LoggerTarget) {
		if (target.level !== undefined) return target.level;
		return this.level();
	}

	private logWithOptions(level: LogLevel, options: LogOptions, ...object: any) {
		if (!this.targets_.length) return;

		options = Object.assign({}, {
			jobId: '__biniou__',
		}, options);

		const line = `${moment().format('YYYY-MM-DD HH:mm:ss')}: `;

		for (let i = 0; i < this.targets_.length; i++) {
			const target = this.targets_[i];

			if (this.targetLevel(target) < level) continue;

			if (target.type === TargetType.Console) {
				let fn = 'log';
				if (level === LogLevel.Error) fn = 'error';
				if (level === LogLevel.Warn) fn = 'warn';
				if (level === LogLevel.Info) fn = 'info';
				const consoleObj = target.console ? target.console : console;
				consoleObj[fn](line + this.objectsToString(...object));
			} else if (target.type === TargetType.File) {
				let serializedObject = this.objectsToString(...object);
				fs.appendFileSync(target.path, `${line + serializedObject}\n`);
				// Logger.fsDriver().appendFileSync(target.path, `${line + serializedObject}\n`);
			} else if (target.type === TargetType.EventLog) {
				// Note that log entries might not appear in the order they
				// were dispatched since we don't await for the promise
				void Logger.services_.eventService.dispatchEvent(options.jobId, 'log', {
					level: level,
					message: line + this.objectsToString(...object),
				});
			}
		}
	}

	private log(level: LogLevel, ...object: any) {
		return this.logWithOptions(level, {}, ...object);
	}

	public jobError(jobId: string, ...object: any) {
		return this.logWithOptions(LogLevel.Error, { jobId: jobId }, ...object);
	}

	public jobWarn(jobId: string, ...object: any) {
		return this.logWithOptions(LogLevel.Warn, { jobId: jobId }, ...object);
	}

	public jobInfo(jobId: string, ...object: any) {
		return this.logWithOptions(LogLevel.Info, { jobId: jobId }, ...object);
	}

	public error(...object: any) {
		return this.log(LogLevel.Error, ...object);
	}
	public warn(...object: any) {
		return this.log(LogLevel.Warn, ...object);
	}
	public info(...object: any) {
		return this.log(LogLevel.Info, ...object);
	}
	public debug(...object: any) {
		return this.log(LogLevel.Debug, ...object);
	}

	// static levelStringToId(s: string): LogLevel {
	// 	if (s == 'none') return LogLevel.None;
	// 	if (s == 'error') return LogLevel.Error;
	// 	if (s == 'warn') return LogLevel.Warn;
	// 	if (s == 'info') return LogLevel.Info;
	// 	if (s == 'debug') return LogLevel.Debug;
	// 	throw new Error(`Unknown log level: ${s}`);
	// }

	// static levelIdToString(id: LogLevel): string {
	// 	if (id == LogLevel.None) return 'none';
	// 	if (id == LogLevel.Error) return 'error';
	// 	if (id == LogLevel.Warn) return 'warn';
	// 	if (id == LogLevel.Info) return 'info';
	// 	if (id == LogLevel.Debug) return 'debug';
	// 	throw new Error(`Unknown level ID: ${id}`);
	// }

	// static levelIds(): LogLevel[] {
	// 	return [LogLevel.None, LogLevel.Error, LogLevel.Warn, LogLevel.Info, LogLevel.Debug];
	// }

	// static levelEnum():any {
	// 	let output = {};
	// 	const ids = this.levelIds();
	// 	for (let i = 0; i < ids.length; i++) {
	// 		output[ids[i]] = this.levelIdToString(ids[i]);
	// 	}
	// 	return output;
	// }
}
