// ==UserScript==
// @name	Slashdot - Article images
// @namespace	https://github.com/adamhotep/userscripts
// @description	Adds zoomable thumbnail for each story link
// @author	Adam Katz
// @icon	https://slashdot.org/favicon.ico
// @include	https://slashdot.org/*
// @include	https://*.slashdot.org/*
// @require	https://git.io/waitForKeyElements.js
// @installURL https://github.com/adamhotep/userscripts/raw/master/Slashdot%20-%20Story%20images.user.js
// @downloadURL https://github.com/adamhotep/userscripts/raw/master/Slashdot%20-%20Story%20images.user.js
// @version	2.2.20240331.2
// @grant	GM_addStyle
// @grant	GM_xmlhttpRequest
// @grant	GM.xmlHttpRequest
// ==/UserScript==

/* Installation instructions:
 *
 * You need a browser add-on that can interpret user scripts to use this.
 * I use Greasemonkey <https://addons.mozilla.org/firefox/addon/greasemonkey/>
 * but this script should also work on other userscript add-ons such as
 * Violentmonkey <https://violentmonkey.github.io/> for Chrome/Edge/Brave & FF.
 */

// Copyright 2009+ by Adam Katz, GPL v3+ {{{
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>. }}}

//// Greasemonkey 4 changed a lot. Here are some GM 3->4 compatibilty shims. {{{

if (typeof GM_xmlhttpRequest == 'undefined'
    && GM && typeof GM.xmlHttpRequest == 'function') {
  var GM_xmlhttpRequest = GM.xmlHttpRequest;
}

// This GM_addStyle implementation is slightly modified from the GM 3->4 shim at
// https://arantius.com/misc/greasemonkey/imports/greasemonkey4-polyfill.js
if (typeof GM_addStyle == 'undefined') {
  function GM_addStyle(aCss) {
    'use strict';
    let head = document.head;
    if (head) {
      let style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.textContent = aCss;
      head.appendChild(style);
      return style;
    }
    return null;
  }
}

//// }}} end GM compatibility shims

var debug_user = "Khopesh";	// change this if you want to see debug
var debug = !!document.querySelector(`.user-access a[href*="/~${debug_user}"]`);

if (debug) console.log("starting Slashdot Article Images");

// Returns object(s) matched as queried via CSS
// q$(css)           =>  document.querySelector(css)
// q$(css, elem)     =>  elem.querySelector(css)
// q$(css, true)     =>  document.querySelectorAll(css)
// q$(css, elem, 1)  =>  elem.querySelectorAll(css)
function q$(css, up = document, all = 0) { // by Adam Katz, github.com/adamhotep
  if (all === 0 && typeof up != "object") { all = up; up = document; }
  if (all) { return up.querySelectorAll(css); }
  else     { return up.querySelector(css); }
}


waitForKeyElements( /* syn=css */
  `article.article:not([sai-done]):not([style*="margin-bottom"])`,
  onNewArticle);

// render text as HTML, convert to text, unescape items, remove remaining tags
function fromHTML(text) {
  let html = document.createElement("div");
  html.innerHTML = text;
  return html.innerText
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")	// fix 2x-escaped tags
    .replace(/<\/?[^>]+>/g, "");			// remove tags
}

// needed because we can't use capture inside repeated element. For example:
// /(?:&foo=(bar)|&baz=blah){2}/ fails to capture bar in &foo=bar&baz=blah
function getContent(text) {
  if (! text) return "";
  text = text.toString();
  let content = text.match(/\s(?:content|src)="([^"]*)"/);	// double quotes
  if (content) return content[1];
  content = text.match(/\s(?:content|src)='([^']*)'/);		// single quotes
  if (content) return content[1];
  content = text.match(/\s(?:content|src)=(\S+)/);		// no quotes
  if (content) return content[1];
  return "";
}

// This builds a regular expression - see also the css in art_blocklist
// Also note that all dots are escaped, use `\\S` instead of `.` for "any char"
var img_blocklist = [
  'https://lauren.vortex.com/lauren.jpg',
  'https://techcrunch.com/wp-content/uploads/[0-9/-]+/tc-logo-\\d+-square-reverse\\dx.png',
  '(?:https://slashdot.org)?/~.*',	// is this needed in an IMAGE blocklist?
  'https://a.fsdn.com/sd/\\S*optout.png\\b',
  '(?:https://(?:www.)?phoronix.com)?/(?:phxcms7-css/phoronix.png|assets/categories/michaellarabel.jpg)',
  '(?:https://(?:[\\w.-]+.)?reutersmedia.net)?/resources_v2/images/rcom-default.png'
].join("|").replace(/\.(?<!\\\.)/g, "\\.");

