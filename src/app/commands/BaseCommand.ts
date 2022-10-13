export default abstract class BaseCommand {

	public commandName(): string {
		const splitted = this.command().split(' ');
		if (!splitted.length) throw new Error(`Invalid command: ${this.command()}`);
		return splitted[0];
	}

	public command(): string {
		throw new Error('Not implemented');
	}

	public description(): string {
		throw new Error('Not implemented');
	}

	public positionals(): any[] {
		return [];
	}

	public options(): any {
		return {};
	}

	public abstract run(argv: any): Promise<void>;

	protected stdout(s: string): void {
		console.info(s);
	}

}
