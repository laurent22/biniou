import BaseModel from './BaseModel';

export default class ProcessedEventModel extends BaseModel {

	get tableName():string {
		return 'processed_events';
	}

}
