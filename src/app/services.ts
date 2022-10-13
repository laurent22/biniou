import EventService from './services/EventService';
import JobService from './services/JobService';

class Services {

	private jobService_: JobService;
	private eventService_: EventService;

	public get eventService(): EventService {
		if (!this.eventService_) {
			this.eventService_ = new EventService();
		}

		return this.eventService_;
	}

	public get jobService(): JobService {
		if (!this.jobService_) {
			this.jobService_ = new JobService(this.eventService);
		}

		return this.jobService_;
	}

}

const services = new Services();
export default services;
