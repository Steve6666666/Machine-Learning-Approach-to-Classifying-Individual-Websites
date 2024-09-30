const puppeteer = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

const DEBUG_DIR = "./debug/";
const HOME_TIMEOUT = 300000; //home address navigation timeout value in ms
const LINK_TIMEOUT = 60000; //link navigation timeout value in ms

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
const readline = require('readline');
const { once } = require('events');

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

/**
 * get user input
 * @param {String} question - question display in command prompt
 * @returns {String} - User input string
 */
async function userInput(question){
	const readline = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve, reject) => {
		readline.question(question, data => {
			readline.close();
			resolve(data);
		})
	});
}

async function puppeteerInit(){
	const args = puppeteer.defaultArgs().filter(arg => arg !== '--enable-asm-webassembly');
	args.push('--enable-webgl-draft-extensions', '--shared-array-buffer' , '--disable-quic','--disable-features=NetworkService,NetworkServiceInProcess');
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
	const fs = require('fs');
	const home = config[website].home;
	const email = config[website].email;
	const password = config[website].password;

	process.stdout.write("Navigating to " + colorizeString(home, 'yellow') + " ...");
	await page.goto(home, {waitUntil: 'networkidle2', timeout: HOME_TIMEOUT});
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
	
	//await normal(page, website, hrefs, fs);
	// await video_site2(page, website, hrefs, fs);
	const numbers = await readNumbersFromFile('tiktok.txt');
	// await youtube(page, website, hrefs, fs, numbers);
	await yelp(page, website, hrefs, fs, numbers);

	// for(let i = 0; i < hrefs.length; i++){
	// 	var begin=Date.now();
	// 	if(hrefs[i] == ''){
	// 		continue
	// 	}
	// 	if(hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1){
	// 		continue;
	// 	}
	// 	try{
	// 		await page.goto(hrefs[i], {'timeout': LINK_TIMEOUT});
	// 		//await page.goBack();
	// 		var cur=await page.evaluate(() => {
	// 			return Array.from(document.getElementsByTagName('a'), a => a.href);
	// 		});
	// 		cur= shuffleArray(cur)
	// 	} catch(e){
	// 		console.log(e.message);
	// 	}

	// 	if(hrefs.length < 20000){
	// 		hrefs.push.apply(hrefs, cur);
	// 	}/*else{
	// 		const fs = require('fs');
	// 		for(let i =0;i<hrefs.length;i++){
	// 			fs.writeFile('./target.txt',hrefs[i],function (err,data) {
	// 				if (err) {
	// 					return console.log(err);
	// 				}
	// 				console.log(data);
	// 			});
	// 		}
	// 	}*/
	// 	console.log(i + " " + hrefs[i]);
	// 	var end = Date.now();
	// 	const currentDate = new Date();
    //             		const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
    //             		var time="time:"+(end-begin)/1000 +"secs link:"+hrefs[i]+ " Date:"+ formattedDate  + "\n";
    //             		//var time="time:"+(end-begin)/1000 +"secs link:"+hrefs[i]+ "\n";
    //             		fs.appendFile(`${website}.txt`, time, (err) => {
    //                     		if (err) throw err;
    //                     		console.log('The file has been saved!');
    //            		 });
	// }
}
function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
}
// 读取文件并返回数字列表
async function readNumbersFromFile(filename) {
    const fileStream = fs.createReadStream(filename);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const numbers = [];
    rl.on('line', (line) => {
        const num = parseInt(line.trim());
        if (!isNaN(num)) {
            numbers.push(num);
        }
    });

    await once(rl, 'close');
    return numbers;
}

// 随机选择一个数字
function getRandomSample(arr) {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}



