require('source-map-support').install();

import * as fs from 'fs-extra';
import db, { setupDatabase, closeDatabase, databaseReady } from '../app/db';

export const supportDir = `${__dirname}/../../tests/support`;
export const dataDir = `${__dirname}/../../tests/support`;

fs.mkdirpSync(dataDir);

// Wrap an async test in a try/catch block so that done() is always called
// and display a proper error message instead of "unhandled promise error"
export const asyncTest = function(callback:Function) {
	return async function(done:Function) {
		try {
			await callback();
		} catch (error) {
			if (error.constructor.name === 'ExpectationFailed') {
				// ExpectationFailed are handled correctly by Jasmine
			} else {
				console.error(error);
				expect('0').toBe('1', 'Test has thrown an exception - see above error');
			}
		} finally {
			done();
		}
	};
};

export const initDatabase = async function() {
	if (databaseReady()) await clearDatabase();

	const dbPath = `${dataDir}/database-test.sqlite`;
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
