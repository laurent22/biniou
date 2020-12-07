export function sleep(seconds: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, Math.round(1000 * seconds));
	});
}

export function msleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}