async function normal(page, website, hrefs, fs) {
	for(let i = 0; i < hrefs.length; i++){
		var begin=Date.now();
		if(hrefs[i] == ''){
			continue
		}
		if(hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1){
			continue;
		}
		try{
			await page.goto(hrefs[i], {'timeout': LINK_TIMEOUT});
			//await page.goBack();
			var cur=await page.evaluate(() => {
				return Array.from(document.getElementsByTagName('a'), a => a.href);
			});
			cur= shuffleArray(cur)
		} catch(e){
			console.log(e.message);
		}

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
		var end = Date.now();
		const currentDate = new Date();
                		const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
                		var time="time:"+(end-begin)/1000 +"secs link:"+hrefs[i]+ " Date:"+ formattedDate  + "\n";
                		//var time="time:"+(end-begin)/1000 +"secs link:"+hrefs[i]+ "\n";
                		fs.appendFile(`${website}_url.txt`, time, (err) => {
                        		if (err) throw err;
                        		console.log('The file has been saved!');
               		 });
	}
}
async function video_site(page, website, hrefs, fs,numbers){
	for (let i = 0; i < hrefs.length; i++) {
        var begin = Date.now();
        if (hrefs[i] == '' || hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1) {
            continue;
        }
        try {
            await page.goto(hrefs[i], { 'timeout': LINK_TIMEOUT });
			// const randomTime = getRandomSample(numbers);
			// console.log('time spend on this sites:',randomTime)
			await page.waitForTimeout(5000);
            // Check for video elements and play them if they exist
            const duration = await page.evaluate(async () => {
                // const videoElements = document.getElementsByTagName('video');
				const videoElement = document.querySelector('video');
				const durations = []; 
				let error = null;
				let src = null;
				if (videoElement) {
					try {
						// 尝试播放视频
						await videoElement.play();
			
						// 确保视频元数据已加载以获取时长
						await new Promise((resolve, reject) => {
							if (videoElement.readyState >= 1) { // 元数据已加载
								resolve();
							} else {
								videoElement.addEventListener('loadedmetadata', resolve);
								videoElement.addEventListener('error', reject);
							}
						});
						return 'play video';
					} catch (e) {
						console.error('Error playing video:', e.message);
						error = e.message
						return error;
					}
				} else {
					return 'no video'; // 没有找到视频元素
				}
                // if (videoElements.length > 0) {
                //     for (let video of videoElements) {
				// 		const sources = video.querySelectorAll('source');
				// 		src = sources
				// 		try{		
				// 			await video.play();
				// 			// console.log('play video normally');
				// 			video.addEventListener('loadedmetadata', () => {
				// 				durations.push(video.duration); // 将视频的时长添加到列表中
				// 			});
				// 		}catch(e){
				// 			console.log('Error playing video:', e.message); 
				// 			error = e.message;
				// 		}
                //     }
                    
                // }
				// return src
                // return videoElements.length;
            });
			console.log(duration)
            // if (hasVideo) {
			// 	const videoDuration = await page.evaluate(() => {
            //         const videoElements = document.getElementsByTagName('video');
            //         if (videoElements.length > 0) {
			// 			print('-------',videoElements.length, videoElements[0].duration)
            //             return videoElements[0].duration;
            //         }
            //         return 0;
            //     });


            //     // 从数字列表中随机选择一个时间
            //     const randomTime = getRandomSample(numbers);
			// 	const waitTime = Math.min(videoDuration * 1000, 3*randomTime);
            //     // Wait for a certain time to simulate watching the video
			// 	console.log('time spend on this video:',waitTime)
            //     await page.waitForTimeout(randomTime*1000); // 使用随机选取的时间
            // }

            var cur = await page.evaluate(() => {
                return Array.from(document.getElementsByTagName('a'), a => a.href);
            });
            cur = shuffleArray(cur);
        } catch (e) {
            console.log(e.message);
        }

        if (hrefs.length < 20000) {
            hrefs.push.apply(hrefs, cur);
        }
        console.log(i + " " + hrefs[i]);
        var end = Date.now();
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
        var time = "time:" + (end - begin) / 1000 + "secs link:" + hrefs[i] + " Date:" + formattedDate + "\n";
        fs.appendFile(`${website}_url.txt`, time, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}
async function video_site2(page, website, hrefs, fs,numbers){
	for (let i = 0; i < hrefs.length; i++) {
		var begin = Date.now();
		if (hrefs[i] == '') {
			continue;
		}
		if (hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1) {
			continue;
		}
		try {
			await page.goto(hrefs[i], { 'timeout': LINK_TIMEOUT });
			await page.waitForTimeout(5000);

			const elements = await page.evaluate(() => {
				// 使用属性选择器查找具有 playsinline 属性的元素
				return Array.from(document.querySelectorAll('video[playsinline]')).map(el => {
					const { x, y, width, height } = el.getBoundingClientRect();
					return { x: x + width / 2, y: y + height / 2 }; // 返回每个元素的中心点坐标
				});
			});
			console.log(elements.length)
			for (const element of elements) {
				console.log(element.x, element.y)
				// await page.mouse.move(element.x, element.y);
				await page.mouse.click(element.x, element.y);
				// const [newPage] = await Promise.all([
				// 	new Promise(resolve => browser.once('targetcreated', async target => {
				// 		const newPage = await target.page();
				// 		resolve(newPage);
				// 	})),
				// 	page.mouse.click(element.x, element.y) // 这里是你要点击的位置，假设会打开新页面
				// ]);
				await page.waitForTimeout(5000);
				const temp = await page.evaluate(() => {
					return document.querySelector('.css-weccem-DivAutoScrollButtonContainer').querySelector('path').getAttribute('d')
				});
				console.log(temp)
				await page.waitForTimeout(20000); // 停留 1 秒，让元素有时间播放
				
			}	
			var cur = await page.evaluate(() => {
				return Array.from(document.getElementsByTagName('a'), a => a.href);
			});
			cur = shuffleArray(cur);
		} catch (e) {
			console.log(e.message);
		}
	
		if (hrefs.length < 20000) {
			hrefs.push.apply(hrefs, cur);
		}
		console.log(i + " " + hrefs[i]);
        var end = Date.now();
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
        var time = "time:" + (end - begin) / 1000 + "secs link:" + hrefs[i] + " Date:" + formattedDate + "\n";
        fs.appendFile(`${website}_url.txt`, time, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
	}	
}
async function youtube(page, website, hrefs, fs,numbers){
	for (let i = 0; i < hrefs.length; i++) {
		var begin = Date.now();
		if (hrefs[i] == '') {
			continue;
		}
		if (hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1) {
			continue;
		}
		try {
			await page.goto(hrefs[i], { 'timeout': LINK_TIMEOUT });
			await page.waitForTimeout(5000)
			await page.waitForSelector('input[name="search_query"]');
			const searchTerms = [
				'Puppeteer 教程', 'JavaScript 教程', 'Node.js 入门', 'Python Web Scraping', '自动化测试工具', 'Selenium 教程', 'React.js 初学者指南', 
				'Vue.js 实战项目', '机器学习入门', '深度学习基础', 'TensorFlow 教程', 'Kubernetes 实战', 'Docker 容器化应用', 'Git 教程', 
				'Linux 命令行基础', '网络安全基础', '区块链技术', '智能合约开发', '前端开发框架', '后端开发技术', 'GraphQL 教程', 'REST API 设计', 
				'WebSockets 实现', 'Django 教程', 'Flask 入门', 'Spring Boot 快速入门', 'Java 多线程编程', 'C++ 基础教程', 'Rust 编程入门', 
				'Go 语言教程', 'PHP Web 开发', '数据库优化', 'MySQL 高级查询', 'PostgreSQL 数据库', 'MongoDB 入门', 'Redis 缓存', 
				'Elasticsearch 搜索引擎', 'RabbitMQ 消息队列', 'Kafka 消息系统', '微服务架构', '分布式系统', '大数据处理', 'Hadoop 教程', 
				'Spark 数据处理', '云计算基础', 'AWS 实战', 'Azure 云服务', 'Google Cloud 平台', 'DevOps 实践', 'CI/CD 持续集成', 
				'Jenkins 自动化部署', 'Ansible 配置管理', 'Terraform 基础', '网络编程入门', 'HTML5 教程', 'CSS3 动画', 'Flexbox 布局', 
				'CSS Grid 网格布局', 'Bootstrap 响应式设计', 'Sass 编译器', 'Tailwind CSS 框架', 'TypeScript 教程', 'Webpack 打包工具', 
				'Babel 编译器', 'Node.js 事件驱动编程', 'Express.js 开发入门', 'RESTful API 设计', 'OAuth2 认证', 'JWT 认证与授权', 'WebAssembly 入门', 
				'浏览器渲染原理', 'HTTP 协议基础', 'QUIC 协议', 'TCP/IP 网络协议', '面向对象编程', '函数式编程', '设计模式实践', '单元测试和集成测试', 
				'测试驱动开发（TDD）', '版本控制系统', 'GitHub 工作流程', 'Bitbucket 使用', 'GitLab 持续集成', 'Agile 敏捷开发', 'Scrum 框架', 
				'产品经理技能', '用户体验设计', 'UI/UX 设计工具', 'Figma 设计入门', 'Adobe XD 教程', '数据可视化工具', 'D3.js 可视化库', 
				'Tableau 数据分析', 'Power BI 教程', '数据分析与建模', '统计学基础', 'R 语言数据分析', '机器学习算法', '监督学习和非监督学习', 
				'强化学习入门', '自然语言处理（NLP）', '生成对抗网络（GAN）', '图像识别算法', '计算机视觉基础', 'OpenCV 教程', '迁移学习技术', 
				'深度神经网络', '卷积神经网络（CNN）', '循环神经网络（RNN）', '集成学习方法', 'XGBoost 算法', '随机森林算法', '贝叶斯网络', 
				'隐马尔可夫模型', '推荐系统算法', '大数据分析', '数据挖掘技术', '数据科学职业路径', '区块链开发', '智能合约编写', '比特币技术原理', 
				'以太坊开发入门', 'NFT 开发'
			];			
			const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

			await page.type('input[name="search_query"]', randomSearchTerm, { delay: 100 });
			await page.waitForTimeout(1000)
			await page.evaluate(() => {
				// 提交表单，相当于 document.querySelector('form').submit();
				document.querySelector('form').submit();
			});
			await page.waitForNavigation({ waitUntil: 'networkidle0' });
			console.log('Search results page URL:', page.url());
			var allLinks = await page.evaluate(() => {
				return Array.from(document.getElementsByTagName('a'), a => a.href);
			});
			for (let j = 0; j < allLinks.length; j++) {
				if (allLinks[j] == ' ' || allLinks[j] == 'https://www.youtube.com'||allLinks[j] == ' ' || allLinks[j].indexOf("//www.youtube.com/watch") == -1 || allLinks[j].indexOf("pdf") > 1) {
					continue;
				}
				await page.goto(allLinks[j], { 'timeout': LINK_TIMEOUT });
				console.log('video url:',page.url())
				await page.waitForSelector('.html5-video-player');
				// 点击播放按钮以播放视频
				// await page.waitForTimeout(5000)
				const isVideoPlaying = await page.evaluate(() => {
					const videoPlayer = document.querySelector('.html5-video-player');
					const playButton = videoPlayer.querySelector('.ytp-play-button');
					const videoElement = document.querySelector('video');
					if (videoElement && videoElement.paused) {
						playButton.click();  // 如果视频没有播放，点击播放按钮
						return true;
					}
					return false;
				});
				if (isVideoPlaying) {
					console.log('Video was not playing, now playing...');
				} else {
					console.log('Video is already playing or failed to play.');
				}
				await page.waitForTimeout(50000)
			}
			// await page.waitForTimeout(50000)
			// cur = shuffleArray(cur);
		} catch (e) {
			console.log(e.message);
		}
	
		// if (hrefs.length < 20000) {
		// 	hrefs.push.apply(hrefs, cur);
		// }
		console.log(i + " " + hrefs[i]);
        var end = Date.now();
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
        var time = "time:" + (end - begin) / 1000 + "secs link:" + hrefs[i] + " Date:" + formattedDate + "\n";
        fs.appendFile(`${website}_url.txt`, time, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
	}	
}
async function yelp(page, website, hrefs, fs,numbers) {
    const searchTerms = ['pizza', 'Coffee Shops', 'Bars'];  // 搜索关键词列表
    const locations = ['San Francisco, CA', 'New York, NY'];      // 搜索地点列表
    const targetContents = ['pizza', 'Coffee', 'Bars'];                                // 要查找的目标内容

    for (let i = 0; i < searchTerms.length; i++) {
        for (let j = 0; j < locations.length; j++) {
            var begin = Date.now();

            try {
                // 打开 Yelp 网站
                await page.goto('https://www.yelp.com', { waitUntil: 'networkidle2' });
                console.log(`Navigating to ${website} ...`);

                // 输入搜索词
                await page.waitForSelector('input[name="find_desc"]');
                await page.type('input[name="find_desc"]', searchTerms[i], { delay: 100 });
                console.log(`Entered search term: ${searchTerms[i]}`);

                // 输入地点
                await page.waitForSelector('input[name="find_loc"]');
                await page.evaluate(() => document.querySelector('input[name="find_loc"]').value = ''); // 清空现有位置
                await page.type('input[name="find_loc"]', locations[j], { delay: 100 });
                console.log(`Entered location: ${locations[j]}`);

                // 点击搜索按钮
                await page.waitForSelector('button[type="submit"]');
                await page.click('button[type="submit"]');
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                console.log(`Searching for ${searchTerms[i]} in ${locations[j]}...`);
				console.log('cureent url:',page.url())
                // 滚动页面寻找特定内容
                let foundContent = false;
                let scrollCount = 0;
				targetContent = targetContents[i]
				page.on('console', msg => {
					console.log('页面日志:', msg.text());
				});
                // 循环滚动页面，直到找到目标内容或到底
                while (!foundContent && scrollCount < 12) {  // 设置滚动次数限制，防止无限滚动
                    foundContent = await page.evaluate((targetContent) => {
                        const listings = Array.from(document.querySelectorAll('a.y-css-12ly5yx'));
                        for (const listing of listings) {
							console.log(listing.innerText)
                            if (listing.innerText.includes(targetContent)) {
                                listing.scrollIntoView();
                                listing.click();
                                return true; // 找到并点击目标内容
                            }
                        }
                        return false; // 目标内容未找到
                    }, targetContent);
					// console.log(targetContent)
					// console.log(foundContent)
					console.log('cureent url:',page.url())
                    if (!foundContent) {
                        console.log(`Scrolling down...`);
                        await page.evaluate(() => window.scrollBy(0, window.innerHeight)); // 滚动一屏高度
                        await page.waitForTimeout(2000); // 等待页面加载更多内容
                        scrollCount++;
                    }else{
						console.log(`find target`);
					}
                }
                // 如果找到目标内容，则等待页面加载
                if (foundContent) {
                    console.log(`Found and clicked the content: ${targetContent}`);
                    await page.waitForNavigation({ waitUntil: 'networkidle0' });
                } else {
                    console.log(`Content "${targetContent}" not found in this search.`);
                }
            } catch (e) {
                console.log(`Error during search for ${searchTerms[i]} in ${locations[j]}:`, e.message);
            }
            // 保存搜索时间和结果
            var end = Date.now();
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
            var time = `time: ${(end - begin) / 1000} secs | search: ${searchTerms[i]} | location: ${locations[j]} | date: ${formattedDate}\n`;
            fs.appendFile(`${website}_search_results.txt`, time, (err) => {
                if (err) throw err;
                console.log('The search result has been saved!');
            });
        }
    }
}


async function moveMouseAndClick(page) {
    const images = await page.$$('img'); // 获取所有图片元素
    if (images.length > 0) {
        // 随机选择一张图片
        const randomImage = images[Math.floor(Math.random() * images.length)];
        const boundingBox = await randomImage.boundingBox();
        
        if (boundingBox) {
            const x = boundingBox.x + boundingBox.width / 2;
            const y = boundingBox.y + boundingBox.height / 2;

            // 移动鼠标并点击图片
            await page.mouse.move(x, y);
            await page.waitForTimeout(500); // 模拟人类的延迟
            await page.mouse.click(x, y);
        }
    }
}
// 重写 processLinks 函数
async function e_commerce_site(page, website, hrefs, fs, numbers) {
    for (let i = 0; i < hrefs.length; i++) {
        if (hrefs[i] == '' || hrefs[i] == ' ' || hrefs[i].indexOf("//www." + website + ".com") == -1 || hrefs[i].indexOf("pdf") > 1) {
            continue;
        }
        try {
            await page.goto(hrefs[i], { 'timeout': LINK_TIMEOUT });
            
            // 模拟鼠标移动和点击图片
            await moveMouseAndClick(page);

            // 随机等待时间
            const randomTime = getRandomSample(numbers);
            if (randomTime !== undefined && !isNaN(randomTime)) {
                await page.waitForTimeout(randomTime*1000); // 使用随机选取的时间
            }

            // 提取页面中的所有链接
            var cur = await page.evaluate(() => {
                return Array.from(document.getElementsByTagName('a'), a => a.href);
            });
            cur = shuffleArray(cur);
        } catch (e) {
            console.log(e.message);
        }

        if (hrefs.length < 20000) {
            hrefs.push.apply(hrefs, cur);
        }
        console.log(i + " " + hrefs[i]);
        var end = Date.now();
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
        var time = "time:" + (end - begin) / 1000 + "secs link:" + hrefs[i] + " Date:" + formattedDate + "\n";
        fs.appendFile(`${website}.txt`, time, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}

async function apple(page, website, hrefs, fs, numbers) {
    const items = ['MacBook', 'iPad', 'iPhone', 'VisionPro', 'AirPods']; // 要搜索的产品
    const searchInputSelector = 'input[name="search"]'; // 搜索框的选择器
    const productModelSelector = '.as-producttile-tilehero a'; // 产品模型的选择器
    const specOptionSelector = '.option-button'; // 规格选择器
    const addToCartButtonSelector = '.button-continue'; // 加入购物车按钮选择器
    const targetLocation = 'New Jersey'; // Apple Store 查询

    for (let i = 0; i < items.length; i++) {
        try {
            // 打开 Apple 网站
            await page.goto(website, { waitUntil: 'networkidle2' });

            // 搜索产品
            await page.waitForSelector(searchInputSelector);
            await page.type(searchInputSelector, items[i], { delay: 100 });
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });

            // 查找并选择该产品的模型
            await page.waitForSelector(productModelSelector);
            const models = await page.$$(productModelSelector);

            if (models.length > 0) {
                await models[0].click(); // 选择第一个模型
                await page.waitForNavigation({ waitUntil: 'networkidle0' });

                // 选择产品规格
                await page.waitForSelector(specOptionSelector);
                const specOptions = await page.$$(specOptionSelector);
                if (specOptions.length > 0) {
                    await specOptions[0].click(); // 选择第一个规格
                }

                // 添加到购物车
                const addToCartButton = await page.$(addToCartButtonSelector);
                if (addToCartButton) {
                    await addToCartButton.click();
                    console.log(`${items[i]} added to cart.`);
                } else {
                    console.log(`Add to cart button not found for ${items[i]}`);
                }
            }
        } catch (err) {
            console.log(`Error processing ${items[i]}:`, err);
        }
    }

    // 第二步：搜索 New Jersey 并查看任意 Apple Store
    try {
        await page.goto(website, { waitUntil: 'networkidle2' });
        await page.waitForSelector(searchInputSelector);
        await page.type(searchInputSelector, targetLocation, { delay: 100 });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // 查找 Apple Store 链接并点击
        const storeLinkSelector = 'a[href*="store"]';
        const storeLinks = await page.$$(storeLinkSelector);

        if (storeLinks.length > 0) {
            await storeLinks[0].click();
            console.log('Opened Apple Store in New Jersey.');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }
    } catch (err) {
        console.log('Error searching for Apple store in New Jersey:', err);
    }

    // 第三步和第四步：搜索任意产品并浏览不同服务和功能
    try {
        await page.goto(website, { waitUntil: 'networkidle2' });
        await page.waitForSelector(searchInputSelector);
        await page.type(searchInputSelector, 'iMac', { delay: 100 });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // 浏览服务和功能
        const servicesSelector = 'a[href*="services"]'; // 假设存在服务链接
        const serviceLinks = await page.$$(servicesSelector);

        if (serviceLinks.length > 0) {
            await serviceLinks[0].click();
            console.log('Exploring different services and aspects.');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }
    } catch (err) {
        console.log('Error during product search or exploring services:', err);
    }

    // 第五步：记录时间和结果
    const end = Date.now();
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', '_');
    const timeLog = `time: ${(end - start) / 1000} secs | products searched: ${items.join(', ')} | date: ${formattedDate}\n`;
    
    fs.appendFile(`${website}_search_results.txt`, timeLog, (err) => {
        if (err) throw err;
        console.log('Search results have been saved!');
    });
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

/**
 * Yahoo login code
 * Please note that this login requires verification code
 * @param {puppeteer.Page} page - puppeteer Page instance
 * @param {String} website - website name
 * @param {String} hrefs - links from home page
 * @param {String} email - account email
 * @param {String} password - account password
 * @param {Number} type_delay_per_char - type speed in ms
 * @param {Boolean} debug - debug mode
 * @return {puppeteer.Page} - redirected page after login
 */
async function yahoo_login(page, website, hrefs, email, password, type_delay_per_char=200, debug=false){
	// note: gmail sign in requires verification code
	let websiteDebugDir = DEBUG_DIR + website + "/";
	if(debug){
		if(!fs.existsSync(websiteDebugDir)){
			fs.mkdirSync(websiteDebugDir, {recursive: true});
		}
	}

	process.stdout.write("Extracting login link...");
	const login_link = hrefs.filter(x => x.search('signin') != -1)[0]
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Navigating to login link...");
	await page.goto(login_link, {waitUntil: 'networkidle2'});
	process.stdout.write(colorizeString("done!\n", "green"));

	process.stdout.write("Filling up email...");
	const emailField = await page.$('#login-username');
	
	await emailField.type(email, {delay: type_delay_per_char});
	process.stdout.write(colorizeString("done!\n", "green"));

	console.log(
		"Input email: " +
		colorizeString(await emailField.evaluate(e => e.value), "yellow")
	);
	
	// disable stay sign-in
	await page.click("label[for=persistent]");

	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_1.png", fullPage: true});
	}

	await page.click("#login-signin");

	const verificationField = await page.waitForSelector("#verification-code-field");
	
	if(debug){
		await page.screenshot({path: websiteDebugDir + website + "_2.png", fullPage: true});
	}

	let verificationCode = await userInput("Please enter verification code: ");
	await verificationField.type(verificationCode, {delay: type_delay_per_char});
	await page.click("#verify-code-button");
	await page.waitForNavigation({waitUntil: 'networkidle2'});

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