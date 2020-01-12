import { Job } from "../db";
import { loadJsonFromFile, basename } from '../fileUtils';
import config from '../config';

export default class JobModel {

	static jobDir(id:string):string {
		return config.jobsDir + '/' + id;
	}

	static async load(id:string):Job {
		const path = this.jobDir(id);
		const o:any = await loadJsonFromFile(path + '/job.json');
		const state:any = await loadJsonFromFile(path + '/state.json', false);

		const job:Job = {
			id: basename(path),
			type: o.type,
			state: state,
		};

		if (o.scriptFile) job.scriptFile = o.scriptFile;
		if (o.script) job.script = o.script;
		if (o.input) job.input = o.input;

		return job;
	}

}