exports = {
	run: async function(context) {
		const apiToken = context.params.apiToken;
		const apiPort = context.params.apiPort;
		const folderTitle = context.params.folderTitle;

		const baseUrl = `http://127.0.0.1:${apiPort}`;

		let folder = null;
		let response = null;

		do {
			const responseRaw = await fetch(`${baseUrl}/folders?token=${apiToken}`);
			response = await responseRaw.json();
			folder = response.items.find(n => n.title === folderTitle);
			if (folder) break;
		} while (response.has_more);

		if (!folder) throw new Error(`Could not find a notebook titled "${folderTitle}"`);

		const event = context.event;

		const body = JSON.parse(event.body);
		if (!body) throw new Error(`Invalid event: ${JSON.parse(event)}`);

		const r = await fetch(`${baseUrl}/notes?token=${apiToken}`, {
			method: 'POST',
			body: JSON.stringify({
				title: body.title,
				body: `* Author: ${body.author}\n* URL: ${body.url}\n\n* * *\n\n${body.body}`,
				parent_id: folder.id,
				user_created_time: event.created_time,
				user_updated_time: event.updated_time,
				is_todo: 1,
			}),
			headers: { 'Content-Type': 'application/json' },
		});

		if (!r.ok) throw new Error(`Could not post to Joplin: ${await r.text()}`);
	},
};
