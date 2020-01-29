// import * as Koa from 'koa';

// export default class Application {

// 	start() {










// 		const render = require('./lib/render');
// 		const logger = require('koa-logger');
// 		const router = require('koa-router')();
// 		const koaBody = require('koa-body');

// 		const Koa = require('koa');
// 		const app = module.exports = new Koa();

// 		// "database"

// 		const posts = [];

// 		// middleware

// 		app.use(logger());

// 		app.use(render);

// 		app.use(koaBody());




// 		/**
//  * Post listing.
//  */

// 		const list = async (ctx) => {
// 			await ctx.render('testing.mustache', { posts: posts });
// 		};

// 		/**
//  * Show creation form.
//  */

// 		const add = async (ctx)  => {
// 			await ctx.render('new');
// 		};

// 		/**
//  * Show post :id.
//  */

// 		const show = async (ctx) => {
// 			const id = ctx.params.id;
// 			const post = posts[id];
// 			if (!post) ctx.throw(404, 'invalid post id');
// 			await ctx.render('show', { post: post });
// 		};

// 		/**
//  * Create a post.
//  */

// 		const create = async (ctx) => {
// 			const post = ctx.request.body;
// 			const id = posts.push(post) - 1;
// 			post.created_at = new Date();
// 			post.id = id;
// 			ctx.redirect('/');
// 		};





// 		// route definitions

// 		router.get('/', list)
// 			.get('/post/new', add)
// 			.get('/post/:id', show)
// 			.post('/post', create);

// 		app.use(router.routes());

// 		// listen

// 		app.listen(3322);










// 	}

// }
