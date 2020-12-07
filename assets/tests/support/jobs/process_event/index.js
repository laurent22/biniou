exports = {
	run: async function(context) {
		const body = JSON.parse(context.event.body);

		const newEvent = {
			title: `Processed: ${body.title}`,
		};

		await biniou.dispatchEvents('processed_event', [newEvent], { allowDuplicates: true });
	},
};
