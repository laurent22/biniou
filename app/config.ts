import * as fs from 'fs-extra';
const envPaths = require('env-paths');

class Config {

	configDir_:string;
	dataDir_:string;
	env_:string;
	argv_:any;

	async load(env:string, argv:any) {
		this.env_ = env;
		this.argv_ = argv;
		this.configDir_ = this.defaultConfigDir();
		this.dataDir_ = this.defaultDataDir();

		await fs.mkdirp(this.configDir);
		await fs.mkdirp(this.dataDir);
		await fs.mkdirp(this.jobsDir);
	}

	get env():string {
		if (!this.env_) return 'dev'; // May happen for early error, when config hasn't been initialised yet
		return this.env_;
	}

	argv(name:string = null):any {
		if (name === null) return this.argv_;
		return this.argv_[name];
	}

	private defaultConfigDir():string {
		let dirname = 'biniou';
		if (this.env !== 'prod') dirname += `-${this.env}`;
		return `${require('os').homedir()}/.config/${dirname}`;
	}

	private defaultDataDir():string {
		let dirname = 'biniou';
		if (this.env !== 'prod') dirname += `-${this.env}`;
		const paths = envPaths(dirname, {suffix: ''});
		return paths.data;
	}

	get configDir() {
		return this.configDir_;
	}

	get dataDir() {
		return this.dataDir_;
	}

	get dbFilePath() {
		return `${this.dataDir}/database.sqlite`;
	}

	jobDir(jobId:string):string {
		return `${this.jobsDir}/${jobId}`;
	}

	get jobsDir() {
		return `${this.configDir}/jobs`;
	}

}

export default new Config();
