async function getTweets(client, query) {
	return new Promise((resolve, reject) => {
		// "extended" means we get the full (extended) Tweet
		client.get(query, { tweet_mode: 'extended' }, function(error, tweets, response) {
			if (error) {
				reject(error);
				return;
			}
			resolve(tweets);
		});
	});
}

exports = {
	run: async function(context) {
		const query = context.params.query;
		if (!query) throw new Error('Missing "query" parameter');

		const client = biniou.twitter({
			bearer_token: '',
		});

		const tweets = await getTweets(client, `search/tweets.json?q=${escape(query)}&src=typed_query&f=live&count=100`);

		const events = tweets.statuses.map(tweet => {
			return {
				id: tweet.id_str,
				text: tweet.full_text,
				date: tweet.created_at,
				entities: tweet.entities,
				author: tweet.user.name,
				url: `https://twitter.com/user/status/${tweet.id_str}`,
			};
		});

		await biniou.dispatchEvents('twitterPost', events, { allowDuplicates: false });
	},
};
