async function parseRssFeed(query, limit, after, includedWords, excludedWords) {
	let url = `https://www.reddit.com/search/.rss?q=${escape(query)}&sort=new&limit=${limit}`;
	if (after) url += `&after=${after}`;

	const feed = await biniou.rssParser().parseURL(url);
	const bannedWords = excludedWords.map(w => w.toLowerCase());

	const hasIncludedWords = (s) => {
		if (!includedWords.length) return true;

		for (const w of includedWords) {
			if (s.toLowerCase().includes(w.toLowerCased())) return true;
		}

		return false;
	};

	const hasBannedWords = (s) => {
		if (!bannedWords.length) return false;

		for (const w of bannedWords) {
			if (s.toLowerCase().includes(w)) return true;
		}
		return false;
	};

	const output = [];
	let lastId = null;

	for (const item of feed.items) {
		lastId = item.id;

		if (hasBannedWords(item.title)) continue;
		if (hasBannedWords(item.link)) continue;
		if (hasBannedWords(item.content)) continue;
		if (!hasIncludedWords(item.content)) continue;

		output.push(item);
	}

	return {
		lastId: lastId,
		items: output,
	};
}

exports = {
	run: async function(context) {
		const query = context.params.query;
		const excludedWords = context.params.mustExclude || [];
		const includedWords = context.params.mustInclude || [];
		const itemLimit = 100;
		const maxItems = 500;
		const loopCount = Math.round(maxItems / itemLimit);
		let afterId = null;

		// {
		// 	"title": "Searching an Markdown Editor for Windows which can be connected to webdav/nextcloud",
		// 	"link": "https://www.reddit.com/r/opensource/comments/k4q2l4/searching_an_markdown_editor_for_windows_which/",
		// 	"pubDate": "2020-12-01T17:55:11.000Z",
		// 	"author": "/u/XextraneusX",
		// 	"content": "<!-- SC_OFF --><div class=\"md\"><p>Hi, </p> <p>i am searching an editor which can be connected to a nextcloud via nextdav. I tested joplin bun unfortunately it saves only new notebooks on the nextcloud and dont sinc already existing notebooks. Neither .md nor .txt </p> <p>I even checked it there are some plugins for notepad++ or even visual studio code. But seems all plugins are very old and discontinued.</p> </div><!-- SC_ON --> &#32; submitted by &#32; <a href=\"https://www.reddit.com/user/XextraneusX\"> /u/XextraneusX </a> &#32; to &#32; <a href=\"https://www.reddit.com/r/opensource/\"> r/opensource </a> <br/> <span><a href=\"https://www.reddit.com/r/opensource/comments/k4q2l4/searching_an_markdown_editor_for_windows_which/\">[link]</a></span> &#32; <span><a href=\"https://www.reddit.com/r/opensource/comments/k4q2l4/searching_an_markdown_editor_for_windows_which/\">[comments]</a></span>",
		// 	"contentSnippet": "Hi, \n i am searching an editor which can be connected to a nextcloud via nextdav. I tested joplin bun unfortunately it saves only new notebooks on the nextcloud and dont sinc already existing notebooks. Neither .md nor .txt \n I even checked it there are some plugins for notepad++ or even visual studio code. But seems all plugins are very old and discontinued.\n    submitted by    /u/XextraneusX    to    r/opensource  \n [link]   [comments]",
		// 	"id": "t3_k4q2l4",
		// 	"isoDate": "2020-12-01T17:55:11.000Z"
		// }

		for (let i = 0; i < loopCount; i++) {
			const result = await parseRssFeed(query, itemLimit, afterId, includedWords, excludedWords);
			afterId = result.lastId;
			await biniou.dispatchEvents('redditPost', result.items, { allowDuplicates: false });
		}
	},
};
