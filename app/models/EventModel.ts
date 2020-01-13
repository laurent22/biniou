import db, { Event } from "../db";
import config from '../config';
import uuidgen from "../utils/uuidgen";
import BaseModel, { ModelOptions } from "./BaseModel";

export default class EventModel extends BaseModel {

	get tableName():string {
		return 'events';
	}

	// constructor(options:ModelOptions = null) {
	// 	super(options);

	// }

	async loadByHash(hash:string):Promise<Event> {
		return this.db(this.tableName).select(this.defaultFields).where({ hash: hash }).first();
	}

// 	static async save(event:Event):Event {
// 		const isNew = !!event.id;

// 		if (!isNew) {
// 			event.id = uuidgen(),
// 		}
// 	}

}

// import BaseModel from './BaseModel';
// import UserModel from './UserModel';
// import { User, Session } from '../db';

// export default class SessionModel extends BaseModel {

// 	get tableName():string {
// 		return 'sessions';
// 	}

// 	async sessionUser(sessionId:string):Promise<User> {
// 		const session:Session = await this.load(sessionId);
// 		if (!session) return null;
// 		const userModel = new UserModel({ userId: session.user_id });
// 		return userModel.load(session.user_id);
// 	}

// }