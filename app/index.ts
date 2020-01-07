import JobService from './JobService';
import config from './config';

async function main() {
	config.load('/Users/laurent/src/biniou');
	const jobService:JobService = new JobService();
	await jobService.loadJobs();
	await jobService.processJobs(jobService.jobs);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});