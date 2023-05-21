<div id="top"></div>

[![commits](https://badgen.net/github/commits/Steve6666666/CS552/main)](https://GitHub.com/Steve6666666/CS552/graphs/commit-activity)
[![forks](https://badgen.net/github/forks/Steve6666666/CS552)](https://GitHub.com/Steve6666666/CS552)
[![stars](https://badgen.net/github/stars/Steve6666666/CS552)](https://GitHub.com/Steve6666666/CS552/stargazers)
[![issues](https://badgen.net/github/issues/Steve6666666/CS552)](https://GitHub.com/Steve6666666/CS552/issues/)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

<div align="center">
  <h1 align="center">Machine Learning Approach to Classifying Individual Websites</h1>
  <p align="center">
    Short description here
    <br />
    <a href="https://GitHub.com/Steve6666666/CS552"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://GitHub.com/Steve6666666/CS552">View Demo</a>
    ·
    <a href="https://GitHub.com/Steve6666666/CS552">Report Bug</a>
    ·
    <a href="https://GitHub.com/Steve6666666/CS552">Request Feature</a>
  </p>
</div>

<details open>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#about-the-project">About The Project</a>
            <ul>
                <li><a href="#built-with">Built With</a></li>
                <li><a href="#purpose">Purpose</a></li>
            </ul>
        </li>
        <li><a href="#project-structure">Project Structure</a></li>
        <li>
            <a href="#project-overview">Project Overview</a>
            <ul>
                <li>
                    <a href="#dataset-overview">Dataset Overview</a>
                </li>
            </ul>
        </li>
    <li><a href="#reference">Reference</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

This is a course project of Rutgers CS552 Computer Network.

### Built with

* Language:

* Data Source: 

* Python Packages:

### Purpose

<p align="right">(<a href="#top">back to top</a>)</p>

## Project setup

* Dependency setup

    ```sh
    source init.sh
    ```

* Install `tshark`

    ```sh
    apt install tshark -y
    ```

* Data collect script
    
    Change `[website_name]` with a specific website name
    
    ```sh
    sh collect.sh [website_name]
    ```

    This will create two processes (crawler and collector) in two screens.

    * Show screen list
    
        ```sh
        screen -ls
        ```

    * Resume screen
        
        ```sh
        screen -r [screen_name]
        ```
        for example

        ```sh
        screen -r crawler
        ```

    * Detach screen: Press `Ctrl + A + D`

* Data filter script

    Change `[website_name]` with the corresponding website name and `IPv4 address` with the server's IPv4 address

    ```sh
    sh filter.sh [website_name] [IPv4 address]
    ```

    Check the server's IPv4 address

    ```sh
    ifconfig
    ```

* Vultr setup

    * Add new user in Linux system

        ```sh
        sudo adduser username
        ```
    
    * Add the new user to sudo file

        Find the following line in sudoers file
        
        ```sh
        root ALL=(ALL)ALL
        ```

        Add the following line of code under it. Replace `username` with the new user's username you want to add
        ```sh
        username ALL=(ALL)ALL
        ```
    
    * Install `Puppeteer` on Ubuntu 23.04 x64

        * Install the required dependencies by running the following command

            ```sh
            sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
            ```
        
        * Install `Node.js` using `nvm` (Node Version Manager)

            ```sh
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            source ~/.bashrc
            nvm install --lts
            nvm use –lts
            ```
        
        * Check for `node` and `nvm` with command

            ```sh
            node -v
            nvm -v
            ```
        
        * Install `Puppeteer` using `npm` (Node Package Manager) by running the following command

            ```sh
            npm install puppeteer
            ```
        
    * Ban IPv6 on server

        * Edit `/etc/sysctl.conf` file

            ```sh
            net.ipv6.conf.all.disable_ipv6 = 1
            net.ipv6.conf.default.disable_ipv6 = 1
            ```

        * Apply the change

            ```sh
            sudo sysctl -p
            ```
    * Ban quick UDP on server

        Add option `--disable-quic`.

        For example:
        ```javascript
        (
            async () => {
                const browser = await puppeteer.launch({
                    args: ['--disable-quic']
                });
            }
        )
        ```
## Project Structure

<p align="right">(<a href="#top">back to top</a>)</p>

## Project Overview

### Login Site

- [x] www.yelp.com
- [x] www.britannica.com
- [x] www.cnn.com
- [x] www.ebay.com
- [x] www.foxnews.com
- [x] www.nfl.com
- [ ] ~~www.nytimes.com~~
- [x] www.reddit.com
- [ ] ~~www.target.com~~
- [x] www.yahoo.com



<p align="right">(<a href="#top">back to top</a>)</p>

## Reference

<p id="reference-1"></p>

[1] [*reference title*](reference_link). Author A, publisher, page, date.

<p align="right">(<a href="#top">back to top</a>)</p>

## Contact

Chuxu Song - [cs1346@scarletmail.rutgers.edu](mailto:cs1346@scarletmail.rutgers.edu)

Feiyu Zheng - [feiyuzheng98@gmail.com](mailto:feiyuzheng98@gmail.com)

Project Link: [https://github.com/Steve6666666/CS552](https://github.com/Steve6666666/CS552)

<p align="right">(<a href="#top">back to top</a>)</p>