// ==UserScript==
// @name	Slashdot - Article images
// @namespace	https://github.com/adamhotep/userscripts
// @description	Adds zoomable thumbnail for each story link
// @include	https://slashdot.tld/*
// @include	https://*.slashdot.tld/*
// @author	Adam Katz <scriptsATkhopiscom>
// @copyright	2009 by Adam Katz
// @license	GPL v3+
// @version	1.0.2
// @lastupdated	2017-10-20
// @require	https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require	https://git.io/waitForKeyElements
// @grant	GM_addStyle
// @grant	GM_xmlhttpRequest
// ==/UserScript==

waitForKeyElements( /* syn=css */
  `article.article:not([style*="margin-bottom"])`,
  onNewArticle);

// render given text as HTML and convert to text (unescapes ampersands)
function fromHTML(text) {
  var html = $('<div>').html(text);
  if (html && html[0] && html[0].innerText) { text = html[0].innerText; }
  return text
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")	// fix 2x-escaped tags
    .replace(/<\/?[^>]+>/g, "");			// remove tags
  ;
}

function onNewArticle(jQuery) { jQuery.each( function(index) {

  var article = $(this)[0];
  var href = article.querySelector(`a.story-sourcelnk, a.submission-sourcelnk`);
  if (! href || ! href.href) {
    href = article.querySelector(`div.p > i a[rel][href]`);
    if (! href ) { href = article.querySelector(`div.p > i a[href]`); }
    if (! href || ! href.href) { return; }
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
        /<meta\b(?:\s+name=['"]twitter:description['"]|\s+content=['"]([^'"]{6,})([^'"]*)['"]){2}/i
      );
      if (! desc) {		// meta description proper
        var desc = html.match(
          /<meta\b(?:\s+name=['"]?description['"]?(?=[\t >])|\s+content=['"]([^'"]{6,})['"]){2}/i
        );
      }
      desc = desc && desc[1] || title;
      // try to truncate at a word or else truncate to 500 chars anyway
      desc = fromHTML(desc).replace(/^(.{420,497})\s.*$/, "$1 …")
                         .replace(/^(.{499}).*$/, "$1…");

      var image = html.match(	// twitter card image
        /<meta\b(?:\s+name=['"]twitter:image(?::src)?['"]|\s+content=['"](http[^"']+)['"]){2}/i
      );
      if (! image) {
        image = html.match(	// other meta content images
          /<meta\b(?:\s+(?:name|property)=['"][^"']*:image(?::src)?['"]|\s+content=['"](http[^"']+)['"]){2}/i
        );
      }
      if (! image) {
        var re =
          /<meta\b[^>]*\scontent=['"]([^"']+\.(?:jpe?g|png)(?:[?&\/#][^'"]*)?)['"]/i;
        while ( image = re.exec(html) ) {	// other meta content images
          // accept only if what we found wasn't an icon or other exclusion
          if (! image[0].match(/tile|ico(?:\b|[n_0-9])/i) ) { break; }
          image = null;	// reset since an exclusion triggered
        }
      }
      if (! image) {
        image = html.match(	// first linked image
          /<a\b[^>]*\shref=['"]([^"']+\.(?:jpe?g|png)(?:[?&\/#][^'"]*)?)['"]/i
        );
      }
      if (image) { image = image[1]; }

      function getImage(code, ext) {
        var skip = `[^'"]*(?:banner|logo|\\b[0-9]{1,2}px|advert|\\bad[sv]?\\b)`;
        var extra = `(?:[?&\\/#][^'"]*)?`;
        var match = code.match( RegExp(
          `<img\\b[^>]*\\ssrc=['"]((${skip})?[^"']+\\.${ext}${extra})['"]`,
          "i") );
        if (match && !match[2]) { return match[1]; }
        return ""; // not found
      }
      if (! image) { image = getImage(html, "jpe?g"); }
      if (! image) { image = getImage(html, "png"); }

      if (!image.match(/^(?:https?)?:\/\//)) {		// not absolute
        if (0 == image.indexOf("/")) {			// relative to root
          image = href.href.match(/^https?:\/\/[^\/:?#]*/) + image;
        } else {					// fully relative
          image = href.href.replace(/\/[^\/]*$/, "/" + image);
        }
      }

      var body = article.querySelector("div.body");
      if (! image || ! body) { return; }
      image = image.replace(/&amp;/g, "&");

      var img = document.createElement("img");
      img.src = image;

      var thumb = document.createElement("div");
      thumb.setAttribute("onclick", /* syn=js */
        `this.classList.toggle("zoomed")`);
      thumb.className = "gm thumb";
      if (desc) { thumb.title = desc; }
      thumb.appendChild(img);
      thumb_link = href.cloneNode(true);
      if (title) { thumb_link.innerHTML = title; }
      thumb.appendChild( thumb_link );

      body.insertBefore(thumb, body.children[0]);

    }
  });

}); }


// BUG: images w/ widths determined by max-height can have captions from titles
// that are truncated to the max-width rather than the smaller actual width

GM_addStyle(`

  .gm.thumb		{ float:right; text-align:right; cursor:zoom-in; }
  .gm.thumb a		{ display:none; font-size:90%; text-align:center;
  			  width:-moz-min-content; width:min-content;
  			  max-width:33vw; white-space:nowrap; overflow:hidden;
  			  text-overflow:ellipsis; text-overflow:fade(5ex); }
  .gm.thumb img		{ max-width:20vw; max-height:15vh;
  			  border-radius:1ex; border:1px solid transparent }
  .gm.thumb:hover img	{ border-radius:0; border-color:#016765; }
  .gm.thumb.zoomed	{ cursor:zoom-out; }
  .gm.thumb.zoomed img	{ max-width:33vw; max-height:33vh; }
  .gm.thumb.zoomed a	{ display:block; }

`);
