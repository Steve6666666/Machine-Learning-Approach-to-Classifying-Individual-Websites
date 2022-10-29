const puppeteer = require('puppeteer');

(async () => {
	const args = puppeteer.defaultArgs().filter(arg => arg !== '--enable-asm-webassembly');
	args.push('--enable-webgl-draft-extensions', '--shared-array-buffer');
	const browser = await puppeteer.launch({ ignoreDefaultArgs: true, args });
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
	await page.goto('https://www.yelp.com', {waitUntil: 'networkidle2'});
	const hrefs = await page.evaluate(() => {
		return Array.from(document.getElementsByTagName('a'), a => a.href);
	});
	/*for(let i =0;i<hrefs.length;i++){
			  console.log(i);
			  console.log(hrefs[i]);
		  }*/
	for(let i =0;i<hrefs.length;i++){
		// console.log(hrefs[i]=='');
		if(hrefs[i]==''){
			continue
		}
		if(hrefs[i]==' ' || hrefs[i].indexOf("//www.yelp.com")==-1||hrefs[i].indexOf("pdf")>1){
			continue;
		}
		await page.goto(hrefs[i],{
			'timeout': 60000
		});
		//await page.goBack();
		var cur=await page.evaluate(() => {
			return Array.from(document.getElementsByTagName('a'), a => a.href);
		});

		if(hrefs.length<20000){
			hrefs.push.apply(hrefs,cur);
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
		console.log(i);
		console.log(hrefs[i]);
	}
	//console.log(hrefs);
	await browser.close();
})();
