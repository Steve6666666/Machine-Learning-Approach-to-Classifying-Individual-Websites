// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');
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
	args.push('--enable-webgl-draft-extensions', '--shared-array-buffer' , '--disable-quic','--disable-features=NetworkService,NetworkServiceInProcess','--disable-infobars');
	const browser = await puppeteer.launch({ 
		headless: false, 
		executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
		});
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
async function crawl(page, website, browser,login=false){
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
	// await yelp(page, website, hrefs, fs, numbers);
	// await tiktok2(page, website, hrefs, fs, numbers);
	// await amazon(page, website, hrefs, fs, numbers);
	// await apple(page, website);
	await bilibili(page, website,browser);

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

async function tiktok(page, website, hrefs, fs,numbers){
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
               
            });
			console.log(duration)
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
async function tiktok2(page, website, fs, numbers) {
    try {
        // 访问 TikTok 网站主页
        await page.goto('https://www.tiktok.com', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(5000);  // 等待页面加载完成

        console.log('Visited TikTok homepage.');

        // 确保自动播放模式开启
        const isAutoPlayEnabled = await page.evaluate(() => {
            const autoplayButton = document.querySelector('.css-weccem-DivAutoScrollButtonContainer');
            if (autoplayButton) {
                autoplayButton.click();  // 点击开启连播模式
                return true;
            }
            return false;
        });
        if (isAutoPlayEnabled) {
            console.log('Autoplay mode enabled.');
        } else {
            console.log('Autoplay mode not found or already enabled.');
        }

        // 无限循环模拟观看 TikTok 视频
        while (true) {
            // 查找带有 playsinline 属性的视频，并点击播放
            const videoElement = await page.evaluate(() => {
                const video = document.querySelector('video[playsinline]');
                if (video) {
                    const { x, y, width, height } = video.getBoundingClientRect();
                    return { x: x + width / 2, y: y + height / 2 };  // 返回视频中心点的坐标
                }
                return null;
            });

            if (videoElement) {
                console.log(`Clicking video at (${videoElement.x}, ${videoElement.y})`);
                // await page.mouse.click(videoElement.x, videoElement.y);  // 点击视频中心点
                await page.waitForTimeout(2000);  // 等待视频开始播放

                // 生成随机观看时间
                const randomWatchTime = Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000;  // 随机 30-60 秒
                console.log(`Watching video for ${randomWatchTime / 1000} seconds...`);

                // 等待随机的观看时间
                await page.waitForTimeout(randomWatchTime);

                // 模拟按键“下箭头”，切换到下一个视频
                console.log('Pressing down arrow key to go to next video...');
                await page.keyboard.press('ArrowDown');  // 按下键切换到下一个视频

                // 等待几秒，以确保页面完成加载
                await page.waitForTimeout(5000);  
            } else {
                console.log('No video found on the page. Scrolling to try again...');
                // 如果找不到视频，尝试滚动页面以找到下一个视频
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));  // 滚动一屏
                await page.waitForTimeout(3000);  // 等待页面加载
            }
        }
    } catch (e) {
        console.log(`Error while browsing TikTok: ${e.message}`);
    }

    console.log('Finished browsing TikTok.');
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

				await page.waitForTimeout(Math.random() * 2000 + 1000);
                // 输入搜索词
                await page.waitForSelector('input[name="find_desc"]');
                await page.type('input[name="find_desc"]', searchTerms[i], { delay: Math.random() * 200 + 100 });
                console.log(`Entered search term: ${searchTerms[i]}`);

				await page.waitForTimeout(Math.random() * 2000 + 1000);

                // 输入地点
                await page.waitForSelector('input[name="find_loc"]');
                await page.evaluate(() => document.querySelector('input[name="find_loc"]').value = ''); // 清空现有位置
                await page.type('input[name="find_loc"]', locations[j], { delay: Math.random() * 200 + 100 });
                console.log(`Entered location: ${locations[j]}`);

				await page.waitForTimeout(Math.random() * 2000 + 1000);

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
				await page.waitForTimeout(5000); 
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


