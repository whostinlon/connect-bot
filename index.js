const discordjs = require('discord.js');
const client = new discordjs.Client();
const puppeteer = require('puppeteer');
const constants = require('./constants.json')
const newLineSelect = /(\n|\r)(Assignment)/i;
const dateSelect = /((Start:)\W+(\w{3}) (\d{1,2},) (\d{4}) (\w{2}) (\d{1,2}:\d{2} \w{2} \w{3})\W+)?(Due:)\W+/i;
let instanceRun = false;

client.login(constants.token);
client.once('ready', () => {
	client.user.setPresence({ activity: { name: 'for !connect', type: 'WATCHING' }, status: 'dnd' });
});
client.on('message', message => {
	const errorMessage = new discordjs.MessageEmbed()
		.setColor('#E21A23')
		.setTitle('Error')
		.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
		.setTimestamp()
		.setFooter(constants.class + '\nRequested by: ' + message.author.tag);
	if (message.content === '!connect soon' && message.author.username != client.username && !instanceRun) {
		if (message.channel.name != 'bot-commands' && message.channel.name != 'bots') {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots'));
		}
		else {
			const assignmentsDueSoon = [];
			const loading = new discordjs.MessageEmbed()
				.setColor('#1873E8')
				.setTitle('Loading Prompt')
				.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
				.setDescription('Starting up Connect instance...')
				.setTimestamp()
				.setFooter(constants.class + '\nRequested by: ' + message.author.tag);
			(async () => {
				console.log('Processing request for: ' + message.author.tag);
				const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
				const msg = await message.channel.send(loading);
				instanceRun = true;
				const page = await browser.newPage();
				await page.goto('https://newconnect.mheducation.com/');
				await page.waitForNavigation({ waitUntil: 'networkidle0' });
				try {
					await page.type('#login-email', constants.email);
					await page.type('#login-password', constants.password);
					console.log('Successfully typed in credentials.');
					msg.edit(loading.setDescription('Authorization in progress...'));
				}
				catch (error) {
					console.error('An unexpected login error occurred (Username/Password): ' + error.message);
					msg.edit(errorMessage.setDescription('A unexpected error occurred during authorization. Contact yum yum chicken yum yum#2288 for help. (206)'));
				}
				try {
					await page.click('#login-submit-btn');
					console.log('Logging in....');
					await page.waitForSelector('#iframewrapper > iframe');
					console.log('Successfully logged in!');
					msg.edit(loading.setDescription('Successfully logged in...'));
				}
				catch (error) {
					console.error('An unexpected login error occurred (Connect Home Page): ' + error.message);
					msg.edit(errorMessage.setDescription('A unexpected error occurred accessing the Connect Homepage. Contact yum yum chicken yum yum#2288 for help. (606)'));
				}
				const elementHandle = await page.$('#iframewrapper > iframe');
				const frame = await elementHandle.contentFrame();
				await frame.waitForSelector('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(2)');
				const assignmentsList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(1) > div.assignment-title.inner-column-left > h3', el => el.map(e => e.innerText));
				const dueDateList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(2) > p > span.standard-gray-color.default-text.due-date.font-bold', el => el.map(e => e.innerText));
				msg.edit(loading.setDescription('Successfully collected assignments...'));
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
				await page.close();
				instanceRun = false;
				msg.edit(loading.setDescription('Cleaning up...'));
				try {
					await msg.delete();
				}
				catch (error) {
					await message.channel.send(errorMessage.setDescription('A unexpected error occurred during cleaning up my messages (Do I have the permissions to delete my own messages?). Contact yum yum chicken yum yum#2288 or the server owner for help.'));
				}
			})().then(() => {
				if (assignmentsDueSoon.length == 0) {
					const assignmentsDue = new discordjs.MessageEmbed()
						.setColor('#008450')
						.setTitle('Assignments due in the next 7 days')
						.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
						.setDescription('There are no assignments due in the next 7 days.')
						.setTimestamp()
						.setFooter(constants.class + '\nRequested by: ' + message.author.tag);
					try {
						message.channel.send(assignmentsDue);
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.'));
					}
				}
				else {

					const assignmentsDue = new discordjs.MessageEmbed()
						.setColor('#E21A23')
						.setTitle('Assignments due in the next 7 days')
						.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
						.setDescription(assignmentsDueSoon.map(e => {
							return assignmentsDueSoon[assignmentsDueSoon.indexOf(e)].join(' · ');
						}).join('\n'))
						.setTimestamp()
						.setFooter(constants.class + '\nRequested by: ' + message.author.tag);
					try {
						message.channel.send(assignmentsDue);
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.'));
					}
				}
			});
		}
	}
	else if (message.content === '!connect soon' && message.author.username != client.username && instanceRun && (message.channel.name == 'bot-commands' || message.channel.name == 'bots')) {
		const spamPrevent = new discordjs.MessageEmbed()
			.setColor('#E21A23')
			.setTitle('Spam Warning')
			.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
			.setDescription('Another process is running, please wait for that process to finish before submitting a new request.')
			.setTimestamp()
			.setFooter(constants.class + '\nMade by yum yum chicken yum yum#2288');
		try {
			message.channel.send(spamPrevent);
		}
		catch (error) {
			message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.'));
		}
	}
	else if (message.content == '!connect help' || message.content == '!connect' && message.author.username != client.username) {
		if (message.channel.name == 'bot-commands' || message.channel.name == 'bots') {
			const helpMenu = new discordjs.MessageEmbed()
				.setColor('#E21A23')
				.setTitle('Help Menu')
				.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
				.setDescription('A discord bot to quickly retrieve the status of assignments.')
				.setTimestamp()
				.setFooter(constants.class + '\nMade by yum yum chicken yum yum#2288')
				.addFields(
					{ name: '!connect soon', value: 'Gathers the assignments due in the next 7 days.' },
					{ name: '!connect/!connect help', value: 'Provides information about the bot' },
				);
			try {
				message.channel.send(helpMenu);
			}
			catch (error) {
				message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.'));
			}
		}
		else {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots'));
		}
	}
});

