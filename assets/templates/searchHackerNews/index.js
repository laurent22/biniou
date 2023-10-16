const searchByType = async (type, query) => {
	const url = `https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=${escape(query)}&sort=byDate&type=${escape(type)}`;

	return await biniou.gotoPageAndWaitForSelector(url, '.Story', (elements) => {
		const events = [];
		for (const element of elements) {
			const spans = element.getElementsByTagName('span');
			const event = {};

			const storyTitle = element.querySelector('.Story_title');

			const entryType = !storyTitle ? 'comment' : 'story';

			if (entryType === 'comment') {
				const storyLinks = element.querySelectorAll('.Story_meta .Story_link');
				const titleAnchor = storyLinks[1].querySelector('a');

				event.title = titleAnchor.innerText;
				event.author = spans[0].innerText;
				event.url = titleAnchor.getAttribute('href');
				event.body = element.querySelectorAll('.Story_meta .Story_comment')[0].innerText;
				event.contentType = 'comment';
			} else { // Story
				const titleAnchor = storyTitle.querySelector('a');

				event.title = `${storyTitle.innerText} (Post)`;
				event.author = element.querySelectorAll('.Story_meta span')[2].innerText;
				event.url = titleAnchor.getAttribute('href');
				event.body = element.querySelectorAll('.Story_meta .Story_comment')[0]?.innerText || '';
				event.contentType = 'post';
			}

			events.push(event);
		}
		return events;
	});
};

exports = {
	run: async function(context) {
		const query = context.params.query;
		if (!query) throw new Error('Missing "query" parameter');

		const storyEvents = await searchByType('story', query);
		const commentEvents = await searchByType('comment', query);

		const events = storyEvents.concat(commentEvents);

		// const url = `https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=${escape(query)}&sort=byDate&type=all`;

		// let events = await biniou.gotoPageAndWaitForSelector(url, '.Story', (elements) => {
		// 	const events = [];
		// 	for (const element of elements) {
		// 		const spans = element.getElementsByTagName('span');
		// 		const event = {};

		// 		const storyTitle = element.querySelector('.Story_title');

		// 		const entryType = !storyTitle ? 'comment' : 'story';

		// 		if (entryType === 'comment') {
		// 			const storyLinks = element.querySelectorAll('.Story_meta .Story_link');
		// 			const titleAnchor = storyLinks[1].querySelector('a');

		// 			event.title = titleAnchor.innerText;
		// 			event.author = spans[0].innerText;
		// 			event.url = titleAnchor.getAttribute('href');
		// 			event.body = element.querySelectorAll('.Story_meta .Story_comment')[0].innerText;
		// 			event.contentType = 'comment';
		// 		} else { // Story
		// 			const titleAnchor = storyTitle.querySelector('a');

		// 			event.title = `${storyTitle.innerText} (Post)`;
		// 			event.author = element.querySelectorAll('.Story_meta span')[2].innerText;
		// 			event.url = titleAnchor.getAttribute('href');
		// 			event.body = element.querySelectorAll('.Story_meta .Story_comment')[0]?.innerText || '';
		// 			event.contentType = 'post';
		// 		}

		// 		events.push(event);
		// 	}
		// 	return events;
		// });

		await biniou.dispatchEvents('hackerNewsPost', events, { allowDuplicates: false });
	},
};
