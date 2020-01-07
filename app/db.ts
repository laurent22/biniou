import * as Knex from 'knex';

const argv = require('yargs').argv;
console.info('ARGBV', argv);

const nodeEnv = process.env.NODE_ENV || 'development';

let dbFilename = `db-${nodeEnv}.sqlite`;
if (argv.dbConfigFilename) dbFilename = argv.dbConfigFilename;

const dbConfig_ = {
	client: 'sqlite3',
	connection: {
		filename: `${__dirname}/../../${dbFilename}`,
	},
	useNullAsDefault: true,
	// Allow propery stack traces in case of an error, however
	// it has a small performance overhead so only enable in testing and dev
	asyncStackTraces: nodeEnv == 'development' || nodeEnv === 'testing',
	// debug: nodeEnv == 'development' || nodeEnv === 'testing',
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

// AUTO-GENERATED-TYPES
// Auto-generated using `npm run generate-types`
export interface Event {
	id?: string
	hash?: string
	body_type?: number
	body?: string
	created_time?: number
	updated_time?: number
}

export const databaseSchema:DatabaseTables = {
	events: {
		id: { type: 'string' },
		hash: { type: 'string' },
		body_type: { type: 'number' },
		body: { type: 'string' },
		created_time: { type: 'number' },
		updated_time: { type: 'number' },
	},
};
// AUTO-GENERATED-TYPES
