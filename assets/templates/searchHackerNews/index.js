const searchByType = async (type, query) => {
	const url = 'https://uj5wyc0l7x-dsn.algolia.net/1/indexes/Item_dev_sort_date/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.13.1)%3B%20Browser%20(lite)&x-algolia-api-key=28f0e1ec37a5e792e6845e67da5f20dd&x-algolia-application-id=UJ5WYC0L7X';

	const headers = {
		'accept': '*/*',
		'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
		'content-type': 'application/x-www-form-urlencoded',
		'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"macOS"',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'cross-site',
		'Referer': 'https://hn.algolia.com/',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
	};

	const content = {
		'query': query,
		'analyticsTags': [
			'web',
		],
		'page': 0,
		'hitsPerPage': 30,
		'minWordSizefor1Typo': 4,
		'minWordSizefor2Typos': 8,
		'advancedSyntax': true,
		'ignorePlurals': false,
		'clickAnalytics': true,
		'minProximity': 7,
		'numericFilters': [],
		'tagFilters': [
			[
				type,
			],
			[],
		],
		'typoTolerance': 'min',
		'queryType': 'prefixLast',
		'restrictSearchableAttributes': [
			'title',
			'comment_text',
			'url',
			'story_text',
			'author',
		],
		'getRankingInfo': true,
	};

	const response = await fetch(url, {
		'headers': headers,
		'body': JSON.stringify(content),
		'method': 'POST',
	});

	if (!response.ok) throw new Error('Could not fetch results');

	const results = await response.json();

	const events = [];
	for (const hit of results.hits) {
		const event = {};

		const entryType = hit.story_title ? 'comment' : 'story';

		event.author = hit.author;
		event.url = `https://news.ycombinator.com/item?id=${hit.story_id}`;

		if (entryType === 'comment') {
			event.title = hit.story_title;
			event.body = hit._highlightResult?.comment_text?.value;
			event.contentType = 'comment';
		} else {
			event.title = `${hit.title} (Post)`;
			event.body = '';
			event.contentType = 'post';
		}

		events.push(event);
	}

	return events;
};

exports = {
	run: async function(context) {
		const query = context.params.query;
		if (!query) throw new Error('Missing "query" parameter');

		const storyEvents = await searchByType('story', query);
		const commentEvents = await searchByType('comment', query);

		const events = storyEvents.concat(commentEvents);

		await biniou.dispatchEvents('hackerNewsPost', events, { allowDuplicates: false });
	},
};
