require('source-map-support').install();

import config from './config';
import * as yargs from 'yargs';

import commandRun from './commands/run';

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
			process.exit(1);
		}

		process.exit(0);
	});

	yargs.help();

	yargs.argv;
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});