import EventService from './services/EventService';
import Logger, {TargetType} from './utils/Logger';
import JobService from './services/JobService';

class Services {

	private logger_: Logger;
	private jobService_: JobService;
	private eventService_: EventService;

	private get logger(): Logger {
		if (!this.logger_) {
			this.logger_ = new Logger();
			// this.logger_.addTarget(TargetType.Console);
			this.logger_.addTarget(TargetType.EventLog);
		}
		return this.logger_;
	}

	public get eventService(): EventService {
		if (!this.eventService_) {
			this.eventService_ = new EventService();
			this.eventService_.setLogger(this.logger);
		}

		return this.eventService_;
	}

	public get jobService(): JobService {
		if (!this.jobService_) {
			this.jobService_ = new JobService(this.eventService);
			this.jobService_.setLogger(this.logger);
		}

		return this.jobService_;
	}

}

const services = new Services();
export default services;
