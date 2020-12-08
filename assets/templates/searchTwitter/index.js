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
			consumer_key: '8ILo6PDrzbeAZhAYH19wR04gt',
			consumer_secret: 'mJfkiVmHcIJpurmIbwZ3cARfR9Q8Sl1LjQZFosNirPkPYlAPyz',
			access_token_key: '114555770-OiuuqdvJ0jBiCBmMqvfdYZBciHXpJTVMqpq91VKp',
			access_token_secret: 'wIuwYXJiHWjMCwSB5dwfHwogrQyI0Y3cz3S3zHUPqotU2',
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

		// {
		// 	"created_at": "Wed Dec 02 16:12:29 +0000 2020",
		// 	"id": 1334168570222293000,
		// 	"id_str": "1334168570222292993",
		// 	"full_text": "Why did I wait so long to finally checkout @joplinapp ? So useful, able to self host, great features. Just what I was looking for. Switching to it for all my note-taking needs. #joplin #notes #selfhost",
		// 	"truncated": false,
		// 	"display_text_range": [
		// 		0,
		// 		201
		// 	],
		// 	"entities": {
		// 		"hashtags": [
		// 			{
		// 				"text": "joplin",
		// 				"indices": [
		// 					177,
		// 					184
		// 				]
		// 			},
		// 			{
		// 				"text": "notes",
		// 				"indices": [
		// 					185,
		// 					191
		// 				]
		// 			},
		// 			{
		// 				"text": "selfhost",
		// 				"indices": [
		// 					192,
		// 					201
		// 				]
		// 			}
		// 		],
		// 		"symbols": [],
		// 		"user_mentions": [
		// 			{
		// 				"screen_name": "joplinapp",
		// 				"name": "joplinapp",
		// 				"id": 1119166511220838400,
		// 				"id_str": "1119166511220838405",
		// 				"indices": [
		// 					43,
		// 					53
		// 				]
		// 			}
		// 		],
		// 		"urls": []
		// 	},
		// 	"source": "<a href=\"https://tapbots.com/software/tweetbot/mac\" rel=\"nofollow\">Tweetbot for Mac</a>",
		// 	"in_reply_to_status_id": null,
		// 	"in_reply_to_status_id_str": null,
		// 	"in_reply_to_user_id": null,
		// 	"in_reply_to_user_id_str": null,
		// 	"in_reply_to_screen_name": null,
		// 	"user": {
		// 		"id": 15753338,
		// 		"id_str": "15753338",
		// 		"name": "Chris B.",
		// 		"screen_name": "dr_jekyll832",
		// 		"location": "",
		// 		"description": "curl(1) up & dye",
		// 		"url": "https://t.co/1UQ4UFo4xW",
		// 		"entities": {
		// 			"url": {
		// 				"urls": [
		// 					{
		// 						"url": "https://t.co/1UQ4UFo4xW",
		// 						"expanded_url": "http://www.elias-welt.de",
		// 						"display_url": "elias-welt.de",
		// 						"indices": [
		// 							0,
		// 							23
		// 						]
		// 					}
		// 				]
		// 			},
		// 			"description": {
		// 				"urls": []
		// 			}
		// 		},
		// 		"protected": false,
		// 		"followers_count": 145,
		// 		"friends_count": 283,
		// 		"listed_count": 25,
		// 		"created_at": "Wed Aug 06 18:39:57 +0000 2008",
		// 		"favourites_count": 14144,
		// 		"utc_offset": null,
		// 		"time_zone": null,
		// 		"geo_enabled": false,
		// 		"verified": false,
		// 		"statuses_count": 12942,
		// 		"lang": null,
		// 		"contributors_enabled": false,
		// 		"is_translator": false,
		// 		"is_translation_enabled": false,
		// 		"profile_background_color": "1A1B1F",
		// 		"profile_background_image_url": "http://abs.twimg.com/images/themes/theme9/bg.gif",
		// 		"profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme9/bg.gif",
		// 		"profile_background_tile": false,
		// 		"profile_image_url": "http://pbs.twimg.com/profile_images/983748014597660672/8g_ENC-G_normal.jpg",
		// 		"profile_image_url_https": "https://pbs.twimg.com/profile_images/983748014597660672/8g_ENC-G_normal.jpg",
		// 		"profile_banner_url": "https://pbs.twimg.com/profile_banners/15753338/1523378610",
		// 		"profile_link_color": "2FC2EF",
		// 		"profile_sidebar_border_color": "FFFFFF",
		// 		"profile_sidebar_fill_color": "252429",
		// 		"profile_text_color": "666666",
		// 		"profile_use_background_image": true,
		// 		"has_extended_profile": false,
		// 		"default_profile": false,
		// 		"default_profile_image": false,
		// 		"following": false,
		// 		"follow_request_sent": false,
		// 		"notifications": false,
		// 		"translator_type": "none"
		// 	},
		// 	"geo": null,
		// 	"coordinates": null,
		// 	"place": null,
		// 	"contributors": null,
		// 	"is_quote_status": false,
		// 	"retweet_count": 0,
		// 	"favorite_count": 1,
		// 	"favorited": false,
		// 	"retweeted": false,
		// 	"lang": "en"
		// }

		// {
		//     "contributors": null,
		//     "coordinates": null,
		//     "created_at": "Tue Jan 21 06:46:59 +0000 2020",
		//     "entities": {
		//         "hashtags": [],
		//         "symbols": [],
		//         "urls": [
		//             {
		//                 "display_url": "discourse.joplinapp.org/t/joplin-versi…",
		//                 "expanded_url": "https://discourse.joplinapp.org/t/joplin-version-1-0-178/5276",
		//                 "indices": [
		//                     38,
		//                     61
		//                 ],
		//                 "url": "https://t.co/ryK8oQ1l8v"
		//             }
		//         ],
		//         "user_mentions": [
		//             {
		//                 "id": 1119166511220838400,
		//                 "id_str": "1119166511220838405",
		//                 "indices": [
		//                     3,
		//                     13
		//                 ],
		//                 "name": "joplinapp",
		//                 "screen_name": "joplinapp"
		//             }
		//         ]
		//     },
		//     "favorite_count": 0,
		//     "favorited": false,
		//     "geo": null,
		//     "id": 1219511691479855000,
		//     "id_str": "1219511691479855104",
		//     "in_reply_to_screen_name": null,
		//     "in_reply_to_status_id": null,
		//     "in_reply_to_status_id_str": null,
		//     "in_reply_to_user_id": null,
		//     "in_reply_to_user_id_str": null,
		//     "is_quote_status": false,
		//     "lang": "en",
		//     "metadata": {
		//         "iso_language_code": "en",
		//         "result_type": "recent"
		//     },
		//     "place": null,
		//     "possibly_sensitive": false,
		//     "retweet_count": 2,
		//     "retweeted": false,
		//     "retweeted_status": {
		//         "contributors": null,
		//         "coordinates": null,
		//         "created_at": "Mon Jan 20 20:08:06 +0000 2020",
		//         "entities": {
		//             "hashtags": [],
		//             "symbols": [],
		//             "urls": [
		//                 {
		//                     "display_url": "discourse.joplinapp.org/t/joplin-versi…",
		//                     "expanded_url": "https://discourse.joplinapp.org/t/joplin-version-1-0-178/5276",
		//                     "indices": [
		//                         23,
		//                         46
		//                     ],
		//                     "url": "https://t.co/ryK8oQ1l8v"
		//                 }
		//             ],
		//             "user_mentions": []
		//         },
		//         "favorite_count": 9,
		//         "favorited": false,
		//         "geo": null,
		//         "id": 1219350912151576600,
		//         "id_str": "1219350912151576576",
		//         "in_reply_to_screen_name": null,
		//         "in_reply_to_status_id": null,
		//         "in_reply_to_status_id_str": null,
		//         "in_reply_to_user_id": null,
		//         "in_reply_to_user_id_str": null,
		//         "is_quote_status": false,
		//         "lang": "en",
		//         "metadata": {
		//             "iso_language_code": "en",
		//             "result_type": "recent"
		//         },
		//         "place": null,
		//         "possibly_sensitive": false,
		//         "retweet_count": 2,
		//         "retweeted": false,
		//         "source": "<a href=\"https://ifttt.com\" rel=\"nofollow\">IFTTT</a>",
		//         "text": "Joplin version 1.0.178 https://t.co/ryK8oQ1l8v",
		//         "truncated": false,
		//         "user": {
		//             "contributors_enabled": false,
		//             "created_at": "Fri Apr 19 09:11:04 +0000 2019",
		//             "default_profile": true,
		//             "default_profile_image": false,
		//             "description": "An open source note taking app�",
		//             "entities": {
		//                 "description": {
		//                     "urls": []
		//                 },
		//                 "url": {
		//                     "urls": [
		//                         {
		//                             "display_url": "joplinapp.org",
		//                             "expanded_url": "https://joplinapp.org",
		//                             "indices": [
		//                                 0,
		//                                 23
		//                             ],
		//                             "url": "https://t.co/n8QXS7hsQq"
		//                         }
		//                     ]
		//                 }
		//             },
		//             "favourites_count": 3,
		//             "follow_request_sent": false,
		//             "followers_count": 239,
		//             "following": true,
		//             "friends_count": 0,
		//             "geo_enabled": false,
		//             "has_extended_profile": false,
		//             "id": 1119166511220838400,
		//             "id_str": "1119166511220838405",
		//             "is_translation_enabled": false,
		//             "is_translator": false,
		//             "lang": null,
		//             "listed_count": 15,
		//             "location": "",
		//             "name": "joplinapp",
		//             "notifications": false,
		//             "profile_background_color": "F5F8FA",
		//             "profile_background_image_url": null,
		//             "profile_background_image_url_https": null,
		//             "profile_background_tile": false,
		//             "profile_image_url": "http://pbs.twimg.com/profile_images/1204311905340416000/-F9UG1kb_normal.png",
		//             "profile_image_url_https": "https://pbs.twimg.com/profile_images/1204311905340416000/-F9UG1kb_normal.png",
		//             "profile_link_color": "1DA1F2",
		//             "profile_sidebar_border_color": "C0DEED",
		//             "profile_sidebar_fill_color": "DDEEF6",
		//             "profile_text_color": "333333",
		//             "profile_use_background_image": true,
		//             "protected": false,
		//             "screen_name": "joplinapp",
		//             "statuses_count": 70,
		//             "time_zone": null,
		//             "translator_type": "none",
		//             "url": "https://t.co/n8QXS7hsQq",
		//             "utc_offset": null,
		//             "verified": false
		//         }
		//     },
		//     "source": "<a href=\"http://twitter.com\" rel=\"nofollow\">Twitter Web Client</a>",
		//     "text": "RT @joplinapp: Joplin version 1.0.178 https://t.co/ryK8oQ1l8v",
		//     "truncated": false,
		//     "user": {
		//         "contributors_enabled": false,
		//         "created_at": "Sat Aug 27 09:28:56 +0000 2016",
		//         "default_profile": false,
		//         "default_profile_image": false,
		//         "description": "안녕하세요, 저는 폭스마스크입니다",
		//         "entities": {
		//             "description": {
		//                 "urls": []
		//             }
		//         },
		//         "favourites_count": 126,
		//         "follow_request_sent": false,
		//         "followers_count": 93,
		//         "following": false,
		//         "friends_count": 100,
		//         "geo_enabled": false,
		//         "has_extended_profile": false,
		//         "id": 769466716808241200,
		//         "id_str": "769466716808241152",
		//         "is_translation_enabled": false,
		//         "is_translator": false,
		//         "lang": null,
		//         "listed_count": 23,
		//         "location": "",
		//         "name": "폭스마스크 #EmojiBZH ⭐⭐",
		//         "notifications": false,
		//         "profile_background_color": "000000",
		//         "profile_background_image_url": "http://abs.twimg.com/images/themes/theme1/bg.png",
		//         "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme1/bg.png",
		//         "profile_background_tile": false,
		//         "profile_banner_url": "https://pbs.twimg.com/profile_banners/769466716808241152/1519045041",
		//         "profile_image_url": "http://pbs.twimg.com/profile_images/965569579933143041/K2YqJ51J_normal.jpg",
		//         "profile_image_url_https": "https://pbs.twimg.com/profile_images/965569579933143041/K2YqJ51J_normal.jpg",
		//         "profile_link_color": "9E822E",
		//         "profile_sidebar_border_color": "000000",
		//         "profile_sidebar_fill_color": "000000",
		//         "profile_text_color": "000000",
		//         "profile_use_background_image": false,
		//         "protected": false,
		//         "screen_name": "foxxmask",
		//         "statuses_count": 95,
		//         "time_zone": null,
		//         "translator_type": "none",
		//         "url": null,
		//         "utc_offset": null,
		//         "verified": false
		//     }
		// }
	},
};
