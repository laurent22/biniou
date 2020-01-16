require('source-map-support').install();

import config from './config';
import * as yargs from 'yargs';
import services from './services';

import RunCommand from './commands/RunCommand';
import StartCommand from './commands/StartCommand';
import { ErrorBadRequest } from './utils/errors';

async function exitProcess(code:number) {
	await services.eventService.waitForDispatches();
	process.exit(code);
}

function setupCommands():any {
	const commands = [
		new RunCommand(),
		new StartCommand(),
	];

	for (let cmd of commands) {
		yargs.command(cmd.command(), cmd.description(), (yargs) => {
			const positionals = cmd.positionals ? cmd.positionals() : [];

			for (const p of positionals) {
				yargs.positional(p.name, p.options ? p.options : {});
			}
		});
	}

	yargs.option('env', {
		default: 'prod',
		type: 'string',
		choices: ['dev', 'prod'],
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
	return new Promise((resolve:Function) => {
		yargs.showHelp((s:string) => resolve(s));
	});
}

async function main() {
	const { argv, selectedCommand } = setupCommands();
	await config.load(argv);

	if (!selectedCommand) {
		const help = await showHelp();
		throw new Error(`Command name is required\n\n${help}`);
	}

	await selectedCommand.run(argv);
	await exitProcess(0);
}

main().catch(error => {
	console.error(error);
	return exitProcess(1);
});
