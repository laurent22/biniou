import * as Knex from 'knex';

const argv = require('yargs').argv;

const env = argv.env ? argv.env : 'prod';

let dbFilename = `db-${env}.sqlite`;
if (argv.dbConfigFilename) dbFilename = argv.dbConfigFilename;

const defaultConfig_ = {
	client: 'sqlite3',
	connection: {
		filename: `${__dirname}/../../${dbFilename}`,
	},
	useNullAsDefault: true,
	// Allow propery stack traces in case of an error, however
	// it has a small performance overhead so only enable in testing and dev
	asyncStackTraces: env == 'dev' || env === 'testing',
	// debug: env == 'dev' || env === 'testing',
};

let db_:Knex = null;
// When app runs - check if profile dir exists and create if not

async function migrate(db:Knex, options:any = null) {
	options = Object.assign({}, {
		console: {
			info: () => {},
			warn: () => {},
			error: () => {},
		},
	}, options);

	const migrationDirectory = `${__dirname}/../migrations`;

	const config = {
		directory: migrationDirectory,
		// Disable transactions because the models might open one too
		disableTransactions: true,
	};

	// options.console.info(`Using database: ${options.connection.filename}`);
	options.console.info(`Running migrations in: ${config.directory}`);

	const event = await db.migrate.latest(config);

	const log:string[] = event[1];

	if (!log.length) {
		options.console.info('Database is already up to date');
	} else {
		options.console.info(`Ran migrations: ${log.join(', ')}`);
	}
}

export async function setupDatabase(config:any = null) {
	if (db_) throw new Error('Database has already been setup!');
	config = Object.assign({}, defaultConfig_, config);
	db_ = require('knex')(config);
	await migrate(db_);
}

function database():Knex {
	if (!db_) throw new Error('Database has not been setup!');
	return db_;
}

export async function closeDatabase() {
	if (!db_) throw new Error('Database is not open!');
	await db_.destroy();
	db_ = null;
}

export function databaseReady():boolean {
	return !!db_;
}

export default database;

export function defaultConfig() {
	return defaultConfig_;
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
    JavaScript = 'js',
    Shell = 'shell',
}

export enum JobTrigger {
    Cron = 'cron',
    Event = 'event',
}

export type JobTriggerSpec = string | string[]

export enum EventBodyType {
	String = 1,
	Object = 2,
}

export interface Job {
	id: string;
	type: JobType;
	trigger?: JobTrigger,
	triggerSpec?: JobTriggerSpec,
	state: JobState;
	input?: string;
	scriptFile?: string;
	script?: string;
	enabled: boolean;
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
	context?: string
	created_time?: number
	updated_time?: number
}

export interface ProcessedEvent {
	id?: string
	job_id?: string
	event_id?: string
	event_created_time?: number
	success?: number
	error?: string
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
		context: { type: 'string' },
		created_time: { type: 'number' },
		updated_time: { type: 'number' },
	},
	processed_events: {
		id: { type: 'string' },
		job_id: { type: 'string' },
		event_id: { type: 'string' },
		event_created_time: { type: 'number' },
		success: { type: 'number' },
		error: { type: 'string' },
		created_time: { type: 'number' },
		updated_time: { type: 'number' },
	},
};
// AUTO-GENERATED-TYPES