// 生成随机延迟时间函数，范围在 min 到 max 毫秒之间
function getRandomDelay(min = 1000, max = 3000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机选择数组中的一个元素
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
async function apple(page, website) {
    const items = ['MacBook', 'iPad', 'iPhone', 'VisionPro', 'AirPods']; // 要搜索的设备列表
    const searchButtonSelector = '#globalnav-menubutton-link-search';  // 搜索按钮的选择器
    const searchInputSelector = '.globalnav-searchfield-input';  // 搜索框选择器
    const addToCartSelector = '.add-to-cart';  // 假设这是“加入购物车”按钮的选择器
    const specificationsSelector = '.product-specs';  // 假设是规格选择器

    try {
        const startTime = Date.now();  // 开始时间
        const browseDuration = 20 * 60 * 1000;  // 设定的浏览时长（20分钟）
        
        while (Date.now() - startTime < browseDuration) {
            const item = getRandomItem(items);  // 随机选择设备进行浏览

            // 打开 Apple 网站
            await page.goto('https://www.apple.com/', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(getRandomDelay());  // 随机等待

            // 点击搜索按钮，显示搜索输入框
            console.log(`Searching for: ${item}`);
            await page.waitForSelector(searchButtonSelector, { visible: true });
            await page.click(searchButtonSelector);  // 点击搜索按钮
            await page.waitForTimeout(getRandomDelay());  // 等待搜索输入框的出现

            // 输入框出现后，输入设备名称
            await page.waitForSelector(searchInputSelector, { visible: true });
            await page.type(searchInputSelector, item, { delay: getRandomDelay(100, 200) });  // 随机延迟输入
            console.log(`Typed: ${item}`);

            // 提交搜索并等待页面加载
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            await page.waitForTimeout(getRandomDelay());  // 随机等待

            // 随机滚动页面并选择设备
            console.log("Randomly scrolling the page to select a product...");
            await page.evaluate(() => {
                window.scrollBy(0, Math.floor(Math.random() * 400));  // 随机滚动 400 像素
            });

            await page.waitForTimeout(getRandomDelay());
			await page.waitForTimeout(5000000); 

            // 获取所有可点击的产品链接
            const productLinks = await page.evaluate(() => {
                const products = Array.from(document.querySelectorAll('.rf-serp-productoption-link'));
                return products.map(product => ({
                    href: product.href,
                    text: product.innerText,
                    x: product.getBoundingClientRect().x,
                    y: product.getBoundingClientRect().y
                }));
            });

            if (productLinks.length > 0) {
                // 随机选择一个产品并点击
                const selectedProduct = getRandomItem(productLinks);
                console.log(`Selected product: ${selectedProduct.text}`);
                await page.mouse.move(selectedProduct.x, selectedProduct.y);  // 移动鼠标到产品位置
                await page.mouse.click(selectedProduct.x, selectedProduct.y);  // 点击产品
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
            } else {
                console.log("No products found on the page.");
                continue;  // 如果没有找到产品，则重新执行循环
            }

            await page.waitForTimeout(getRandomDelay());  // 随机等待

            // 选择规格（如大小、存储、颜色等）
            console.log(`Selecting specifications for: ${item}`);
            const specOptions = await page.$$(specificationsSelector);
            if (specOptions.length > 0) {
                await specOptions[0].click();  // 假设选择第一个规格
                await page.waitForTimeout(getRandomDelay());
            }

            // 加入购物车
            console.log(`Adding ${item} to cart...`);
            await page.waitForSelector(addToCartSelector, { visible: true });
            await page.click(addToCartSelector);
            await page.waitForTimeout(getRandomDelay());  // 随机等待
            // 检查是否超过 20 分钟，如果未到达则继续循环浏览
            const elapsedTime = (Date.now() - startTime) / 1000 / 60;  // 计算已用时间
            console.log(`Elapsed time: ${elapsedTime.toFixed(2)} minutes`);
        }

        console.log('Finished browsing devices for 20 minutes.');
    } catch (err) {
        console.log(`Error while browsing Apple website: ${err.message}`);
    }
}


async function scrollPage(page) {
    await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);  // 向下滚动一屏
    });
    await page.waitForTimeout(getRandomDelay());
}

