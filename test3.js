const puppeteer = require('puppeteer');

const ANSI_COLOR_RESET = "\x1b[0m";
const ANSI_COLOR_RED = "\x1b[31m";
const ANSI_COLOR_GREEN = "\x1b[32m";
const ANSI_COLOR_YELLOW = "\x1b[33m";

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

async function yelp_login(page, link, email, password){
	process.stdout.write("Navigating to login link...");
	await page.goto(link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$('form[action*=login] > #email');
	await emailField.type(email, {delay: 100});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up password...");
	const passwordField = await page.$('form[action*=login] > #password');
	await passwordField.type(password, {delay: 100});
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

	await page.screenshot({path: './screenshot.png', fullPage: true});
	return page
}

async function puppeteerInit(){
	const args = puppeteer.defaultArgs().filter(arg => arg !== '--enable-asm-webassembly');
	args.push('--enable-webgl-draft-extensions', '--shared-array-buffer');
	const browser = await puppeteer.launch({ ignoreDefaultArgs: true, args });
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
	return [browser, page];
}

async function yelp(page, login=false){
	// todo: these parameters should be read from a configuration file later
	const yelp_home = 'https://www.yelp.com';
	const email = "";
	const password = "";

	process.stdout.write("Navigating to " + colorizeString(yelp_home, 'yellow') + " ...");
	await page.goto(yelp_home, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));
	
	process.stdout.write("Extracting all hyperlinks...");
	const hrefs = await page.evaluate(() => {
		return Array.from(document.getElementsByTagName('a'), a => a.href);
	});
	process.stdout.write(colorizeString("done!\n", "green"));
	
	if(login){
		process.stdout.write("Extracting login link...");
		const login_href = hrefs.filter(x => x.search('login') != -1)[0];
		process.stdout.write(colorizeString("done!\n", "green"));

		page = await yelp_login(page, login_href, email, password);
	}
	
	/*for(let i =0;i<hrefs.length;i++){
			  console.log(i);
			  console.log(hrefs[i]);
		  }*/
	
	for(let i = 0; i < hrefs.length; i++){
		// console.log(hrefs[i]=='');
		if(hrefs[i] == ''){
			continue
		}
		if(hrefs[i] == ' ' || hrefs[i].indexOf("//www.yelp.com") == -1 || hrefs[i].indexOf("pdf") > 1){
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

async function main(){
	process.stdout.write("Initializing puppeteer...");
	const [browser, page] = await puppeteerInit();
	process.stdout.write(colorizeString("done!\n", "green"));
	
	console.log();
	
	await yelp(page, login=false);
	
	console.log();

	process.stdout.write("Terminating puppeteer...");
	await browser.close();
	process.stdout.write(colorizeString("done!\n", "green"));
}

main();