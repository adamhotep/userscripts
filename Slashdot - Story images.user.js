// ==UserScript==
// @name	Slashdot - Article images
// @namespace	https://github.com/adamhotep/userscripts
// @description	Adds zoomable thumbnail for each story link
// @include	https://slashdot.org/*
// @include	https://*.slashdot.org/*
// @author	Adam Katz <scriptsATkhopiscom>
// @installURL https://github.com/adamhotep/userscripts/raw/master/Slashdot%20-%20Story%20images.user.js
// @downloadURL https://github.com/adamhotep/userscripts/raw/master/Slashdot%20-%20Story%20images.user.js
// @version	2.1.1.20180127
// @grant	GM_addStyle
// @grant	GM_xmlhttpRequest
// @grant	GM.xmlHttpRequest
// ==/UserScript==
// Copyright 2009+ by Adam Katz, GPL v3+ except for waitForKeyElements
// waitForKeyElements is copyright BrockA and licensed CC BY-NC-SA 4.0
// all changes tracked to adamhotep on github are also (dual-) licensed GPL v2+

// previously had  @require https://git.io/waitForKeyElements.js
// but Greasemonkey 4.0 cannot incorporate Github gists due to
// https://github.com/greasemonkey/greasemonkey/issues/2631 so here it is:
//
// waitForKeyElements was originally https://gist.github.com/BrockA/2625891
// and modified to work without jQuery by me (see above git.io link).
function waitForKeyElements (	// {{{
    selectorTxt,    /* Required: The querySelector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed the matched element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                       search.
                    */
) {
    var targetNodes, btargetsFound;

    //--- Additionally avoid what we've found
    var selectorClean = selectorTxt.replace(/(,)|$/g, ":not([wfke_found])$1");

    if (typeof iframeSelector == "undefined")
        targetNodes     = document.querySelectorAll(selectorClean);
    else {
        targetNodes = [];
        var iframe = document.querySelectorAll(iframeSelector);
        for (var i = 0, il = iframe.length; i < il; i++) {
            var nodes = iframe[i].querySelectorAll(selectorClean);
            if (nodes) targetNodes.concat(nodes);
        }
    }

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        //--- Found target node(s).  Go through each and act if they are new.
        for (var t = 0, tl = targetNodes.length; t < tl; t++) {

            if (!targetNodes[t].getAttribute("wfke_found")) {
                //--- Call the payload function.
                var cancelFound = false;
                try {
                    cancelFound     = actionFunction (targetNodes[t]);
                }
                //--- Log errors to console rather than stopping altogether
                catch (error) {
                    var name = actionFunction.name;
                    if (name)
                        name = 'in function "' + name + '":\n';
                    console.log ("waitForKeyElements: actionFunction error\n"
                        + name + error);
                }
                if (cancelFound)
                    btargetsFound   = false;
                else
                    targetNodes[t].setAttribute("wfke_found", true);
            }
        }
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            iframeSelector
                                        );
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
} // }}}

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

waitForKeyElements( /* syn=css */
  `article.article:not([sai-done]):not([style*="margin-bottom"])`,
  onNewArticle);

// some short-hand
function q$(css, up=document) {
  return up.querySelector(css);
}

// render text as HTML, convert to text, unescape items, remove remaining tags
function fromHTML(text) {
  var html = document.createElement("div");
  html.innerHTML = text;
  return html.innerText
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")	// fix 2x-escaped tags
    .replace(/<\/?[^>]+>/g, "");			// remove tags
}

// needed because we can't use capture inside repeated element. For example:
// /(?:&foo=(bar)|&baz=blah){2}/ fails to capture bar in &foo=bar&baz=blah
function getContent(text) {
  if (! text) return null;
  text = text.toString();
  var content = text.match(/\s(?:content|src)="([^"]*)"/);	// double quotes
  if (content) return content[1];
  content = text.match(/\s(?:content|src)='([^']*)'/);		// single quotes
  if (content) return content[1];
  content = text.match(/\s(?:content|src)=(\S+)/);		// no quotes
  if (content) return content[1];
  return null;
}

// get images directly from HTML body
function getImage(code, tag, ext="") {
  var blacklist = [
    'https://lauren.vortex.com/lauren.jpg',
    '(?:https://www.phoronix.com)?/phxcms7-css/phoronix.png'
  ];
  var skip = `(?!${blacklist.join("|").replace(/\./g, "\\.")}|[^\'\">]*`
           +   `(?:`
           +     `advert|\\bad[sv]?\\b|banner|button\\.|ico(?:\\b|n)|logo`
           +     `|\\b[0-9]{1,2}px|[^0-9]1?[0-9]{1,2}x1?[0-9]{1,2}(?![0-9])`
           +     `|[^>]{0,999}\\s(?:width|height)=["']?1?[0-9]{2}\\b`
           +   `))`;
  var extra = `(?:[?&\\/#][^\'\"]*)?`;
  var src = "src";
  var q = `[\'\"]`;	// "' // quotes (breaks syntax higlighting)
  var Q = `[^\'\"]`;	// "' // non-quotes character
  if (tag == "a") { src = "href"; }
  if (ext) { ext = '\\.' + ext; }
  var regex = new RegExp(
    `<${tag}\\b[^>]*\\s${src}=${q}${skip}(${Q}+${ext}${extra})${q}`,
    "i");
  var match = code.match(regex);
  if (match) { return match[1]; }
  return ""; // not found
}

