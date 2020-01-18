export function wait(seconds:number):Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, Math.round(1000 * seconds));
	});
}
