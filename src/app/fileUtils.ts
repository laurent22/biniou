import * as fs from 'fs-extra';

export async function loadJsonFromFile(path: string, mustExist: boolean = true): Promise<any> {
	if (!(await fs.pathExists(path))) {
		if (mustExist) throw new Error(`File not found: ${path}`);
		return null;
	}

	const fileContent = await fs.readFile(path);

	try {
		return JSON.parse(fileContent.toString());
	} catch (error) {
		throw new Error(`Could not parse JSON file: ${path}: ${error.message}`);
	}
}

export function fileExtensions(path: string): string {
	if (!path) throw new Error('Path is empty');
	const splitted = path.split('.');
	if (splitted.length > 1) return splitted[splitted.length - 1];
	return '';
}

export function basename(path: string): string {
	if (!path) throw new Error('Path is empty');
	let s = path.split(/\/|\\/);
	return s[s.length - 1];
}

export function filename(path: string, includeDir: boolean = false): string {
	if (!path) throw new Error('Path is empty');
	let output = includeDir ? path : basename(path);
	if (output.indexOf('.') < 0) return output;

	const splitted = output.split('.');
	splitted.pop();
	return splitted.join('.');
}
