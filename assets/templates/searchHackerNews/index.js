exports = {
	run: async function(context) {
		const query = context.query;
		if (!query) throw new Error('Missing "query" parameter');

		const url = `https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=${escape(query)}&sort=byDate&type=all`;

		const events = await biniou.gotoPageAndWaitForSelector(url, '.Story', (elements) => {
			const events = [];
			for (const element of elements) {
				const spans = element.getElementsByTagName('span');
				const event = {};

				const storyTitle = element.querySelector('.Story_title');

				const entryType = !storyTitle ? 'comment' : 'story';

				if (entryType === 'comment') {
					const storyLinks = element.querySelectorAll('.Story_meta .Story_link');
					const titleAnchor = storyLinks[1].querySelector('a');

					event.author = spans[0].innerText;
					event.title = titleAnchor.innerText;
					event.url = titleAnchor.getAttribute('href');
					event.body = element.querySelectorAll('.Story_meta .Story_comment')[0].innerText;
				} else { // Story
					const titleAnchor = storyTitle.querySelector('a');

					event.author = element.querySelectorAll('.Story_meta span')[2].innerText;
					event.title = storyTitle.innerText;
					event.url = titleAnchor.getAttribute('href');
					event.body = element.querySelectorAll('.Story_meta .Story_comment')[0].innerText;
				}

				events.push(event);
			}
			return events;
		});

		await biniou.dispatchEvents('hn_post', events, { allowDuplicates: true });
	},
};
