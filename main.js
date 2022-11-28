const puppeteer = require('puppeteer');
const fs = require('fs');

const DEBUG_DIR = "./debug/";

/**
 * config file
 */
const config = require('./config.json');

/**
 * ANSI color codes
 */
const ANSI_COLOR_RESET = "\x1b[0m";
const ANSI_COLOR_RED = "\x1b[31m";
const ANSI_COLOR_GREEN = "\x1b[32m";
const ANSI_COLOR_YELLOW = "\x1b[33m";

/**
 * Colorizes a input string.
 * @param {String} content - string to be colorized
 * @param {String} color - target color
 * @return {String} - string encapsulated with ANSI color code
 */
function colorizeString(content, color="default"){
	if (color == 'red'){
		content = ANSI_COLOR_RED + content;
	}
	else if(color == 'green'){
		content = ANSI_COLOR_GREEN + content;
	}
	else if (color == 'yellow'){
		content = ANSI_COLOR_YELLOW + content;
	}
	content += ANSI_COLOR_RESET;
	return content
}

async function puppeteerInit(){
	const args = puppeteer.defaultArgs().filter(arg => arg !== '--enable-asm-webassembly');
	args.push('--enable-webgl-draft-extensions', '--shared-array-buffer');
	const browser = await puppeteer.launch({ ignoreDefaultArgs: true, args });
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
	return [browser, page];
}

/**
 * Crawler code.
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {Boolean} login - use login if true
 */
async function crawl(page, website, login=false){
	const home = config[website].home;
	const email = config[website].email;
	const password = config[website].password;

	process.stdout.write("Navigating to " + colorizeString(home, 'yellow') + " ...");
	await page.goto(home, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));
	
	process.stdout.write("Extracting all hyperlinks...");
	const hrefs = await page.evaluate(() => {
		return Array.from(document.getElementsByTagName('a'), a => a.href);
	});
	process.stdout.write(colorizeString("done!\n", "green"));
	
	if(login){
		let type_delay_per_char = 200;
		let debug = true;
		page = await eval(website + "_login(page, website, hrefs, email, password, type_delay_per_char=type_delay_per_char, debug=debug)");
	}

	console.log("Crawlling begins...")
	
	for(let i = 0; i < hrefs.length; i++){
		if(hrefs[i] == ''){
			continue
		}
		if(hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1){
			continue;
		}
		await page.goto(hrefs[i], {'timeout': 60000});
		//await page.goBack();
		var cur=await page.evaluate(() => {
			return Array.from(document.getElementsByTagName('a'), a => a.href);
		});

		if(hrefs.length < 20000){
			hrefs.push.apply(hrefs, cur);
		}/*else{
			const fs = require('fs');
			for(let i =0;i<hrefs.length;i++){
				fs.writeFile('./target.txt',hrefs[i],function (err,data) {
					if (err) {
						return console.log(err);
					}
					console.log(data);
				});
			}
		}*/
		console.log(i + " " + hrefs[i]);
	}
}

