// const fs = require('fs-extra');

// export function safeFilename(e, maxLength = null, allowSpaces = false) {
// 	if (maxLength === null) maxLength = 32;
// 	if (!e || !e.replace) return '';
// 	const regex = allowSpaces ? /[^a-zA-Z0-9\-_\(\)\. ]/g : /[^a-zA-Z0-9\-_\(\)\.]/g;
// 	const output = e.replace(regex, '_');
// 	return output.substr(0, maxLength);
// }

// exports = {
// 	run: async function(events) {
// 		// const response = await fetch('http://127.0.0.1:41184/folders?token=' + token);
// 		// console.info(await response.json());

// 		const basePath = '/Users/laurent/.config/biniou-dev/posts/hn';

// 		for (let event of events) {
// 			const body = JSON.parse(event.body);
// 			if (!body) throw new Error(`Invalid event: ${JSON.parse(event)}`);

// 			const fileContent = [];

// 			fileContent.push(body.title);
// 			fileContent.push('');
// 			fileContent.push(`Author: ${body.author}\nURL: ${body.url}\n\n${body.body}`);

// 			const filename = `${safeFilename(body.title) || `Untitled_${event.created_time}`}.md`;

// 			await fs.writeFile(`${basePath}/${filename}`, fileContent.join('\n'), 'utf8');



// 			// const r = await fetch('http://127.0.0.1:41184/notes?token=' + token, {
// 			// 	method: 'POST',
// 			// 	body: JSON.stringify({
// 			// 		title: body.title,
// 			// 		body: 'Author: ' + body.author + '\nURL: ' + body.url + '\n\n' + body.body,
// 			// 		parent_id: 'bad5f51a4b564d42a27c2dcab1c69878',
// 			// 		user_created_time: event.created_time,
// 			// 		user_updated_time: event.updated_time,
// 			// 		is_todo: 1,
// 			// 	}),
// 			// 	headers: { 'Content-Type': 'application/json' },
// 			// });

// 			// if (!r.ok) throw new Error('Could not post to Joplin: ' + await r.text());
// 		}

// 		// hn_post {
// 		// 	author: 'gomangogo',
// 		// 	title: 'Ask HN: How do you keep a private journal?',
// 		// 	url: 'https://news.ycombinator.com/item?id=21579887',
// 		// 	body: 'Use Joplin https://joplinapp.org/prereleases/ it offer encryption for your notes'
// 		//   }

// 		// console.info('EVENTS', events);
// 	},
// };
