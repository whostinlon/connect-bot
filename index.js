const discordjs = require('discord.js');
const client = new discordjs.Client();
const puppeteer = require('puppeteer');
const newLineSelect = /(\n|\r)(Assignment)/i;
const dateSelect = /((Start:)\W+(\w{3}) (\d{1,2},) (\d{4}) (\w{2}) (\d{1,2}:\d{2} \w{2} \w{3})\W+)?(Due:)\W+/i;

client.login(process.env.token);
client.once('ready', () => {
	client.user.setPresence({ activity: { name: 'for !connect', type: 'WATCHING' }, status: 'dnd' });
});
client.on('message', message => {
	if (message.content === '!connect soon' && message.author.username != client.username) {
		const assignmentsDueSoon = [];
		const errorMessage = new discordjs.MessageEmbed()
			.setColor('#E21A23')
			.setTitle('Error')
			.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
			.setDescription('A unexpected error occurred. Contact yum yum chicken yum yum#2288 for help.')
			.setThumbnail('https://discord.com/assets/468644ef0a79a3d8163f7778164b756d.svg')
			.setTimestamp()
			.setFooter('General Chemistry II Spring 2021 (CHEM-UA-126)\nRequested by: ' + message.author.tag);
		(async () => {
			console.log('Processing request for: ' + message.author.tag);
			const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
			const page = await browser.newPage();
			await page.goto('https://newconnect.mheducation.com/');
			await page.waitForNavigation({ waitUntil: 'networkidle0' });
			try {
				await page.type('#login-email', process.env.email);
				await page.type('#login-password', process.env.password);
				console.log('Sucessfully typed in credentials.');
			}
			catch (error) {
				console.error('An unexpected login error occured (Username/Password): ' + error.message);
			}
			try {
				await page.click('#login-submit-btn');
				console.log('Logging in....');
				await page.waitForSelector('#iframewrapper > iframe');
				console.log('Sucessfully logged in!');
			}
			catch (error) {
				console.error('An unexpected login error occcured (Connect Home Page): ' + error.message);
			}
			const elementHandle = await page.$('#iframewrapper > iframe');
			const frame = await elementHandle.contentFrame();
			await frame.waitForSelector('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(2)');
			const assignmentsList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(1) > div.assignment-title.inner-column-left > h3', el => el.map(e => e.innerText));
			const dueDateList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(2) > p > span.standard-gray-color.default-text.due-date.font-bold', el => el.map(e => e.innerText));
			const assignments = assignmentsList.map(e => {
				const newE = e.replace(newLineSelect, '');
				return Array.of(newE);
			});
			const dueDates = dueDateList.map(e => {
				const newE = e.replace(dateSelect, '').replace(/, /i, ' ').replace(/\W+at\W+/, ' ');
				return newE;
			});
			assignments.forEach(e => {
				e.push(dueDates[assignments.indexOf(e)]);
			});
			assignments.forEach(e => {
				if (Date.parse(assignments[assignments.indexOf(e)][1]) > Date.now()) {
					assignments[assignments.indexOf(e)][0] = assignments[assignments.indexOf(e)][0];
					assignmentsDueSoon.push(assignments[assignments.indexOf(e)]);
				}
			});
		})().then(() => {
			if (assignmentsDueSoon.length == 0) {
				const assignmentsDue = new discordjs.MessageEmbed()
					.setColor('#008450')
					.setTitle('Assignments due in the next 7 days')
					.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
					.setDescription('There are no assignments due in the next 7 days.')
					.setThumbnail('https://discord.com/assets/468644ef0a79a3d8163f7778164b756d.svg')
					.setTimestamp()
					.setFooter('General Chemistry II Spring 2021 (CHEM-UA-126)\nRequested by: ' + message.author.tag);
				try {
					message.channel.send(assignmentsDue);
				}
				catch (error) {
					message.channel.send(errorMessage);
				}
			}
			else {

				const assignmentsDue = new discordjs.MessageEmbed()
					.setColor('#ffa500')
					.setTitle('Assignments due in the next 7 days')
					.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
					.setDescription(assignmentsDueSoon.map(e => {
						return assignmentsDueSoon[assignmentsDueSoon.indexOf(e)].join(' · ');
					}).join('\n'))
					.setThumbnail('https://discord.com/assets/468644ef0a79a3d8163f7778164b756d.svg')
					.setTimestamp()
					.setFooter('General Chemistry II Spring 2021 (CHEM-UA-126)\nRequested by: ' + message.author.tag);
				try {
					message.channel.send(assignmentsDue);
				}
				catch (error) {
					message.channel.send(errorMessage);
				}
			}
		});
	}
	else if (message.content == '!connect help' || message.content == '!connect' && message.author.username != client.username) {
		const helpMenu = new discordjs.MessageEmbed()
			.setColor('#E21A23')
			.setTitle('Help Menu')
			.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
			.setDescription('A discord bot to quickly retrieve the status of assignments.')
			.setThumbnail('https://discord.com/assets/468644ef0a79a3d8163f7778164b756d.svg')
			.setTimestamp()
			.setFooter('General Chemistry II Spring 2021 (CHEM-UA-126)\nMade by yum yum chicken yum yum#2288')
			.addFields(
				{ name: '!connect soon', value: 'Gathers the assignments due in the next 7 days.' },
				{ name: '!connect/!connect help', value: 'Provides information about the bot' },
			);
		message.channel.send(helpMenu);
	}
});

