// ==UserScript==
// @name         BangumiLazyPreview
// @namespace    https://github.com/Adachi-Git/BangumiLazyPreviewLink
// @version      0.2
// @description  Lazy load links and show their titles
// @author      Jirehlov (Original Author), Adachi (Current Author)
// @include        /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        none
// @license      MIT
// ==/UserScript==
(function () {
    "use strict";

    // 替换链接文本为链接指向页面的标题
    const replaceLinkText = (link) => {
        let linkURL = link.href;
        if (window.location.href.includes('bangumi.tv')) {
            linkURL = linkURL.replace('bgm.tv', 'bangumi.tv'); // 将链接中的 bgm.tv 替换为 bangumi.tv
        } else if (window.location.href.includes('chii.in')) {
            linkURL = linkURL.replace(/bangumi\.tv|bgm\.tv/, 'chii.in'); // 将链接中的 bangumi.tv 或 bgm.tv 替换为 chii.in
        }
        if (link.textContent === link.href) {
            fetch(linkURL)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(data, 'text/html');
                    const title = htmlDoc.querySelector('h1.nameSingle a');
                    const blogtitle = htmlDoc.querySelector('h1');
                    let titleText = title ? title.textContent : '';
                    let blogtitleText = blogtitle ? blogtitle.textContent : '';
                    if (link.href.includes('subject') || link.href.includes('ep')) {
                        const chineseName = title ? title.getAttribute('title') : '';
                        if (chineseName) {
                            if (titleText) {
                                titleText += ' | ' + chineseName;
                            } else {
                                titleText = chineseName;
                            }
                        }
                    }
                    if (link.href.includes('ep')) {
                        const epTitle = htmlDoc.querySelector('h2.title');
                        if (epTitle) {
                            epTitle.querySelectorAll('small').forEach(small => small.remove());
                            const epTitleText = epTitle.textContent;
                            if (epTitleText) {
                                if (titleText) {
                                    titleText += ' | ' + epTitleText;
                                } else {
                                    titleText = epTitleText;
                                }
                            }
                        }
                    }
                    if ((link.href.includes('blog') || link.href.includes('topic') || link.href.includes('index')) && blogtitleText) {
                        titleText = blogtitleText;
                    }
                    if (titleText) {
                        link.textContent = titleText;
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }
    };

    // 获取页面上的所有链接
    const allLinks = document.querySelectorAll('a[href^="https://bgm.tv/subject/"], a[href^="https://chii.in/subject/"], a[href^="https://bangumi.tv/subject/"], a[href^="https://bgm.tv/ep/"], a[href^="https://chii.in/ep/"], a[href^="https://bangumi.tv/ep/"], a[href^="https://bgm.tv/character/"], a[href^="https://chii.in/character/"], a[href^="https://bangumi.tv/character/"], a[href^="https://bgm.tv/person/"], a[href^="https://chii.in/person/"], a[href^="https://bangumi.tv/person/"], a[href^="https://bgm.tv/blog/"], a[href^="https://chii.in/blog/"], a[href^="https://bangumi.tv/blog/"], a[href^="https://bgm.tv/group/topic/"], a[href^="https://chii.in/group/topic/"], a[href^="https://bangumi.tv/group/topic/"], a[href^="https://bgm.tv/index/"], a[href^="https://chii.in/index/"], a[href^="https://bangumi.tv/index/"]');

    // 设置定时器变量
    let timer;

    let lazyLinks = Array.from(allLinks);

    const lazyLoadLinks = () => {
        lazyLinks.forEach(link => {
            replaceLinkText(link);
        });
        // 清空已处理的链接
        lazyLinks = [];
    };

    // 检查滚动事件来触发懒加载
    window.addEventListener('scroll', () => {
        // 在滚动事件中，检查链接是否在视口中，并将未处理的链接添加到待处理列表
        allLinks.forEach(link => {
            const rect = link.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                lazyLinks.push(link);
            }
        });
        // 当页面滚动停止一段时间后再执行懒加载
        clearTimeout(timer);
        timer = setTimeout(lazyLoadLinks, 200); // 等待200毫秒
    });

    // 页面加载完成时立即执行一次懒加载
    window.addEventListener('DOMContentLoaded', lazyLoadLinks);
})();
