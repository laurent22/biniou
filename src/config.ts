class Config {

	rootDir_:string;

	load(rootDir:string) {
		this.rootDir_ = rootDir;
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