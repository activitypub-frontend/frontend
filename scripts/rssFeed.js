/* eslint-disable require-jsdoc */
import md5 from './md5.js';
let rssmd5 = '';

/**
 * Collects and parses an RSS feed.
 * @param {string} url The URL of the RSS feed
 * @return {Promise<HTMLDivElement>} The parsed RSS feed
 */
async function getRSSFeed(url) {
  const res = await fetch('/getFile', {
    method: 'POST',
    body: JSON.stringify({url: url}),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  const md5hash = md5(text);
  if (md5hash === rssmd5) {
    throw new Error('No change');
  }
  rssmd5 = md5hash;
  const container = document.createElement('div');
  container.className = 'rss-container';
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  Array.from(doc.querySelectorAll('item'))
      .slice(0, 10)
      .forEach((item) => {
        const article = document.createElement('article');
        const heading = document.createElement('h1');
        const headingLink = document.createElement('a');
        headingLink.rel = 'noreferrer';
        headingLink.target = '_blank';
        headingLink.href = item.querySelector('guid').textContent;
        headingLink.textContent = item.querySelector('title').textContent;
        heading.appendChild(headingLink);
        article.appendChild(heading);
        const published = document.createElement('div');
        published.textContent =
                'Erschienen ' +
                new Date(Date.parse(item.querySelector('pubDate').innerHTML))
                    .toLocaleString('de-DE');
        article.appendChild(published);
        const content = document.createElement('div');
        content.innerHTML = item.getElementsByTagName('content:encoded')[0]
            .childNodes[0].data;
        article.appendChild(content);
        container.appendChild(article);
      });
  return container;
}

export default getRSSFeed;
