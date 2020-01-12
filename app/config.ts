import * as fs from 'fs-extra';

class Config {

	rootDir_:string;

	async load(rootDir:string = null) {
		if (!rootDir) rootDir = this.defaultRootDir();
		this.rootDir_ = rootDir;
		await fs.mkdirp(this.rootDir_);
	}

	defaultRootDir():string {
		return require('os').homedir() + '/.config/biniou';
	}

	get rootDir() {
		return this.rootDir_;
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