function embedYoutube(target) {
  var iframe = document.createElement("iframe");
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + target;
  iframe.frameBorder = 0;
  iframe.allowFullscreen = true;
  iframe.className = "gm thumb video";
  return iframe;
}

// make the thumb (returns the thumb, append the link to it)
function mkthumb(image, video=null) {
  var thumb = document.createElement("div");
  if (video) { thumb.appendChild(video); }
  var img = document.createElement("img");
  img.src = image;
  thumb.appendChild(img);
  thumb.setAttribute("onclick", /* syn=js */
    `this.classList.toggle("zoomed")`);
  thumb.className = "gm thumb";
  return thumb;
}

function onNewArticle(article) {
  article.setAttribute("sai-done", "true");
  var body = q$(`div.body`, article);
  var href = q$(`a.story-sourcelnk, a.submission-sourcelnk`, article);
  if (! href || ! href.href) {
    // this uses the quoted area (an <i> tag) to avoid editor shout-out links
    href = q$(`div.p > i a[rel][href]`, article);
    if (! href ) { href = q$(`div.p > i a[href])`, article); }
    if (! href || ! href.href) { return; }
  }

  // direct youtube link
  // TODO: playlists? hints at https://stackoverflow.com/a/30419360/519360 #2
  var youtube = href.href.match(
    /^https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=)|youtu\.be\/)([\w-]{5,})/
  );
  if (youtube) {
    var image = "https://i.ytimg.com/vi/" + youtube[1] + "/mqdefault.jpg";
    var youtu = "https://youtu.be/" + youtube[1];
    youtube = embedYoutube(youtube[1]);
    if (youtube && body.insertBefore(youtube, body.children[0])) {
      var thumb = mkthumb(image, youtube);
      var thumb_link = href.cloneNode(true);
      thumb_link.href = thumb_link.innerHTML = youtu;
      thumb.appendChild(thumb_link);
      body.insertBefore(thumb, body.children[0]);
      return true;
    }
  }

  var host = href.innerHTML;

  GM_xmlhttpRequest({
    method: 'GET',
    url: href.href,
    onload: function(response) {
      var html = response.responseText;

      var title = html.match(/<title[^>]*>([^<]+)<.title>/im) || "";
      title = title && title[1];
      var desc = html.match(	// description for twitter cards
        /<meta\b(?:\s+name=['"]twitter:description['"]|\s+content=['"][^'"]{6,}['"]){2}/i
      );
      if (! desc) {		// meta description proper
        var desc = html.match(
          /<meta\b(?:\s+name=['"]?description['"]?(?=[\t >])|\s+content=['"][^'"]{6,}['"]){2}/i
        );
      }
      desc = getContent(desc);
      if (!desc || title.length > desc.length) { desc = title; }
      // try to truncate at a word or else truncate to 500 chars anyway
      desc = fromHTML(desc).replace(/^(.{420,497})\s.*$/, "$1 …")
                           .replace(/^(.{499}).+$/, "$1…");

      var body = q$(`div.body`, article);
      if (! body) { return; }

      var youtube = html.match(	// embedded youtube video
        /<iframe\b(?:\s(?!src=)\S+)*\ssrc="(?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([^'"\s]+)/i
      );
      if (youtube) {
        youtube = embedYoutube(youtube[1]);
      }

      var image = html.match(	// twitter card image
        /<meta\b(?:\s+name=['"]twitter:image(?::src)?['"]|\s+content=['"](?:http|\/\/)[^"']+['"]){2}/i
      );
      if (! image) {
        image = html.match(	// other meta content images, esp. "og:image"
          /<meta\b(?:\s+(?:name|property)=['"][^"']*:image(?::src)?['"]|\s+content=['"](?:http|\/\/)[^"']+['"]){2,3}/i
        );
      }
      if (! image) {
        var re =
          /<meta\b[^>]*\scontent=['"][^"']+\.(?:jpe?g|png)(?:[?&\/#][^'"]*)?['"]/gi;
        while ( image = re.exec(html) ) {	// other meta content images
          // accept only if what we found wasn't an icon or other exclusion
          if (image && ! image.match(/tile|ico(?:\b|[n_0-9])/i) ) { break; }
          image = null; 	// reset since an exclusion triggered
        }
      }
      image = getContent(image);

      if (! image) { image = getImage(html, "a", "jpe?g"); }
      if (! image) { image = getImage(html, "a", "png"); }
      // trim wordpress down to just the actual story content
      if (! image && html.match(/<link\s.{9,256}\/wp-content\//)) { 
        var tag = `img(?=\\s[^>]*\\bwp-image\\b)`;
        image = getImage(html, tag, "jpe?g");
        if (! image) { image = getImage(html, tag); }
      }
      if (! image) { image = getImage(html, "img", "(?:jpe?g|png)"); }
      if (! image) { image = getImage(html, "img"); }
    
      if (! image) { return; }
      if (!image.match(/^(?:https?:)?\/\//)) {		// not absolute
        if (0 == image.indexOf("/")) {			// relative to root
          image = href.href.match(/^https?:\/\/[^\/:?#]*/) + image;
        } else {					// fully relative
          image = href.href.replace(/\/[^\/]*$/, "/" + image);
        }
      }

      image = image.replace(/&amp;/g, "&");

      var thumb = mkthumb(image, youtube);
      if (desc) { thumb.title = desc; }
      var thumb_link = href.cloneNode(true);
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
