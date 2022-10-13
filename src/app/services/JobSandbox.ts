import EventService from './EventService';
import * as puppeteer from 'puppeteer';
import * as Twitter from 'twitter';
// import * as Mustache from 'mustache';
import joplinApi from './joplin/api';
import fsApi from './fs/api';
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');

const TurndownService = require('@joplin/turndown');
const turndownPluginGfm = require('@joplin/turndown-plugin-gfm').gfm;
const Entities = require('html-entities').AllHtmlEntities;
const unescapeHtml = new Entities().decode;
const escapeHtml = new Entities().encode;
const RssParser = require('rss-parser');

export default class JobSandbox {

	private eventService_: EventService;
	private browser_: puppeteer.Browser = null;
	private rssParser_: any = null;
	private twitterClients_: any = {};
	private dispatchEventCount_: number = 0;
	private createdEventCount_: number = 0;
	private jobId_: string;

	public constructor(jobId: string, eventService: EventService) {
		this.eventService_ = eventService;
		this.jobId_ = jobId;
	}

	public get dispatchEventCount(): number {
		return this.dispatchEventCount_;
	}

	public get createdEventCount(): number {
		return this.createdEventCount_;
	}

	public async dispatchEvent(type: string, body: any, options: any) {
		this.dispatchEventCount_++;
		const created = await this.eventService_.dispatchEvent(this.jobId_, type, body, options);
		if (created) this.createdEventCount_++;
	}

	public async dispatchEvents(type: string, bodies: any[], options: any) {
		for (let body of bodies) {
			this.dispatchEventCount_++;
			const created = await this.eventService_.dispatchEvent(this.jobId_, type, body, options);
			if (created) this.createdEventCount_++;
		}
	}

	public async browser() {
		if (this.browser_) return this.browser_;
		this.browser_ = await puppeteer.launch();
		return this.browser_;
	}

	public async browserClose() {
		if (!this.browser_) return;
		await this.browser_.close();
		this.browser_ = null;
	}

	public rssParser() {
		if (!this.rssParser_) this.rssParser_ = new RssParser();
		return this.rssParser_;
	}

	public twitter(options: any) {
		const key = JSON.stringify(options);
		if (this.twitterClients_[key]) return this.twitterClients_[key];
		this.twitterClients_[key] = new Twitter(options);
		return this.twitterClients_[key];
	}

	public get joplin() {
		return joplinApi;
	}

	public get fs() {
		return fsApi;
	}

	public async browserNewPage() {
		const b = await this.browser();
		const page = await b.newPage();
		return page;
	}

	public async gotoPageAndWaitForSelector(url: string, selector: string, callback: any) {
		const page = await this.browserNewPage();
		await page.goto(url);
		await page.waitForSelector(selector);
		return page.$$eval(selector, callback);
	}

	// https://nodemailer.com/about/#example
	public mailer(config: SMTPTransport) {
		return nodemailer.createTransport(config);
	}

	// public mustacheRender(template: string, view: any) {
	// 	return Mustache.render(template, view);
	// }

	public escapeHtml(s: string) {
		return escapeHtml(s);
	}

	public unescapeHtml(s: string) {
		return unescapeHtml(s);
	}

	public turndown(config: any = null) {
		const turndown = new TurndownService({
			headingStyle: 'atx',
			codeBlockStyle: 'fenced',
			bulletListMarker: '-',
			emDelimiter: '*',
			strongDelimiter: '**',
			br: '',
			...config,
		});

		turndown.use(turndownPluginGfm);
		turndown.remove('script');
		turndown.remove('style');

		return turndown;
	}

}
