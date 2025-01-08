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

		for (let i = 0; i < loopCount; i++) {
			const result = await parseRssFeed(query, itemLimit, afterId, includedWords, excludedWords);
			afterId = result.lastId;
			await biniou.dispatchEvents('redditPost', result.items, { allowDuplicates: false });
		}
	},
};
