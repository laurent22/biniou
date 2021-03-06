import BaseModel from './BaseModel';
import { JobState } from '../db';

export default class JobStateModel extends BaseModel {

	protected get tableName(): string {
		return 'job_states';
	}

	public async loadByJobId(jobId: string): Promise<JobState> {
		return this.db(this.tableName).select(this.defaultFields).where({ job_id: jobId }).first();
	}

}
