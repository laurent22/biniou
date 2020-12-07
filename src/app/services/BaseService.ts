import Logger from '../utils/Logger';

export default class BaseService {

	private logger_: Logger = new Logger();

	protected get logger() {
		return this.logger_;
	}

	public setLogger(v: Logger) {
		this.logger_ = v;
	}

}
