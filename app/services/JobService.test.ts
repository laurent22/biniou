import { afterAllSetup, beforeEachSetup, initDatabase } from '../../tests/testUtils';
import JobService from './JobService';

describe('JobService', function() {

	beforeEach(async () => {
		await beforeEachSetup();
	});

	afterAll(async () => {
		await afterAllSetup();
	});

	it('should return last events 2', async function() {

	});

});