/**
 * Yelp login code.
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
 async function yelp_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){

	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}

	process.stdout.write("Extracting login link...");
	const login_link = hrefs.filter(x => x.search('login') != -1)[0];
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$('form[action*=login] > #email');
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('form[action*=login] > #password');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");
	
	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_final.png", fullPage: true});
	}
	return page
}

/**
 * Britannica login code.
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function britannica_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){
	
	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}
	
	process.stdout.write("Extracting login link...");
	const login_link = "https://cam.britannica.com"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$('#username');
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('#password');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + '_final.png', fullPage: true});
	}
	return page
}

/**
 * CNN login code
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function cnn_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){

	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}

	process.stdout.write("Extracting login link...");
	const login_link = "https://www.cnn.com/account/log-in"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$('#login-email-input');
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('#login-password-input');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + '_final.png', fullPage: true});
	}
	return page
}

/**
 * eBay login code
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function ebay_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){
	
	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}
	
	process.stdout.write("Extracting login link...");
	const login_link = "https://www.ebay.com/signin/"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$('#userid');
	
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_1.png", fullPage: true});
	}
	

	await page.click("#signin-continue-btn");

	process.stdout.write("Filling up password...");
	const passwordField = await page.waitForSelector("input[id=pass][aria-label='Password for " + email + "']");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_2.png", fullPage: true});
	}

	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_final.png", fullPage: true});
	}
	return page
}

/**
 * foxnews login code
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function foxnews_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){
	
	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}
	
	process.stdout.write("Extracting login link...");
	const login_link = "https://my.foxnews.com/"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$("input[type=email]");
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('input[type=password]');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + '_final.png', fullPage: true});
	}
	return page
}

/**
 * NFL login code
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function nfl_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){

	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}

	process.stdout.write("Extracting login link...");
	const login_link = "https://id.nfl.com/account/sign-in"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));


	process.stdout.write("Filling up email...");
	const emailField = await page.$("input[type=email]");
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('input[type=password]');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by clicking sign in button and waiting for navigation...");
	await page.click("div[aria-label='Sign In button']")
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_final.png", fullPage: true});
	}
	return page
}

/**
 * nytimes login code (TODO)
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function nytimes_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){
	
	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}
	
	process.stdout.write("Extracting login link...");
	const login_link = hrefs.filter(x => x.search('login') != -1)[0]
	console.log(login_link);
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_1.png", fullPage: true});
	}

	process.stdout.write("Filling up email...");
	const emailField = await page.$('#email');
	
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_2.png", fullPage: true});
	}

	await page.click("button[type=submit]");

	process.stdout.write("Filling up password...");
	const passwordField = await page.waitForSelector("#password");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_3.png", fullPage: true});
	}

	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_final.png", fullPage: true});
	}
	return page
}

/**
 * reddit login code
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function reddit_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){
	
	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}
	
	process.stdout.write("Extracting login link...");
	const login_link = "https://www.reddit.com/login/"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));


	process.stdout.write("Filling up email...");
	const emailField = await page.$("#loginUsername");
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('#loginPassword');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_final.png", fullPage: true});
	}
	return page
}

/**
 * Target login code (TODO)
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function target_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){

	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}

	process.stdout.write("Extracting login link...");
	const login_link = "https://www.target.com/account"
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$("#username");
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('#password');
	await passwordField.type(password, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	console.log(
		"Input password: " +
		colorizeString(await passwordField.evaluate(e => e.value), "yellow")
	);

	// process.stdout.write("Submitting login request by clicking sign in button and waiting for navigation...");
	// await page.click("#login")

	process.stdout.write("Submitting login request by pressing Enter and waiting for navigation...");
	await passwordField.press("Enter");
	// await page.waitForNavigation({waitUntil: 'networkidle2'});
	
	let mobileSkip = null;
	try{
		mobileSkip = await page.waitForSelector("a[href='/']", {timeout: 5000});
		if(mobileSkip != null){
			mobileSkip.click();
		}
	}
	catch(e){
		console.log(e);
	}

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_1.png", fullPage: true});
	}
	
	let circleSkip = null;
	try{
		circleSkip = await page.waitForSelector("#circle-skip", {timeout: 5000});
		if(circleSkip != null){
			circleSkip.click();
		}
	}
	catch(e){
		console.log(e);
	}
	
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log("Login complete!");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_final.png", fullPage: true});
	}
	return page
}

async function main(){
	let login = false;

	let arguments = process.argv;
	if(arguments.length < 3){
		console.log("Not enough arguments");
		process.exit();
	}
	else if(!(arguments[2] in config)){
		console.log(arguments[2], "is not in config list.");
		process.exit();
	}
	if(arguments.length >= 4){
		if(['T', 'F'].indexOf(arguments[3]) < 0){
			console.log("Wrong login option \"", arguments[3], "\". Please enter \"T\" or \"F\".");
			process.exit();
		}
		login = (arguments[3] == 'T') ? true : false;
	}
	
	process.stdout.write("Initializing puppeteer...");
	const [browser, page] = await puppeteerInit();
	process.stdout.write(colorizeString("done!\n", "green"));
	
	console.log();
	
	await crawl(page, arguments[2], login=login);
	
	console.log();

	process.stdout.write("Terminating puppeteer...");
	await browser.close();
	process.stdout.write(colorizeString("done!\n", "green"));
}

main();