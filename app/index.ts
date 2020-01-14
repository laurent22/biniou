require('source-map-support').install();

import config from './config';
import * as yargs from 'yargs';

import commandRun from './commands/run';
import services from './services';

async function exitProcess(code:number) {
	await services.eventService.waitForDispatches();
	process.exit(code);
}

async function main() {
	await config.load();

	yargs.command(commandRun.command(), commandRun.description(), (yargs) => {
		const positionals = commandRun.positionals ? commandRun.positionals() : [];
		for (const p of positionals) {
			yargs.positional(p.name, p.options ? p.options : {});
		}
	}, async (argv:any) => {
		try {
			await commandRun.run(argv);
		} catch (error) {
			console.error(error);
			await exitProcess(1);
		}

		await exitProcess(0);
	});

	yargs.help();

	yargs.argv;
}

main().catch(error => {
	console.error(error);
	return exitProcess(1);
});