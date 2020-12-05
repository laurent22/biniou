export default abstract class BaseCommand {

	commandName():string {
		const splitted = this.command().split(' ');
		if (!splitted.length) throw new Error(`Invalid command: ${this.command()}`);
		return splitted[0];
	}

	command():string {
		throw new Error('Not implemented');
	}

	description():string {
		throw new Error('Not implemented');
	}

	positionals():any[] {
		return [];
	}

	abstract run(argv:any):Promise<void>;

}