async function bilibili(page, website, browser) {
	website = 'https://www.bilibili.com/'
    while (true) {
        // 监听新页面的弹出
        browser.on('targetcreated', async (target) => {
            const newPage = await target.page();
            if (newPage) {
                console.log('New page opened.');
                await newPage.bringToFront();  // 将新页面置于前端

                // 这里模拟在新页面上执行的操作，假设观看30秒
                await newPage.waitForTimeout(30000);  // 模拟观看视频30秒
                console.log('Closing the new page after watching.');
                await newPage.close();  // 观看完后关闭新页面
            }
        });

       try{
		 // 任务 1：观看视频
		 console.log("Watching a popular video...");
		 await page.goto(`${website}v/popular`, { waitUntil: 'networkidle2' });
		 await page.waitForTimeout(getRandomDelay());  // 随机延迟
 
		 // 选择第一个视频
		 await scrollPage(page);
		 const videoSelector = '.video-card';  // 假设选择第一个视频的选择器
		 await page.waitForSelector(videoSelector);
		 const videos = await page.$$(videoSelector);
		 console.log('videos:',videos)
		 const randomVideo = getRandomItem(videos); // 随机选择一个视
		 await randomVideo.click();
		//  await page.click(videoSelector);
		 await page.waitForTimeout(getRandomDelay());  // 随机延迟观看
 
		 // 模拟观看主页面上的视频30秒
		 await page.waitForTimeout(60000);  // 观看 30 秒
		 console.log("Finished watching a video.");
		 await page.waitForTimeout(getRandomDelay() + 2000);  // 增加随机延迟
	   }catch (error){
		console.log("Error occurred while watching a video:", error.message);
        continue;  // 重新执行任务
	   }

       try{
		 // 任务 2：查看音乐频道
		 console.log("Browsing music channel...");
		 await page.goto(`${website}v/music`, { waitUntil: 'networkidle2' });
		 await page.waitForTimeout(getRandomDelay());  // 随机延迟
 
		 // 随机选择一首歌并进入
		 await scrollPage(page);
		 const musicVideoSelector = '.bili-video-card';  // 假设是音乐视频的选择器
		 await page.waitForSelector(musicVideoSelector);
		 const musicVideos = await page.$$(musicVideoSelector);
		 console.log('musicVideos:',musicVideos)
		 const randomMusicVideo = getRandomItem(musicVideos); // 随机选择一个音乐视频
		 await randomMusicVideo.click();
		//  await page.click(musicVideoSelector);
		 await page.waitForTimeout(getRandomDelay());  // 随机延迟观看
 
		 // 模拟观看主页面上的音乐视频30秒 
		 await page.waitForTimeout(45000);  // 观看 30 秒
		 console.log("Finished browsing music.");
		 await page.waitForTimeout(getRandomDelay() + 2000);  // 增加随机延迟
 
		 // 任务 3：观看直播
		 console.log("Watching a live stream...");
		 await page.goto(`https://live.bilibili.com/`, { waitUntil: 'networkidle2' });
		 await page.waitForTimeout(getRandomDelay());  // 随机延迟
	   }catch (error){
		console.log("Error occurred while browsing music channel:", error.message);
        continue;  // 重新执行任务
	   }

        // 选择一个直播观看
        // const liveStreamSelector = '.item-border p-absolute w-100 h-100 border-box ts-dot-4';  // 直播视频选择器
        // await page.waitForSelector(liveStreamSelector);
        // await page.click(liveStreamSelector);
        // await page.waitForTimeout(getRandomDelay());  // 随机延迟观看

       try{
		 // 模拟观看主页面上的直播30秒
		 await page.waitForTimeout(300000);  // 观看 30 秒
		 console.log("Finished watching a live stream.");
		 await page.waitForTimeout(getRandomDelay() + 2000);  // 增加随机延迟
	   }catch (error){
		console.log("Error occurred while watching a live stream:", error.message);
		continue;  // 重新执行任务
	   }
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
	
	await crawl(page, arguments[2], browser,login=login);
	
	console.log();

	process.stdout.write("Terminating puppeteer...");
	await browser.close();
	process.stdout.write(colorizeString("done!\n", "green"));
}

main();