// require('source-map-support').install();

import * as fs from 'fs-extra';
import db, { setupDatabase, closeDatabase, databaseReady } from '../app/db';
import uuidgen from '../app/utils/uuidgen';
import * as path from 'path';
import config from '../app/config';

const suiteId_:string = uuidgen();

let dataDir_:string = null;

export const jobDir:string = path.resolve(__dirname, '../../tests/support/jobs');

async function dataDir():Promise<string> {
	if (dataDir_) return dataDir_;
	dataDir_ = path.resolve(__dirname, '../../tests/data/', suiteId_);
	await fs.mkdirp(dataDir_);
	return dataDir_;
}

export async function beforeEachSetup() {
	await config.load('test', {}, {
		configDir: await dataDir(),
		dataDir: await dataDir(),
	});

	await initDatabase();
}

export async function afterAllSetup() {
	try {
		await closeDatabase();
	} catch (error) {
		// `closeDatabase()` will throw if the database is not open
	}

	if (dataDir_) {
		await fs.remove(dataDir_);
		dataDir_ = null;
	}
}

export const initDatabase = async function() {
	if (databaseReady()) await clearDatabase();

	const dbPath = `${await dataDir()}/database.sqlite`;
	await fs.remove(dbPath);

	const dbOptions = {
		connection: {
			filename: dbPath,
		},
	};
	await setupDatabase(dbOptions);
};

export const clearDatabase = async function():Promise<void> {
	await db()('events').truncate();
	await db()('job_states').truncate();
	await closeDatabase();
};

export async function checkThrowAsync(asyncFn:Function):Promise<any> {
	try {
		await asyncFn();
	} catch (error) {
		return error;
	}
	return null;
}
