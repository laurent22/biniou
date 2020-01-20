import BaseModel from './BaseModel';
import { JobState } from '../db';

export interface JobStateContext {
	events: {
		[key:string]: {
			lastHashes: string[],
			lastTimestamp: number,
		}
	}
}

export default class JobStateModel extends BaseModel {

	get tableName():string {
		return 'job_states';
	}

	async loadByJobId(jobId:string):Promise<JobState> {
		return this.db(this.tableName).select(this.defaultFields).where({ job_id: jobId }).first();
	}

	parseContext(jobState:JobState):JobStateContext {
		try {
			let context:JobStateContext = jobState.context ? JSON.parse(jobState.context) : {};
			if (!context) context = { events: {} };
			if (!context.events) context.events = {};
			return context;
		} catch (error) {
			throw new Error(`Could not parse job context: ${jobState.job_id}: ${jobState.context}`);
		}
	}

	saveContext(jobState:JobState, context:any):JobState {
		jobState.context = JSON.stringify(context);
		return jobState;
	}

}
