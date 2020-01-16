import * as Knex from 'knex';

const argv = require('yargs').argv;

const env = argv.env ? argv.env : 'prod';

let dbFilename = `db-${env}.sqlite`;
if (argv.dbConfigFilename) dbFilename = argv.dbConfigFilename;

const dbConfig_ = {
	client: 'sqlite3',
	connection: {
		filename: `${__dirname}/../../${dbFilename}`,
	},
	useNullAsDefault: true,
	// Allow propery stack traces in case of an error, however
	// it has a small performance overhead so only enable in testing and dev
	asyncStackTraces: env == 'development' || env === 'testing',
	// debug: env == 'development' || env === 'testing',
};

let knex:Knex = require('knex')(dbConfig_);

export default knex;

export function dbConfig() {
	return dbConfig_;
}

interface DatabaseTableColumn {
	type: string
}

interface DatabaseTable {
	[key:string]: DatabaseTableColumn
}

interface DatabaseTables {
	[key:string]: DatabaseTable
}

export interface WithDates {
	updated_time?: number
	created_time?: number
}

export interface WithUuid {
	id?: string
}

export enum JobType {
    JavaScript = "js",
    Shell = "shell",
}

export enum JobTrigger {
    Cron = "cron",
    Event = "event",
}

export enum EventBodyType {
	String = 1,
	Object = 2,
};

export interface Job {
	id: string;
	type: JobType;
	trigger?: JobTrigger,
	triggerSpec?: string,
	state: JobState;
	input?: string;
	scriptFile?: string;
	script?: string;
}

// AUTO-GENERATED-TYPES
// Auto-generated using `npm run generate-types`
export interface Event extends WithDates, WithUuid {
	job_id?: string
	hash?: string
	name?: string
	body_type?: EventBodyType
	body?: string
}

export interface JobState {
	id?: string
	job_id?: string
	last_started?: number
	last_finished?: number
	created_time?: number
	updated_time?: number
}

export const databaseSchema:DatabaseTables = {
	events: {
		id: { type: 'string' },
		job_id: { type: 'string' },
		hash: { type: 'string' },
		name: { type: 'string' },
		body_type: { type: 'number' },
		body: { type: 'string' },
		created_time: { type: 'number' },
		updated_time: { type: 'number' },
	},
	job_states: {
		id: { type: 'string' },
		job_id: { type: 'string' },
		last_started: { type: 'number' },
		last_finished: { type: 'number' },
		created_time: { type: 'number' },
		updated_time: { type: 'number' },
	},
};
// AUTO-GENERATED-TYPES
