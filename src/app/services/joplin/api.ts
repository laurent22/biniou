import fetch from 'node-fetch';

export default function(apiToken: string, apiPort: number) {
	const baseUrl = `http://127.0.0.1:${apiPort}`;

	async function folderByTitle(title: string): Promise<any> {
		let folder = null;
		let response = null;

		do {
			const responseRaw = await fetch(`${baseUrl}/folders?token=${apiToken}`);
			response = await responseRaw.json();
			folder = response.items.find((f: any) => f.title === title);
			if (folder) break;
		} while (response.has_more);

		return folder;
	}

	return {
		postToFolder: async (folderTitle: string, note: any) => {
			const folder: any = await folderByTitle(folderTitle);
			if (!folder) throw new Error(`Could not find a notebook titled "${folderTitle}"`);

			// Useful properties to set, all optional:
			//
			// - title
			// - body
			// - author
			// - source_url
			// - user_created_time
			// - user_updated_time
			// - is_todo = 1 (so that the post can be ticked off once it's been read)
			//
			// If content is in HTML format:
			//
			// - body_html
			// - base_url
			//
			// https://joplinapp.org/api/references/rest_api/#properties

			const response = await fetch(`${baseUrl}/notes?token=${apiToken}`, {
				method: 'POST',
				body: JSON.stringify({
					...note,
					parent_id: folder.id,
				}),
				headers: { 'Content-Type': 'application/json' },
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			return response.json();
		},
	};
}
