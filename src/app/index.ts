#!/usr/bin/env node

require('dotenv').config();

import config from './config';
import * as yargs from 'yargs';
import services from './services';

import RunCommand from './commands/RunCommand';
import StartCommand from './commands/StartCommand';
import StatusCommand from './commands/StatusCommand';
import EventsCommand from './commands/EventsCommand';
import JobsCommand from './commands/JobsCommand';
import { setupDatabase } from './db';
import Logger, { TargetType } from './utils/Logger';
import JobLogCommand from './commands/JobLogCommand';

async function exitProcess(code: number) {
	await services.eventService.waitForDispatches();
	process.exit(code);
}

function setupCommands(): any {
	const commands = [
		new RunCommand(),
		new StartCommand(),
		new StatusCommand(),
		new EventsCommand(),
		new JobsCommand(),
		new JobLogCommand(),
	];

	for (let cmd of commands) {
		yargs.command(cmd.command(), cmd.description(), (yargs) => {
			for (const p of cmd.positionals()) {
				yargs.positional(p.name, p.options ? p.options : {});
			}

			yargs.options(cmd.options());
		});
	}

	yargs.option('env', {
		default: process.env.BINIOU_ENV ? process.env.BINIOU_ENV : 'prod',
		type: 'string',
		choices: ['dev', 'prod'],
		hidden: true,
	});

	yargs.option('stack-trace', {
		default: process.env.BINIOU_STACK_TRACE === '1',
		type: 'boolean',
		hidden: true,
	});

	yargs.option('db-config-filename', {
		type: 'string',
		hidden: true,
	});

	yargs.help();

	const argv = yargs.argv;

	const cmdName = argv._ && argv._.length ? argv._[0] : null;
	let selectedCommand = null;

	for (const cmd of commands) {
		if (cmd.commandName() === cmdName) selectedCommand = cmd;
	}

	return {
		commands: commands,
		argv: argv,
		selectedCommand: selectedCommand,
	};
}

async function showHelp() {
	return new Promise((resolve: Function) => {
		// We have latest version of yargs but types have not been updated
		// year, which means an error on the showHelp argument. To disable
		// that error, cast yargs to any.
		(yargs as any).showHelp((s: string) => resolve(s));
	});
}

async function main() {
	const { argv, selectedCommand } = setupCommands();
	await config.load(argv.env, argv);

	const globalLogger = new Logger();
	if (config.env !== 'test') globalLogger.addTarget(TargetType.Console);
	globalLogger.addTarget(TargetType.File, {
		path: `${config.dataDir}/log.txt`,
	});
	Logger.initializeGlobalLogger(services, globalLogger);

	globalLogger.info(`Opening database: ${config.dbFilePath}`);

	await setupDatabase({
		connection: {
			filename: config.dbFilePath,
		},
	});

	if (!selectedCommand) {
		const help = await showHelp();
		throw new Error(`Command name is required\n\n${help}`);
	}

	await selectedCommand.run(argv);
	await exitProcess(0);
}

main().catch(error => {
	if (config.argv('stack-trace')) {
		console.error(error);
	} else {
		console.error(error.message);
	}

	return exitProcess(1);
});