// get images directly from HTML body
function getImage(code, tag, ext="") {
  let extra = `(?:[?&\\/#][^\'\"]*)?`;
  let src = "src";
  let q = `[\'\"]`;	// "' // quotes (breaks syntax higlighting)
  let Q = `[^\'\"]`;	// "' // non-quotes character
  if (tag == "a") { src = "href"; }
  if (ext) { ext = '\\.' + ext; }
  let skip_attr = `(?![^>]{0,999}\\s(?:width|height)=["']?1?[0-9]{2}\\b)`;
  let skip_src
    = `(?!`
    +   img_blocklist
    +   `|[^>\'\"]{0,999}(?:`
    +     `advert|\\bad[sv]?\\b|badge(?![a-z])|banner|button\\.`
    +     `|ico(?:\\b|[n_0-9])|logo`
    +     `|\\b[0-9]{1,2}px|[^0-9]1?[0-9]{1,2}x1?[0-9]{1,2}(?![0-9])`
    + `))`;
  let regex = new RegExp(
    `<${tag}\\b${skip_attr}[^>]{0,999}\\s${src}=${q}${skip_src}(${Q}+${ext}${extra})${q}`,
    "i");
  let match = code.match(regex);
  if (match) { return match[1]; }
  return ""; // not found
}

function embedYoutube(target) {
  let iframe = document.createElement("iframe");
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + target;
  iframe.frameBorder = 0;
  iframe.allowFullscreen = true;
  iframe.className = "gm thumb video";
  return iframe;
}

// make the thumb (returns the thumb, append the link to it)
function mkthumb(src, video=null) {
  if (debug) console.log("making thumbnail for: " + src);
  let thumb = document.createElement("div");
  if (video) { thumb.appendChild(video); }
  let img = document.createElement("img");
  img.src = src;
  thumb.appendChild(img);
  thumb.setAttribute("onclick", /* syn=js */
    `this.classList.toggle("zoomed")`);
  thumb.className = "gm thumb";
  return thumb;
}

