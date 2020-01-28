import * as fs from 'fs-extra';

class Config {

	rootDir_:string;
	env_:string;
	argv_:any;

	async load(env:string, argv:any, rootDir:string = null) {
		this.env_ = env;
		this.argv_ = argv;
		if (!rootDir) rootDir = this.defaultRootDir();
		this.rootDir_ = rootDir;
		await fs.mkdirp(this.rootDir_);
	}

	get env():string {
		if (!this.env_) return 'dev'; // May happen for early error, when config hasn't been initialised yet
		return this.env_;
	}

	argv(name:string = null):any {
		if (name === null) return this.argv_;
		return this.argv_[name];
	}

	private defaultRootDir():string {
		let dirname = 'biniou';
		if (this.env !== 'prod') dirname += `-${this.env}`;
		return `${require('os').homedir()}/.config/${dirname}`;
	}

	get rootDir() {
		return this.rootDir_;
	}

	get dbFilePath() {
		return `${this.rootDir}/database.sqlite`;
	}

	jobDir(jobId:string):string {
		return `${this.jobsDir}/${jobId}`;
	}

	get jobsDir() {
		return `${this.rootDir}/jobs`;
	}

}

export default new Config();
