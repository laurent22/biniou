exports = {
	run: async function(context) {
		const params = context.params;

		if (params.simulateError) throw new Error('Simulating error');
		const batchId = params.batchId;
		const events = [];

		for (let i = 0; i < 3; i++) {
			events.push({
				title: batchId ? `title ${batchId} ${i}` : `title ${i}`,
				body: batchId ? `body ${batchId} ${i}` : `body ${i}`,
			});
		}

		await biniou.dispatchEvents('my_event', events);
	},
};