function onNewArticle(article) {
  article.setAttribute("sai-done", "true");

  // This builds a CSS selector
  // it is scope-limited somehow (didn't work when put at top level)
  var art_blocklist = ':not(' + [
    '[rel="tag"]',
    '[href^="https://slashdot.org/"]',
    '[href^="/~"]',
    '[href*=".slashdot.org/story/"]',
  ].join('):not(') + ')';

  let body = q$(`div.body`, article);
  let href = q$(`a.story-sourcelnk${art_blocklist},
                 a.submission-sourcelnk${art_blocklist}
    `, article);
  if (! href || ! href.href) {
    // this uses the quoted area (an <i> tag) to avoid editor shout-out links
    href = q$(`div.p > i a[href]${art_blocklist}`, article);
    if (! href ) { href = q$(`div.p > i a[href]${art_blocklist}`, article); }
    if (! href ) { href = q$(`div.p a[href]${art_blocklist}`, article); }
    if (! href || ! href.href) { if (debug) console.log("new article not found"); return; }
  }
  if (debug) console.log("new article: " + href.href);

  // direct youtube link
  // TODO: playlists? See #2 at https://stackoverflow.com/a/30419360/519360
  let youtube = href.href.match(
    /^https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=)|youtu\.be\/)([\w-]{5,})/
  );
  // indirect youtube link
  var youtube_embed = "";
  if (!youtube) {
    youtube_embed = q$(`
      div.p a[href^="https://youtube.com/watch?"],
      div.p a[href^="https://youtu.be/"],
      div.p a[href^="http://youtu.be/"],
      div.p a[href^="https://youtube-nocookie.com/watch?"],
      div.p a[href^="http://youtube.com/watch?"],
      div.p a[href^="http://youtube-nocookie.com/watch?"]
    `, article);
    if (youtube_embed) {
      youtube_embed = youtube_embed.href.match(
        /(?:embed\/|watch\?(?:.*&)?v=|youtu\.be\/)([\w-]{5,})/
      );
      if (youtube_embed) { youtube_embed = youtube_embed[1]; }
      if (debug) console.log("youtube_embed (in /. article): " + youtube_embed);
    }
  }
  if (youtube) {
    let image = "https://i.ytimg.com/vi/" + youtube[1] + "/mqdefault.jpg";
    let youtu = "https://youtu.be/" + youtube[1];
    youtube = embedYoutube(youtube[1]);
    if (youtube && body.insertBefore(youtube, body.children[0])) {
      let thumb = mkthumb(image, youtube);
      let thumb_link = href.cloneNode(true);
      thumb_link.href = thumb_link.innerHTML = youtu;
      thumb.appendChild(thumb_link);
      body.insertBefore(thumb, body.children[0]);
      return true;
    }
  }

  let host = href.innerHTML;

  function debug_resp(type, response) {
    let state = ["UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING", "DONE"];
    let text = [response.finalUrl, "Request " + type, response.status,
      response.statusText, "State: " + state[response.readyState],
      "HTTP Headers:\n", response.responseHeaders].join("\n");
    if (debug) { console.log(text); return true; }
    if (type == "succeeded" && response.status && response.status == 200) { return true; }
    console.log(text); // push errors to console anyway
  }

  GM_xmlhttpRequest({
    method: 'GET',
    url: href.href,
    onabort:	function(response) { debug_resp("aborted", response); },
    // Unknown error from Forbes on https://slashdot.org/submission/11512774/
    // These diagnostics don't help--they're empty. Just status 4 (DONE).
    onerror:	function(response) { debug_resp("error", response); },
    ontimeout:	function(response) { debug_resp("timed out", response); },
    onload:	function(response) {
      debug_resp("succeeded", response);
      let html = response.responseText;

      /* TODO: rewrite using DOM and q$() rather than parsing HTML with regexes
       *
       * here's my start: {{{

      let dom = response.responseXML;
      // backup, see https://wiki.greasespot.net/index.php?title=GM.xmlHttpRequest#GET_request
      if (!dom) { dom = new DOMParser().parseFromString(response.responseText, "text/html"); }

      let title = dom.title;
      if (debug) console.log("article loaded: " + title || "(no title found)");

      function meta_content(name) {
        let m = q$(`meta[name="${name}"][content]:not([content=""])`, dom);
        if (m && m.content) { return m.content; }
        return null;
      }

      // get description
      desc = meta_content("twitter:description") || meta_content("description");
      // try to truncate at a word or else truncate to 500 chars anyway
      desc = fromHTML(desc).replace(/^(.{420,497})\s.*$/, "$1 …")
                           .replace(/^(.{499}).+$/, "$1…");

      if (youtube_embed) {
        if (debug) console.log("youtube_embed (from /., used in crawl): " + youtube_embed);
        youtube = embedYoutube(youtube_embed);
      } else {
        let youtube = q$(`
          iframe[src^="https://youtube.com/embed/"],	iframe[src^="https://youtube-nocookie.com/embed/"],
          iframe[src^="//youtube.com/embed/"],		iframe[src^="//youtube-nocookie.com/embed/"],
          iframe[src^="http://youtube.com/embed/"],	iframe[src^="http://youtube-nocookie.com/embed/"],
        `, dom);
        if (youtube) {
          youtube = embedYoutube(youtube.src.replace(/.*\/embed\/, ""));
        }
      }

      let hdrs = q$("head", dom);
      if (debug) console.log(hdrs);

      /* end TODO }}} */

      let title = html.match(/<title[^>]*>\s*([^\s<][^<]*)<.title>/im) || "";
      title = title && title[1];
      title = title.replace(/\s+$/, "");
      if (debug) console.log("article loaded: " + (title ? title : "(no title found)"));
      let desc = html.match(	// description for twitter cards
        /<meta\b(?:\s+(?:property|name)\s*=\s*['"]twitter:description['"]|\s+content\s*=\s*['"][^'"]{6,}['"]){2}/i
      );
      if (! desc) {		// meta description proper
        desc = html.match(
          /<meta\b(?:\s+(?:name|property)\s*=\s*['"]?description['"]?(?=[\t >])|\s+content\s*=\s*['"][^'"]{6,}['"]){2}/i
        );
      }
      desc = getContent(desc);
      desc = desc.replace(/^\s+|\s+$/gm, "").replace(/\s\s+|\t/g, " ");
      if (!desc || title.length > desc.length) { desc = title; }
      // try to truncate at a word or else truncate to 500 chars anyway
      desc = fromHTML(desc).replace(/^(.{420,497})\s.*$/, "$1 …")
                           .replace(/^(.{499}).+$/, "$1…");

      let body = q$(`div.body`, article);
      if (! body) { return; }

      let youtube = html.match(	// embedded youtube video
        /<iframe\b(?:\s(?!src=)\S+)*\ssrc="(?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([^'"\s]+)/i
      );
      if (youtube_embed) {
        if (debug) console.log("youtube_embed (from /., used in crawl): " + youtube_embed);
        youtube = embedYoutube(youtube_embed);
      } else if (youtube) {
        youtube = embedYoutube(youtube[1]);
      }

      if (debug) console.log("looking for an image now");
      let image = html.match(	// twitter card image
        /<meta\b(?:\s+(?:name|property)\s*=\s*['"]twitter:image(?::src)?['"]|\s+content\s*=\s*['"](?:http|\/\/)[^"']+['"]){2}/i
      );
      if (! image) {
        image = html.match(	// other meta content images, esp. "og:image"
          /<meta\b[^>]*(?:\s+(?:name|property)\s*=\s*['"][^"']*:image(?::src)?['"]|\s+content\s*=\s*['"](?:http|\/\/)[^"']+['"]){2,3}/i
        );
      }
      if (! image) {
        let re =
          /<meta\b[^>]*\scontent\s*=\s*['"][^"']+\.(?:jpe?g|png)(?:[?&\/#][^'"]*)?['"]/gi;
        while ( image = re.exec(html) ) {	// other meta content images
          // accept only if what we found wasn't an icon or other exclusion
          // image.match isn't always a function(!?) so make sure it is a funciton first
          if (image && image.match && ! image.match(/tile|ico(?:\b|[n_0-9])/i) ) { break; }
          image = null; 	// reset since an exclusion triggered
        }
      }
      if (image && debug) { console.log("raw image found: " + image); }
      image = getContent(image);
      if (image && debug) { console.log("image found: " + image); }
      else if (debug)     { console.log("no image found in headers"); }

      // another blocklist needed for Reuters, who uses their logo as their card
      if (image && image.match(RegExp(`^(?:${img_blocklist})`))) {
        if (debug) console.log("image removed for matching img_blocklist: " + image);
        image = '';
      }

      if (! image) { image = getImage(html, "a", "jpe?g"); }
      if (! image) { image = getImage(html, "a", "png"); }
      // trim wordpress down to just the actual story content
      if (! image && html.match(/<link\s.{9,256}\/wp-content\//)) { 
        let tag = `img(?=\\s[^>]*\\bwp-image\\b)`;
        image = getImage(html, tag, "jpe?g");
        if (! image) { image = getImage(html, tag); }
      }
      if (! image) { image = getImage(html, "img", "(?:jpe?g|png)"); }
      if (! image) { image = getImage(html, "img"); }

      if (! image) { if (debug) console.log("FINAL: no image found"); return; }
      if (!image.match(/^(?:https?:)?\/\//)) {		// not absolute
        if (0 == image.indexOf("/")) {			// relative to root
          image = href.href.match(/^https?:\/\/[^\/:?#]+/) + image;
        } else {					// fully relative
          image = href.href.replace(/\/[^\/]*$/, "/" + image);
        }
      }

      image = image.replace(/&(amp|#0*38|#x0*26);/g, "&");

      let thumb = mkthumb(image, youtube);
      if (desc) {
        let oldtitle = href.title.replace(RegExp(" . " + href.href), "");
        thumb.title = href.title = desc;
        if (oldtitle) { href.title += ` (${oldtitle})`; }
      }
      let thumb_link = href.cloneNode(true);
      if (title) { thumb_link.innerHTML = title; }
      thumb.appendChild(thumb_link);

      body.insertBefore(thumb, body.children[0]);

    }
  });

}


// SVG lacks `<?xml version="1.0" encoding="UTF-8" standalone="no"?>`
// because that doesn't escape right and I don't want to unescape just the `?`
var magnifier = "data:image/svg+xml," + escape(/* SVG from Wikipedia, syn=xml */
  `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="11"
        viewBox="0 0 11 15">
     <g fill="#fff" stroke="#366">
       <path d="M1.509 1.865h10.99v7.919h-10.99z"/>
       <path d="M-1.499 6.868h5.943v4.904h-5.943z"/>
     </g>
   </svg>`);

// BUG: images w/ widths determined by max-height can have captions from titles
// that are truncated to the max-width rather than the smaller actual width

GM_addStyle(`

  .gm.thumb		{ float:right; text-align:right; cursor:zoom-in; }
  .gm.thumb .video	{ float:none; width:420px; height:240px; }
  .gm.thumb.zoomed .video + img, .gm.thumb:not(.zoomed) .video
  			{ display:none; }
  .gm.thumb a		{ display:none; font-size:90%; text-align:center;
  			  width:-moz-min-content; width:min-content;
  			  max-width:33vw; white-space:nowrap; overflow:hidden;
  			  text-overflow:ellipsis; text-overflow:fade(5ex); }
  .gm.thumb img		{ max-width:20vw; max-height:15vh;
  			  border-radius:1ex; border:1px solid transparent }
  .gm.thumb:hover img	{ border-radius:0; border-color:#016765; }
  .gm.thumb.zoomed	{ background:url("${magnifier}") bottom right no-repeat;
  			  cursor:zoom-out; }
  .gm.thumb.zoomed img	{ max-width:33vw; max-height:33vh; }
  .gm.thumb.zoomed a	{ display:block; }

`);
