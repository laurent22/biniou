require('source-map-support').install();

import sqlts from '@rmp135/sql-ts';
import * as fs from 'fs-extra';
import {setupDatabase, closeDatabase} from '../app/db';

const dbTypeScriptFilePath:string = `${__dirname}/../../app/db.ts`;

const nameCasing:'pascal' | 'camel' = 'pascal';

const dbPath = 'db-buildTypes.sqlite';

const config = {
	'dialect': 'sqlite3',
	'connection': {
		'filename': `./${dbPath}`,
	},
	'useNullAsDefault': true,
	'excludedTables': ['main.knex_migrations', 'main.knex_migrations_lock', 'main.android_metadata'],
	'tableNameCasing': nameCasing,
	'interfaceNameFormat': '${table}',
	'filename': './app/db',
	'fileReplaceWithinMarker': '// AUTO-GENERATED-TYPES',
	'singularTableNames': true,
	'extends': {
		'main.events': 'WithDates, WithUuid',
	// 	// 'main.users': 'WithDates, WithUuid',
	// 	// 'main.permissions': 'WithDates, WithUuid',
	// 	// 'main.files': 'WithDates, WithUuid',
	// 	// 'main.api_clients': 'WithDates, WithUuid',
	},
};

function insertContentIntoFile(filePath:string, markerOpen:string, markerClose:string, contentToInsert:string):void {
	const fs = require('fs');
	if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
	let content:string = fs.readFileSync(filePath, 'utf-8');
	// [^]* matches any character including new lines
	const regex:RegExp = new RegExp(`${markerOpen}[^]*?${markerClose}`);
	if (!content.match(regex)) throw new Error(`Could not find markers: ${markerOpen}`);
	content = content.replace(regex, `${markerOpen}\n${contentToInsert}\n${markerClose}`);
	fs.writeFileSync(filePath, content);
}

// To output:
//
// export interface User extends WithDates, WithUuid {
// 	email?: string
// 	password?: string
// 	is_admin?: number
// }
function createTypeString(table:any) {
	const colStrings = [];
	for (const col of table.columns) {
		let name = col.propertyName;
		let type = col.propertyType;

		if (table.extends && table.extends.indexOf('WithDates') >= 0) {
			if (['created_time', 'updated_time'].includes(name)) continue;
		}

		if (table.extends && table.extends.indexOf('WithUuid') >= 0) {
			if (['id'].includes(name)) continue;
		}

		if (table.name === 'events' && name === 'body_type') type = 'EventBodyType';

		colStrings.push(`\t${name}?: ${type}`);
	}

	const header = ['export interface'];
	header.push(table.interfaceName);
	if (table.extends) header.push(`extends ${table.extends}`);

	return `${header.join(' ')} {\n${colStrings.join('\n')}\n}`;
}

// To output:
//
// export const databaseSchema:DatabaseTables = {
// 	users: {
// 		id: { type: "string" },
// 		email: { type: "string" },
// 		password: { type: "string" },
// 		is_admin: { type: "number" },
// 		updated_time: { type: "number" },
// 		created_time: { type: "number" },
// 	},
// }
function createRuntimeObject(table:any) {
	const colStrings = [];
	for (const col of table.columns) {
		let name = col.propertyName;
		let type = col.propertyType;
		colStrings.push(`\t\t${name}: { type: '${type}' },`);
	}

	return `\t${table.name}: {\n${colStrings.join('\n')}\n\t},`;
}

// function execCommand(command:string, options:any = null) {
// 	if (!options) options = {};
// 	const exec = require('child_process').exec;

// 	return new Promise((resolve, reject) => {
// 		exec(command, options, (error:any, stdout:any) => {
// 			if (error) {
// 				if (error.signal == 'SIGTERM') {
// 					resolve('Process was killed');
// 				} else {
// 					reject(error);
// 				}
// 			} else {
// 				resolve(stdout.trim());
// 			}
// 		});
// 	});
// }

async function main() {
	// Create a new blank database and close it
	// sqlts will then re-open the database and build the type definition from it
	await fs.remove(dbPath);

	await setupDatabase({
		connection: {
			filename: dbPath,
		},
	});

	await closeDatabase();

	const definitions = await sqlts.toObject(config);

	const typeStrings = [];
	for (const table of definitions.tables) {
		typeStrings.push(createTypeString(table));
	}

	const tableStrings = [];
	for (const table of definitions.tables) {
		tableStrings.push(createRuntimeObject(table));
	}

	let content = `// Auto-generated using \`npm run generate-types\`\n${typeStrings.join('\n\n')}`;
	content += '\n\n';
	content += `export const databaseSchema:DatabaseTables = {\n${tableStrings.join('\n')}\n};`;

	insertContentIntoFile(dbTypeScriptFilePath, config.fileReplaceWithinMarker, config.fileReplaceWithinMarker, content);
}

main().catch(error => {
	console.error('Fatal error', error);
	process.exit(1);
}).finally(async () => {
	await fs.remove(dbPath);
});
