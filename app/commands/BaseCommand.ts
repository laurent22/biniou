export default abstract class BaseCommand {

	commandName() {
		const splitted = this.command().split(' ');
		if (!splitted.length) throw new Error(`Invalid command: ${this.command()}`);
		return splitted[0];
	}

	command() {
		throw new Error('Not implemented');
	}

	description() {
		throw new Error('Not implemented');
	}

	positionals():any[] {
		return [];
	}

	async abstract run(argv:any):Promise<void>;

}
