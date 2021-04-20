/* Require Dependencies and Initialize Discord Client */
const discordjs = require('discord.js');
const client = new discordjs.Client();
const puppeteer = require('puppeteer');
/* Regex Expressions */
const newLineSelect = /(\n|\r)(Assignment)/i;
const dateSelect = /((Start:)\W+(\w{3}) (\d{1,2},) (\d{4}) (\w{2}) (\d{1,2}:\d{2} \w{2} \w{3})\W+)?(Due:)\W+/i;
/* Spam Prevention */
let instanceRun = false;

const constants = require('./constants.json');

/* Embed Message Declarations */
const loading = new discordjs.MessageEmbed()
	.setColor('#1873E8')
	.setTitle('Loading Prompt')
	.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
	.setTimestamp();

const errorMessage = new discordjs.MessageEmbed()
	.setColor('#E21A23')
	.setTitle('Error')
	.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
	.setTimestamp();

const noAssignmentsDue = new discordjs.MessageEmbed()
	.setColor('#008450')
	.setTitle('Assignments due in the next 7 days')
	.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
	.setDescription('There are no assignments due in the next 7 days.')
	.setTimestamp();

const assignmentsDue = new discordjs.MessageEmbed()
	.setColor('#E21A23')
	.setTitle('Assignments due in the next 7 days')
	.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
	.setTimestamp();

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

const spamPrevent = new discordjs.MessageEmbed()
	.setColor('#E21A23')
	.setTitle('Spam Warning')
	.setAuthor('Connect Bot', 'https://www.mheducation.com/content/dam/mhe/webassets/og/MHE_logo.png', 'https://newconnect.mheducation.com/')
	.setDescription('Another process is running, please wait for that process to finish before submitting a new request.')
	.setTimestamp()
	.setFooter(constants.class + '\nMade by yum yum chicken yum yum#2288');

/* Retrieves Assignments */
async function retrieveConnectAssignments(message, assignmentsDueSoon) {
	instanceRun = true;
	console.log('Processing request for: ' + message.author.tag);
	const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
	const msg = await message.channel.send(loading.setDescription('Starting up Connect instance...').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
	const page = await browser.newPage();
	try {
		await page.goto('https://newconnect.mheducation.com/');
		await page.waitForNavigation({ waitUntil: 'networkidle0' });
	}
	catch (error) {
		console.error('An unexpected login error occurred (Loading Login Page): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred during page loading. Is the webpage down? Contact yum yum chicken yum yum#2288 for help. (206)').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	try {
		await page.type('#login-email', constants.email);
		await page.type('#login-password', constants.password);
		console.log('Successfully typed in credentials.');
		msg.edit(loading.setDescription('Authorization in progress...').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
	}
	catch (error) {
		console.error('An unexpected login error occurred (Username/Password): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred during authorization. Contact yum yum chicken yum yum#2288 for help. (206)').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	try {
		await page.click('#login-submit-btn');
		console.log('Logging in....');
		await page.waitForSelector('#iframewrapper > iframe');
		console.log('Successfully logged in!');
		msg.edit(loading.setDescription('Successfully logged in...').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
	}
	catch (error) {
		console.error('An unexpected login error occurred (Connect Home Page): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred accessing the Connect Homepage. Contact yum yum chicken yum yum#2288 for help. (606)').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	const elementHandle = await page.$('#iframewrapper > iframe');
	const frame = await elementHandle.contentFrame();
	await frame.waitForSelector('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(2)');
	const assignmentsList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(1) > div.assignment-title.inner-column-left > h3', el => el.map(e => e.innerText));
	const dueDateList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(2) > p > span.standard-gray-color.default-text.due-date.font-bold', el => el.map(e => e.innerText));
	msg.edit(loading.setDescription('Successfully collected assignments...').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
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
	msg.edit(loading.setDescription('Cleaning up...').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
	try {
		await msg.delete();
		instanceRun = false;
	}
	catch (error) {
		await message.channel.send(errorMessage.setDescription('A unexpected error occurred during cleaning up my messages (Do I have the permissions to delete my own messages?). Contact yum yum chicken yum yum#2288 or the server owner for help.').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
}

/* Discord Login and Setup */
client.login(constants.token);
client.once('ready', () => {
	client.user.setPresence({ activity: { name: 'for !connect', type: 'WATCHING' }, status: 'dnd' });
});

/* Discord Command Handling */
client.on('message', message => {
	if (message.content === '!connect soon' && message.author.username != client.username && !instanceRun) {
		if (message.channel.name != 'bot-commands' && message.channel.name != 'bots') {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		}
		else {
			const assignmentsDueSoon = [];
			retrieveConnectAssignments(message, assignmentsDueSoon).then(() => {
				if (assignmentsDueSoon.length == 0) {
					try {
						message.channel.send(noAssignmentsDue.setFooter(constants.class + '\nRequested by: ' + message.author.tag));
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
					}
				}
				else {
					try {
						message.channel.send(assignmentsDue.setDescription(assignmentsDueSoon.map(e => {
							return assignmentsDueSoon[assignmentsDueSoon.indexOf(e)].join(' · ');
						}).join('\n')).setFooter(constants.class + '\nRequested by: ' + message.author.tag));
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
					}
				}
			});
		}
	}
	else if (message.content === '!connect soon' && message.author.username != client.username && instanceRun && (message.channel.name == 'bot-commands' || message.channel.name == 'bots')) {
		try {
			message.channel.send(spamPrevent);
		}
		catch (error) {
			message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		}
	}
	else if (message.content == '!connect help' || message.content == '!connect' && message.author.username != client.username) {
		if (message.channel.name == 'bot-commands' || message.channel.name == 'bots') {
			try {
				message.channel.send(helpMenu);
			}
			catch (error) {
				message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
			}
		}
		else {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		}
	}
	else if (message.content.split(' ')[0] == '!connect') {
		if (message.channel.name == 'bot-commands' || message.channel.name == 'bots') {
			message.channel.send(errorMessage.setTitle('Unknown Command').setDescription('I don\'t know what to do from here. Please refer to !connect help for more information.').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		}
		else {
			message.channel.send(errorMessage.setTitle('Error').setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(constants.class + '\nRequested by: ' + message.author.tag));
		}
	}
});

