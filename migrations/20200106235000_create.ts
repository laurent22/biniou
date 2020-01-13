import * as Knex from 'knex';
// import UserModel from '../app/models/UserModel';
// import ApiClientModel from '../app/models/ApiClientModel';

export async function up(knex: Knex): Promise<any> {
	// await knex.schema.createTable('users', function(table:Knex.CreateTableBuilder) {
	// 	table.string('id', 32).unique().primary().notNullable();
	// 	table.text('email', 'mediumtext').unique().notNullable();
	// 	table.text('password', 'mediumtext').notNullable();
	// 	table.integer('is_admin').defaultTo(0).notNullable();
	// 	table.integer('updated_time').notNullable();
	// 	table.integer('created_time').notNullable();
	// });

	// await knex.schema.createTable('sessions', function(table:Knex.CreateTableBuilder) {
	// 	table.string('id', 32).unique().primary().notNullable();
	// 	table.string('user_id', 32).notNullable();
	// 	table.string('auth_code', 32).defaultTo('').notNullable();
	// 	table.integer('updated_time').notNullable();
	// 	table.integer('created_time').notNullable();
	// });

	// hash: hash,
	// bodyType: bodyType,
	// createdTime: Date.now(),
	// body: eventBody,


	await knex.schema.createTable('events', function(table:Knex.CreateTableBuilder) {
		table.string('id', 22).unique().primary().notNullable();
		table.string('job_id', 22).notNullable();
		table.string('hash', 32).notNullable();
		table.string('name', 128).notNullable();
		table.integer('body_type').defaultTo(1).notNullable();
		table.string('body').defaultTo('').notNullable();
		table.integer('created_time').notNullable();
		table.integer('updated_time').notNullable();
	});
}

export async function down(knex: Knex): Promise<any> {
	await knex.schema.dropTable('events');
}

