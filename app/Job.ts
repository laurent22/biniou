import { loadJsonFromFile, basename } from './fileUtils';
import config from './config';

export enum JobType {
    JavaScript = "js",
    Shell = "shell",
}

export default class Job {

	id: string;
	type: JobType;
	state: any;
	input?: string;
	scriptFile?: string;
	script?: string;

	static async loadJobFromDir(path:string):Promise<Job> {
		const o:any = await loadJsonFromFile(path + '/job.json');
		const state:any = await loadJsonFromFile(path + '/state.json', false);

		const job:Job = new Job();
		job.id = basename(path);
		job.type = o.type;
		job.state = state;

		if (o.scriptFile) job.scriptFile = o.scriptFile;
		if (o.script) job.script = o.script;
		if (o.input) job.input = o.input;

		return job;
	}

}