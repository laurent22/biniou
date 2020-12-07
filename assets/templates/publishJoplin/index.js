exports = {
	run: async function(events) {
		const apiToken = events.params.apiToken;
		const apiPort = events.params.apiPort;
		const notebookTitle = events.params.notebookTitle;

		console.info('IIIIIIIIIIIII', apiToken, apiPort, notebookTitle);

		const baseUrl = `http://127.0.0.1:${apiPort}`;

		const response = await fetch(`${baseUrl}/folders?token=${apiToken}`);
		console.info(await response.json());

		// for (let event of events) {
		// 	const body = JSON.parse(event.body);
		// 	if (!body) throw new Error('Invalid event: ' + JSON.parse(event));

		// 	const r = await fetch('http://127.0.0.1:' + apiPort + '/notes?token=' + apiToken, {
		// 		method: 'POST',
		// 		body: JSON.stringify({
		// 			title: body.title,
		// 			body: '* Author: ' + body.author + '\n* URL: ' + body.url + '\n\n* * *' + body.body,
		// 			parent_id: 'bad5f51a4b564d42a27c2dcab1c69878',
		// 			user_created_time: event.created_time,
		// 			user_updated_time: event.updated_time,
		// 			is_todo: 1,
		// 		}),
		// 		headers: { 'Content-Type': 'application/json' },
		// 	});

		// 	if (!r.ok) throw new Error('Could not post to Joplin: ' + await r.text());
		// }
	},
};
