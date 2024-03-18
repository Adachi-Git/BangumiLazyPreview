// ==UserScript==
// @name         BangumiLazyPreviewLinkForWiki
// @namespace    https://github.com/Adachi-Git/BangumiLazyPreviewLink
// @version      0.6
// @description  Lazy load links and show their titles
// @author       Jirehlov (Original Author), Adachi (Current Author)
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/.*
// @grant        none
// @license      MIT

// ==/UserScript==

(function () {
    'use strict';

    // 删除可视区域内的零宽空格字符
    function removeZeroWidthSpacesInView() {
        document.querySelectorAll('*').forEach(element => {
            const rect = element.getBoundingClientRect();
            // 检查元素是否在可视区域内
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                element.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.textContent = node.textContent.replace(/\u200B/g, ''); // 替换零宽空格字符
                    }
                });
            }
        });
    }

    // 在滚动事件中调用删除零宽空格字符的函数
    window.addEventListener('scroll', () => {
        removeZeroWidthSpacesInView();
    });

    // 在页面加载完成后也调用一次，以处理初始状态
    window.addEventListener('load', () => {
        removeZeroWidthSpacesInView();
    });

    let lazyLinks = []; // 存储需要懒加载处理的链接
    let linkCache = {}; // 存储链接和对应的标题

    // 替换链接文本为链接指向页面的标题
   const replaceLinkText = (link) => {
    let linkURL = link.href;
    if (window.location.href.includes('bangumi.tv')) {
        linkURL = linkURL.replace('bgm.tv', 'bangumi.tv'); // 将链接中的 bgm.tv 替换为 bangumi.tv
    } else if (window.location.href.includes('chii.in')) {
        linkURL = linkURL.replace(/bangumi\.tv|bgm\.tv/, 'chii.in'); // 将链接中的 bangumi.tv 或 bgm.tv 替换为 chii.in
    }

    if (link.textContent === link.href) { // 检查链接的文本内容是否与链接地址相同
        if (linkCache[linkURL]) { // 检查链接是否在缓存中
            link.textContent = linkCache[linkURL] + ','; // 如果在缓存中，直接从缓存中获取标题
        } else {
            fetch(linkURL)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(data, 'text/html');
                    const title = htmlDoc.querySelector('h1.nameSingle a');
                    let titleText = title ? title.textContent : '';
                    // 检查链接是否指向主题或剧集，并添加中文标题
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
                    // 检查链接是否指向剧集，并添加剧集标题
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
                    // 如果存在标题文本，则将其设置为链接文本，并在后面添加逗号
                    if (titleText) {
                        link.textContent = titleText + ',';
                        linkCache[linkURL] = titleText; // 将链接和标题添加到缓存中
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }
    }
};

    const lazyLoadLinks = () => {
        lazyLinks.forEach(link => {
            replaceLinkText(link);
        });
        // 清空已处理的链接列表
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

    // 获取页面上的所有链接
    const allLinks = document.querySelectorAll('a[href^="https://bgm.tv/subject/"], a[href^="https://chii.in/subject/"], a[href^="https://bangumi.tv/subject/"], a[href^="https://bgm.tv/ep/"], a[href^="https://chii.in/ep/"], a[href^="https://bangumi.tv/ep/"], a[href^="https://bgm.tv/character/"], a[href^="https://chii.in/character/"], a[href^="https://bangumi.tv/character/"], a[href^="https://bgm.tv/person/"], a[href^="https://chii.in/person/"], a[href^="https://bangumi.tv/person/"]');

    // 设置定时器变量
    let timer;

    // 创建浮动窗口元素
    const floatingDiv = document.createElement('div');
    floatingDiv.style.position = 'fixed';
    floatingDiv.style.top = '50px';
    floatingDiv.style.left = '50px';
    floatingDiv.style.padding = '10px';
    floatingDiv.style.background = '#fff';
    floatingDiv.style.border = '1px solid #ccc';
    floatingDiv.style.borderRadius = '5px';
    floatingDiv.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
    floatingDiv.style.zIndex = '9999';
    floatingDiv.style.display = 'none';
    document.body.appendChild(floatingDiv);

   // 监听文本选中事件
let selectionTimeout;
document.addEventListener('selectionchange', () => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        let selectedText = selection.toString().trim();
        selectedText = selectedText.replace(/,$/, ''); // 去除选定文本末尾的逗号
        if (selectedText) {
            const selectedWords = selectedText.split(/,\s*/); // 使用逗号和可能的空格进行分词
            const selectedIDs = [];
            allLinks.forEach(link => {
                const linkText = link.textContent.trim().replace(/,$/, ''); // 去除链接文本末尾的逗号
                // 检查链接文本是否包含选中的任何一个分词
                if (selectedWords.some(word => linkText.includes(word))) {
                    const id = link.href.match(/\d+/)[0];
                    selectedIDs.push(id);
                }
            });
            if (selectedIDs.length > 0) {
                showFloatingDiv(selectedIDs);
            }
        } else {
            hideFloatingDiv();
        }
    }, 500); // 等待500毫秒
});
// 显示浮动窗口
function showFloatingDiv(ids) {
    floatingDiv.innerHTML = ''; // 清空浮动窗口内容
    const uniqueIDs = [...new Set(ids)]; // 使用 Set 来获取唯一的 ID
    uniqueIDs.forEach(id => {
        const itemDiv = document.createElement('div');
        itemDiv.textContent = id + ',';
        floatingDiv.appendChild(itemDiv);
    });
    floatingDiv.style.display = 'block';

    // 添加点击事件监听器
    floatingDiv.addEventListener('click', () => {
        copyAllToClipboard(uniqueIDs);
    });
}

// 复制全部文本到剪贴板，并隐藏浮动窗口
function copyAllToClipboard(ids) {
    const clipboardText = ids.join(',');
    navigator.clipboard.writeText(clipboardText)
        .then(() => {
            console.log('Copied to clipboard:', clipboardText);
            hideFloatingDiv(); // 复制完成后隐藏悬浮框
        })
        .catch(err => console.error('Failed to copy to clipboard:', err));
}

// 隐藏浮动窗口
function hideFloatingDiv() {
    floatingDiv.style.display = 'none';
}


})();
