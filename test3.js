const puppeteer = require('puppeteer');

async function yelp_login(page, link, email, password){
	await page.goto(link, {waitUntil: 'networkidle2'});

	const emailField = await page.$('form[action*=login] > #email');
	await emailField.type(email, {delay: 100});

	const passwordField = await page.$('form[action*=login] > #password');
	await passwordField.type(password, {delay: 100});

	await passwordField.press("Enter");
	await page.waitForNavigation({waitUntil: 'networkidle2'});

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

	await page.goto(yelp_home, {waitUntil: 'networkidle2'});
	
	const hrefs = await page.evaluate(() => {
		return Array.from(document.getElementsByTagName('a'), a => a.href);
	});
	
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
	const [browser, page] = await puppeteerInit();
	
	await yelp(page, login=false);
	
	await browser.close();
}

main();