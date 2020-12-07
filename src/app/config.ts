import * as fs from 'fs-extra';
import * as path from 'path';
const envPaths = require('env-paths');

interface LoadOptions {
	configDir?: string;
	dataDir?: string;
	assetDir?: string;
}

class Config {

	private configDir_:string;
	private dataDir_:string;
	private assetDir_:string;
	private templateDir_:string;
	private env_:string;
	// private argv_:any;

	public async load(env:string, argv:any, options:LoadOptions = null) {
		options = {
			configDir: this.defaultConfigDir(),
			dataDir: this.defaultDataDir(),
			assetDir: path.resolve(path.dirname(path.dirname(__dirname)), 'assets'),
			...options,
		};

		this.env_ = env;
		// this.argv_ = argv;
		this.configDir_ = options.configDir;
		this.dataDir_ = options.dataDir;
		this.assetDir_ = options.assetDir;

		await fs.mkdirp(this.configDir);
		await fs.mkdirp(this.dataDir);
		await fs.mkdirp(this.jobsDir);
	}

	public get env():string {
		if (!this.env_) return 'dev'; // May happen for early error, when config hasn't been initialised yet
		return this.env_;
	}

	// argv(name:string = null):any {
	// 	if (name === null) return this.argv_;
	// 	return this.argv_[name];
	// }

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

	public get configDir():string {
		return this.configDir_;
	}

	public get dataDir():string {
		return this.dataDir_;
	}

	public get assetDir():string {
		return this.assetDir_;
	}

	public get templateDir():string {
		return `${this.assetDir}/templates`;
	}

	public get dbFilePath() {
		return `${this.dataDir}/database.sqlite`;
	}

	public jobDir(jobId:string):string {
		return `${this.jobsDir}/${jobId}`;
	}

	public get jobsDir() {
		return `${this.configDir}/jobs`;
	}

}

export default new Config();
