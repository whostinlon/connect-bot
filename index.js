/* Require Dependencies and Initialize Discord Client */
const discordjs = require('discord.js');
const client = new discordjs.Client();
const puppeteer = require('puppeteer');
/* Regex Expressions */
const newLineSelect = /(\n|\r)(Assignment)/i;
const dateSelect = /((Start:)\W+(\w{3}) (\d{1,2},) (\d{4}) (\w{2}) (\d{1,2}:\d{2} \w{2} \w{3})\W+)?(Due:)\W+/i;

/* Spam Prevention */
let instanceRun = false;

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
	.setFooter(process.env.class + '\nMade by yum yum chicken yum yum#2288')
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
	.setFooter(process.env.class + '\nMade by yum yum chicken yum yum#2288');

/* Retrieves Assignments Due Soon */
async function retrieveAssignmentsDueSoon(message, assignmentsArray) {
	instanceRun = true;
	console.log('Processing request for: ' + message.author.tag);
	const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
	const msg = await message.channel.send(loading.setDescription('Starting up Connect instance...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	const page = await browser.newPage();
	try {
		await page.goto('https://newconnect.mheducation.com/');
		await page.waitForNavigation({ waitUntil: 'networkidle0' });
	}
	catch (error) {
		console.error('An unexpected login error occurred (Loading Login Page): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred during page loading. Is the webpage down? Contact yum yum chicken yum yum#2288 for help. (206)').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	try {
		await page.type('#login-email', process.env.email);
		await page.type('#login-password', process.env.password);
		console.log('Successfully typed in credentials.');
		msg.edit(loading.setDescription('Authorization in progress...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	}
	catch (error) {
		console.error('An unexpected login error occurred (Username/Password): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred during authorization. Contact yum yum chicken yum yum#2288 for help. (206)').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	try {
		await page.click('#login-submit-btn');
		console.log('Logging in....');
		await page.waitForSelector('#iframewrapper > iframe');
		console.log('Successfully logged in!');
		msg.edit(loading.setDescription('Successfully logged in...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	}
	catch (error) {
		console.error('An unexpected login error occurred (Connect Home Page): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred accessing the Connect Homepage. Contact yum yum chicken yum yum#2288 for help. (606)').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	const elementHandle = await page.$('#iframewrapper > iframe');
	const frame = await elementHandle.contentFrame();
	await frame.waitForSelector('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(2)');
	const assignmentsList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(1) > div.assignment-title.inner-column-left > h3', el => el.map(e => e.innerText));
	const dueDateList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > main > div > ul:nth-child(4) > li >  div.col-xs-11.assignment-title-container > div > div > div:nth-child(2) > p > span.standard-gray-color.default-text.due-date.font-bold', el => el.map(e => e.innerText));
	msg.edit(loading.setDescription('Successfully collected assignments...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
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
			assignmentsArray.push(assignments[assignments.indexOf(e)]);
		}
	});
	assignmentsArray = assignmentsArray.sort((a, b) => {
		return Date.parse(a[1]) - Date.parse(b[1]);
	});
	await page.close();
	msg.edit(loading.setDescription('Cleaning up...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	try {
		await msg.delete();
		instanceRun = false;
	}
	catch (error) {
		await message.channel.send(errorMessage.setDescription('A unexpected error occurred during cleaning up my messages (Do I have the permissions to delete my own messages?). Contact yum yum chicken yum yum#2288 or the server owner for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	browser.close();
}

/* Retrieves All Assignments */
async function retrieveAllAssignments(message, assignmentsArray) {
	instanceRun = true;
	console.log('Processing request for: ' + message.author.tag);
	const browser = await puppeteer.launch({ headless: false });
	const msg = await message.channel.send(loading.setDescription('Starting up Connect instance...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	const page = await browser.newPage();
	try {
		await page.goto('https://newconnect.mheducation.com/');
		await page.waitForNavigation({ waitUntil: 'networkidle0' });
	}
	catch (error) {
		console.error('An unexpected login error occurred (Loading Login Page): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred during page loading. Is the webpage down? Contact yum yum chicken yum yum#2288 for help. (206)').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	try {
		await page.type('#login-email', process.env.email);
		await page.type('#login-password', process.env.password);
		console.log('Successfully typed in credentials.');
		msg.edit(loading.setDescription('Authorization in progress...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	}
	catch (error) {
		console.error('An unexpected login error occurred (Username/Password): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred during authorization. Contact yum yum chicken yum yum#2288 for help. (206)').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	try {
		await page.click('#login-submit-btn');
		console.log('Logging in....');
		await page.waitForSelector('#iframewrapper > iframe');
		console.log('Successfully logged in!');
		msg.edit(loading.setDescription('Successfully logged in...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	}
	catch (error) {
		console.error('An unexpected login error occurred (Connect Home Page): ' + error.message);
		msg.edit(errorMessage.setDescription('A unexpected error occurred accessing the Connect Homepage. Contact yum yum chicken yum yum#2288 for help. (606)').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
	const elementHandle = await page.$('#iframewrapper > iframe');
	const frame = await elementHandle.contentFrame();
	await frame.waitForSelector('#ember1591 > div > div:nth-child(1) > button');
	await frame.focus('#ember1591 > div > div:nth-child(1) > button');
	await frame.type('#ember1591 > div > div:nth-child(1) > button', '\n');
	await frame.focus('#classesMenu > a');
	await frame.type('#classesMenu > a', '\n');
	await frame.focus('#classes_126913595SubMenu > a', '\n');
	await frame.click('#classes_126913595SubMenu > a');
	const assignmentsList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > div > div.course-detail-wrapper > main > ul > li > div.col-xs-11.assignment-title-container > div > div > div:nth-child(1) > div.assignment-title.inner-column-left > h3', el => el.map(e => e.innerText));
	const dueDateList = await frame.$$eval('#layoutWrapper > div > div > div > div.container-fluid.connect-assignment-container.connect-result-wrapper.set-aria-hidden > div > div > div.course-detail-wrapper > main > ul > li > div.col-xs-11.assignment-title-container > div > div > div:nth-child(2) > p > span.standard-gray-color.default-text.due-date.font-bold', el => el.map(e => e.innerText));
	msg.edit(loading.setDescription('Successfully collected assignments...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
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
			assignmentsArray.push(assignments[assignments.indexOf(e)]);
		}
	});
	assignmentsArray = assignmentsArray.sort((a, b) => {
		return Date.parse(a[1]) - Date.parse(b[1]);
	});
	await page.close();
	msg.edit(loading.setDescription('Cleaning up...').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
	try {
		await msg.delete();
		instanceRun = false;
	}
	catch (error) {
		await message.channel.send(errorMessage.setDescription('A unexpected error occurred during cleaning up my messages (Do I have the permissions to delete my own messages?). Contact yum yum chicken yum yum#2288 or the server owner for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		instanceRun = false;
	}
}

/* Discord Login and Setup */
client.login(process.env.token);
client.once('ready', () => {
	client.user.setPresence({ activity: { name: 'for !connect', type: 'WATCHING' }, status: 'dnd' });
});

/* Discord Command Handling */
client.on('message', message => {
	if (message.content == '!connect soon' && message.author.username != client.username && !instanceRun) {
		if (message.channel.name != 'bot-commands' && message.channel.name != 'bots') {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		}
		else {
			const assignmentsDueSoon = [];
			retrieveAssignmentsDueSoon(message, assignmentsDueSoon).then(() => {
				if (assignmentsDueSoon.length == 0) {
					try {
						message.channel.send(noAssignmentsDue.setTitle('Assignments Due in the next 7 Days').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
				}
				else {
					try {
						message.channel.send(assignmentsDue.setTitle('Assignments Due in the next 7 Days').setDescription(assignmentsDueSoon.map(e => {
							return assignmentsDueSoon[assignmentsDueSoon.indexOf(e)].join(' · ');
						}).join('\n')).setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
				}
			});
		}
	}
	else if (message.content == '!connect all' && message.author.username != client.username && !instanceRun) {
		if (message.channel.name != 'bot-commands' && message.channel.name != 'bots') {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		}
		else {
			const allAssignments = [];
			instanceRun = false;
			retrieveAllAssignments(message, allAssignments).then(() => {
				if (allAssignments.length == 0) {
					try {
						message.channel.send(noAssignmentsDue.setTitle('Assignments Due in the Future').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
				}
				else {
					try {
						message.channel.send(assignmentsDue.setTitle('All Future Assignments').setDescription(allAssignments.map(e => {
							return allAssignments[allAssignments.indexOf(e)].join(' · ');
						}).join('\n')).setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
					catch (error) {
						message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
					}
				}
			});
		}
	}
	else if (message.content == '!connect soon' && message.author.username != client.username && instanceRun && (message.channel.name == 'bot-commands' || message.channel.name == 'bots')) {
		try {
			message.channel.send(spamPrevent);
		}
		catch (error) {
			message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		}
	}
	else if (message.content == '!connect help' || message.content == '!connect' && message.author.username != client.username) {
		if (message.channel.name == 'bot-commands' || message.channel.name == 'bots') {
			try {
				message.channel.send(helpMenu);
			}
			catch (error) {
				message.channel.send(errorMessage.setDescription('A unexpected error occurred during message output. Contact yum yum chicken yum yum#2288 for help.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
			}
		}
		else {
			message.channel.send(errorMessage.setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		}
	}
	else if (message.content.split(' ')[0] == '!connect') {
		if (message.channel.name == 'bot-commands' || message.channel.name == 'bots') {
			message.channel.send(errorMessage.setTitle('Unknown Command').setDescription('I don\'t know what to do from here. Please refer to !connect help for more information.').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		}
		else {
			message.channel.send(errorMessage.setTitle('Error').setDescription('This doesn\'t seem to be a channel for bots. Are you in the right channel? I can only be used in channels named #bot-commands or #bots').setFooter(process.env.class + '\nRequested by: ' + message.author.tag));
		}
	}
});

