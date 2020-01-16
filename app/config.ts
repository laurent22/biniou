import * as fs from 'fs-extra';

class Config {

	rootDir_:string;
	env_:string;
	argv_:any;

	async load(argv:any, rootDir:string = null) {
		this.env_ = argv.env;
		this.argv_ = argv;
		if (!rootDir) rootDir = this.defaultRootDir();
		this.rootDir_ = rootDir;
		await fs.mkdirp(this.rootDir_);
	}

	get env():string {
		return this.env_;
	}

	get argv():any {
		return this.argv_;
	}

	private defaultRootDir():string {
		let dirname = 'biniou';
		if (this.env !== 'prod') dirname += '-' + this.env;
		return require('os').homedir() + '/.config/' + dirname;
	}

	get rootDir() {
		return this.rootDir_;
	}

	get dbFilePath() {
		return this.rootDir + '/database.sqlite';
	}

	jobDir(jobId:string):string {
		return this.jobsDir + '/' + jobId;
	}

	jobEventsDir(jobId:string):string {
		return this.eventsDir + '/' + jobId;
	}

	get jobsDir() {
		return this.rootDir + '/jobs';
	}

	get eventsDir() {
		return this.rootDir + '/events';
	}

}

export default new Config();