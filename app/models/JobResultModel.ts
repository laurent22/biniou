import { JobResult } from '../db';
import BaseModel from './BaseModel';

export default class JobResultModel extends BaseModel {

	get tableName():string {
		return 'job_results';
	}

	protected hasUuid():boolean {
		return false;
	}

	public async allByJobId(jobId:string):Promise<JobResult[]> {
		return this
			.db(this.tableName)
			.where('job_id', '=', jobId);
	}

	public async lastByJobAndEvent(jobId:string, eventName:string):Promise<JobResult> {
		return this.db('job_results')
			.select('*')
			.join('events', 'job_results.event_id', '=', 'events.id')
			.where('job_results.job_id', '=', jobId)
			.andWhere('events.name', '=', eventName)
			.orderBy('job_results.id', 'desc')
			.first();
	}

}
