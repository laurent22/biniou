const fs = require('fs-extra');
const md5 = require('md5');

function safeFilename(e, maxLength = null, allowSpaces = false) {
	if (maxLength === null) maxLength = 32;
	if (!e || !e.replace) return '';
	const regex = allowSpaces ? /[^a-zA-Z0-9\-_\(\)\. ]/g : /[^a-zA-Z0-9\-_\(\)\.]/g; // eslint-disable-line no-useless-escape
	const output = e.replace(regex, '_');
	return output.substr(0, maxLength);
}

const postTemplate = `
# {{{title}}}

* {{#author}}Author: {{{author}}}{{/author}}
* {{#url}}URL: {{{url}}}{{/url}}

* * *

{{{body}}}
`;

exports = {
	run: async function(context) {
		const event = context.event;
		const basePath = context.params.basePath;

		await fs.mkdirp(basePath);

		const body = JSON.parse(event.body);
		if (!body) throw new Error(`Invalid event: ${JSON.parse(event)}`);

		const fileContent = biniou.mustacheRender(postTemplate, body);
		const formattedDate = (new Date(event.created_time)).toISOString().replace(/[:-]/g, '').split('.')[0];
		const hash = md5(JSON.stringify(event)).substr(0, 10);
		const filename = `${formattedDate}_${hash}_${safeFilename(body.title) || `Untitled_${event.created_time}`}.md`;
		await fs.writeFile(`${basePath}/${filename}`, fileContent, 'utf8');
	},
};
