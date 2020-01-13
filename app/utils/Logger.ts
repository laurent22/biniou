import services from "../services";

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

interface LoggerTarget {
	type: TargetType
	level?: LogLevel
	console?: any
}

export default class Logger {

	targets_:LoggerTarget[] = [];
	level_:LogLevel = LogLevel.Info;

	setLevel(level:LogLevel) {
		this.level_ = level;
	}

	level() {
		return this.level_;
	}

	targets() {
		return this.targets_;
	}

	clearTargets() {
		this.targets_ = [];
	}

	addTarget(type:TargetType, options:any = null) {
		let target = { type: type };
		// for (let n in options) {
		// 	target[n] = options[n];
		// }
		this.targets_.push(target);
	}

	objectToString(object:any):string {
		let output = '';

		if (typeof object === 'object') {
			if (object instanceof Error) {
				output = object.toString();
				if (object.stack) output += `\n${object.stack}`;
			} else {
				output = JSON.stringify(object);
			}
		} else {
			output = object;
		}

		return output;
	}

	objectsToString(...object:any[]):string {
		let output = [];
		for (let i = 0; i < object.length; i++) {
			output.push(`"${this.objectToString(object[i])}"`);
		}
		return output.join(', ');
	}

	targetLevel(target:LoggerTarget) {
		if (target.level !== undefined) return target.level;
		return this.level();
	}

	log(level:LogLevel, ...object:any) {
		if (!this.targets_.length) return;

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
				//let serializedObject = this.objectsToString(...object);
				//Logger.fsDriver().appendFileSync(target.path, `${line + serializedObject}\n`);
			} else if (target.type === TargetType.EventLog) {
				services.eventService.dispatchEvent('__biniou__', 'log', {
					level: level,
					message: line + this.objectsToString(...object),
				});
			}
		}
	}

	error(...object:any) {
		return this.log(LogLevel.Error, ...object);
	}
	warn(...object:any) {
		return this.log(LogLevel.Warn, ...object);
	}
	info(...object:any) {
		return this.log(LogLevel.Info, ...object);
	}
	debug(...object:any) {
		return this.log(LogLevel.Debug, ...object);
	}

	static levelStringToId(s:string):LogLevel {
		if (s == 'none') return LogLevel.None;
		if (s == 'error') return LogLevel.Error;
		if (s == 'warn') return LogLevel.Warn;
		if (s == 'info') return LogLevel.Info;
		if (s == 'debug') return LogLevel.Debug;
		throw new Error('Unknown log level: ' + s);
	}

	static levelIdToString(id:LogLevel):string {
		if (id == LogLevel.None) return 'none';
		if (id == LogLevel.Error) return 'error';
		if (id == LogLevel.Warn) return 'warn';
		if (id == LogLevel.Info) return 'info';
		if (id == LogLevel.Debug) return 'debug';
		throw new Error('Unknown level ID: ' + id);
	}

	static levelIds():LogLevel[] {
		return [LogLevel.None, LogLevel.Error, LogLevel.Warn, LogLevel.Info, LogLevel.Debug];
	}

	// static levelEnum():any {
	// 	let output = {};
	// 	const ids = this.levelIds();
	// 	for (let i = 0; i < ids.length; i++) {
	// 		output[ids[i]] = this.levelIdToString(ids[i]);
	// 	}
	// 	return output;
	// }
}
