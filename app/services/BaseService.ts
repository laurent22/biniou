import Logger from "../utils/Logger";

export default class BaseService {

	logger_:Logger = new Logger();

	get logger() {
		return this.logger_;
	}

	setLogger(v:Logger) {
		this.logger_ = v;
	}

}