import * as fs from 'fs-extra';
const md5 = require('md5');

function safeFilename(e: string, maxLength: number = null, allowSpaces: boolean = false): string {
	if (maxLength === null) maxLength = 32;
	if (!e || !e.replace) return '';
	const regex = allowSpaces ? /[^a-zA-Z0-9\-_\(\)\. ]/g : /[^a-zA-Z0-9\-_\(\)\.]/g; // eslint-disable-line no-useless-escape
	const output = e.replace(regex, '_');
	return output.substr(0, maxLength);
}

export default function() {
	return {
		publish: async (basePath: string, title: string, body: string, options: any = null) => {
			options = {
				postDate: new Date(),
				...options,
			};

			await fs.mkdirp(basePath);
			const formattedDate = options.postDate.toISOString().replace(/[:-]/g, '').split('.')[0];
			const hash = md5(escape(title + body)).substr(0, 10);
			const filename = `${formattedDate}_${hash}_${safeFilename(title)}.md`;
			await fs.writeFile(`${basePath}/${filename}`, body, 'utf8');
		},
	};
}
