import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('events', function(table:Knex.CreateTableBuilder) {
		table.string('id', 22).unique().primary().notNullable();
		table.string('job_id', 128).notNullable();
		table.string('hash', 32).notNullable();
		table.string('name', 128).notNullable();
		table.integer('body_type').defaultTo(1).notNullable();
		table.string('body').defaultTo('').notNullable();
		table.integer('created_time').notNullable();
		table.integer('updated_time').notNullable();
	});

	await knex.schema.createTable('job_states', function(table:Knex.CreateTableBuilder) {
		table.string('id', 22).unique().primary().notNullable();
		table.string('job_id', 128).notNullable();
		table.integer('last_started').defaultTo(0).notNullable();
		table.integer('last_finished').defaultTo(0).notNullable();
		table.integer('created_time').notNullable();
		table.integer('updated_time').notNullable();
	});

	await knex.schema.createTable('job_results', function(table:Knex.CreateTableBuilder) {
		table.increments('id').unique().primary().notNullable();
		table.string('job_id', 128).notNullable();
		table.string('event_id', 22).notNullable();
		table.integer('event_created_time').notNullable();
		table.integer('success').defaultTo(0).notNullable();
		table.string('error', 4096).defaultTo('').notNullable();
		table.integer('created_time').notNullable();
		table.integer('updated_time').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('events');
	await knex.schema.dropTable('job_states');
	await knex.schema.dropTable('processed_events');
}

