// ==UserScript==
// @name	Slashdot - Usability tweaks
// @description	Minor tweaks plus: render images for user space slashboxes
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	1.2.20250810.0
// @grant	GM_xmlhttpRequest
// @grant	GM.xmlHttpRequest
// @icon	https://slashdot.org/favicon.ico
// @include	https://slashdot.org/*
// @include	https://*.slashdot.org/*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus-dialog.js
// ==/UserScript==

console.log("Beginning Slashdot Usability tweaks");

// Shim for Greasemonkey 4 {{{
if (typeof GM_xmlhttpRequest == 'function') {
  if (typeof GM != 'object') GM = {};
  if (typeof GM.xmlHttpRequest != 'function') {
    GM.xmlHttpRequest = GM_xmlhttpRequest;
  }
}
// end shim for Greasemonkey }}}

// Tweak the CSS {{{
var style = nf.style$(`

  /* allow user comments to have bullets in their bulleted lists */
  #commentlisting li:not(.comment) { list-style:inherit; }

  /* slashboxes should not be fixed to the view, they should scroll */
  aside#slashboxes { position:relative!important; }

  /* for the client-side popularity filter (see below) */
  #sdutPopper { position:absolute; top:1em; right:1em; color:#fff; }
  #sdutPopper > ul { margin:0; }
  #sdutPopper > ul > li:first-child { line-height:40px; }
  #sdutPopup:not(:checked) + ul > li + li { display:none; }
  #sdutPopup + ul > li {
    cursor:pointer; list-style:none; font-family:sdicon;
    width:3em; margin-left:0; text-align:center; }
  #sdutPopup:checked + ul > li + li {
    position:relative; z-index:11; background-color:#016765;
    width:-moz-fit-content; padding:0 1em; }
  #sdutPopup, #sdutPopup + ul > li:hover { background-color:#004d4d!important; }
  #sdutPopup, body[data-sdut-pop="1"] .sdutPop2,
  body[data-sdut-pop="1"] .sdutPop3, body[data-sdut-pop="1"] .sdutPop4,
  body[data-sdut-pop="1"] .sdutPop5, body[data-sdut-pop="1"] .sdutPop6,
  body[data-sdut-pop="1"] .sdutPop7, body[data-sdut-pop="2"] .sdutPop3,
  body[data-sdut-pop="2"] .sdutPop4, body[data-sdut-pop="2"] .sdutPop5,
  body[data-sdut-pop="2"] .sdutPop6, body[data-sdut-pop="2"] .sdutPop7,
  body[data-sdut-pop="3"] .sdutPop4, body[data-sdut-pop="3"] .sdutPop5,
  body[data-sdut-pop="3"] .sdutPop6, body[data-sdut-pop="3"] .sdutPop7,
  body[data-sdut-pop="4"] .sdutPop5, body[data-sdut-pop="4"] .sdutPop6,
  body[data-sdut-pop="4"] .sdutPop7, body[data-sdut-pop="5"] .sdutPop6,
  body[data-sdut-pop="5"] .sdutPop7, body[data-sdut-pop="6"] .sdutPop7
  { display:none!important; }

`);
// end tweaking the CSS `}}}

// Correct broken characters in article & comment text {{{
function onNewArticle(article_text) {
  article_text.innerHTML = fix_broken_chars(article_text.innerHTML);
  if (article_text.title) {
    article_text.title = fix_broken_chars(article_text.title);
  }
}

function fix_broken_chars(text) {
  return text
    // Slashdot uses numeric codes (like &#195;&#174;) but Firefox is smart
    // …except for <title> and title="", thus the first line
    .replace(/&#226;/g, 'â')			// titles escape the â
    .replace(/â--â/g, '—')			// em dash
    .replace(/â\x22/g, '–')			// en dash
    .replace(/(?<=[0-9])Â/g, '°')		// degrees
    .replace(/Ã±/g, 'ñ')			// lower n with tilde
    .replace(/Ã©/g, 'é')			// accented e
    .replace(/Ã/g, 'è') 			// grave e
    .replace(/Ö-/g, '×')			// multiplication sign
    .replace(/è®/g, 'î')			// i circumflex
    .replace(/è-/g, 'Ö')			// capital O with diaeresis
    .replace(/Å\(TM\)/g, 'ř')			// small letter r with caron
    .replace(/â\(TM\)/g, '’')			// right single quote
    .replace(/(?<=^|[\s>])âoe\B/g, '“') 	// left double quote
    .replace(/(?<=\S)â(?=[\s<]|$)/g, '”')	// right double quote
    .replace(/â¦\x22/g, '…')			// horizontal ellipsis
    .replace(/Â(?=½)/g, '')			// half
    .replace(/â(?=[^’]{0,256}’)/g,'‘')		// left single quote
    .replace(/Â(?=[A-Za-z0-9\x22\x27\x28])/g, ' ')	// em-space? -> space
    .replace(/(?<=\w)â(?=\w)/g, '-')		// standard hyphen-dash
} // test [é ’ “ ”] at https://slashdot.org/submission/12509270/
//                 and https://slashdot.org/submission/14807971/
//   test in titles at https://slashdot.org/submission/17225237/
nf.wait$(`head title, article > header > h2,
  article div:is([id^="text-"],[id^="fhbody-"]),
  #comments a[title^="Back to Article"], .commentBody
`, onNewArticle);
// end unicode fix }}}

// Client-side popularity filter (since the site's is not reliable) {{{

// add CSS classes to articles based on their popularity for filtering
let popularity_css = "";
for (let i=1; i<9; i++) {
  if (popularity_css) popularity_css+= ", ";
  popularity_css += "article .pop" + i;
}
function onPop(icon) {
  let pop = icon.className.match(/(?<=\bpop)[0-9]\b/) + "";
  let article = icon.parentElement;
  while (article.nodeName != "ARTICLE") {
    article = article.parentElement;
  }
  article.classList.add("sdutPop" + pop);
}

nf.wait$(popularity_css, onPop);


// filter by popularity only when there are at least three articles
if (document.querySelector(`article + article + article`)) {
  let sdutPopper = document.createElement("div");
  sdutPopper.id = "sdutPopper";
  document.body.appendChild(sdutPopper);
  var sdutPopup = document.createElement("input");
  sdutPopup.type = "checkbox";
  sdutPopup.id = "sdutPopup";
  sdutPopper.appendChild(sdutPopup);
  ul = document.createElement("ul");
  sdutPopper.appendChild(ul);
  var sdutFilter = document.createElement("li");
  sdutFilter.id = "sdutFilter";
  sdutFilter.title = "Filter stories (ROYGBIV, R=red=most popular)";
  sdutFilter.appendChild(document.createTextNode(""));
  ul.appendChild(sdutFilter);
  for (let i=1; i<=8; i++) {
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(""));
    let title = "Filter Firehose to entries rated ";
    if      (i == 1) { li.style.color = "#c00"; title += "red"; }
    else if (i == 2) { li.style.color = "#f93"; title += "orange"; }
    else if (i == 3) { li.style.color = "#ff6"; title += "yellow"; }
    else if (i == 4) { li.style.color = "#0c3"; title += "green"; }
    else if (i == 5) { li.style.color = "#06f"; title += "blue"; }
    else if (i == 6) { li.style.color = "#609"; title += "indigo"; }
    else if (i == 7) { li.style.color = "#306"; title += "violet"; }
    else if (i == 8) { li.style.color = "#000"; title += "black"; }
    li.title = title + " or better";
    if (i == 8) { li.title += " (do not filter)"; }
    li.dataset.sdutFilter = i;
    ul.appendChild(li);
  }
  sdutFilter.onclick = function() {
    sdutPopup.checked = !sdutPopup.checked;
  }
  let levels = sdutPopper.querySelectorAll(`li`);
  for (let l=1; l<levels.length; l++) {
    levels[l].onclick = function() {
      sdutPopup.checked = false;
      sdutFilter.style.color = this.style.color;
      document.body.dataset.sdutPop = this.dataset.sdutFilter;
    }
  }
  // set a default: green or better (one step above the /. site default of blue)
  // TODO: store this as a setting
  document.body.dataset.sdutPop = 4;
  sdutFilter.style.color = "#0c3";
}
// end popularity filter }}}

// Tweaks to the User Space Slashbox {{{

// Render reddit templates and markdown images in the User Space Slashbox
// This does not support numbered footnote style references.
// Examples:
//     {r/funny}    will import the first image from r/funny on Reddit
//
//     ![weather](https://www.theweather.com/wimages/foto114f7f96477a84e5e6831355aeae15c5.png "Weather in San Francisco")
// "weather" is the alt text (only shown when there's an error)
// "https://..." is the image src
// "Weather in San Francisco" is the rollover (title) text
function onBioBox(box) {
  box.classList.add("seen");  // don't repeat this process on this box
  box.innerHTML = box.innerHTML
    .replace(/!\[([^\]"]+)\]\(([^\s)"]+)(?:\s+"([^"]+)")?\)/g,
      /* syn=html */ `<img src="$2" alt="$1" title="$3">`)
    .replace(/\{(r\/[\w-]+)\/?\}/g, /* syn=html */
      '<div class="sut_reddit empty" subreddit="$1"></div>')
    ;

  qa$('.sut_reddit.empty[subreddit]').forEach(elem => {
    let r = elem.getAttribute('subreddit');
    let reddit = 'https://www.reddit.com';
    GM.xmlHttpRequest({ method:'GET', url: reddit + '/' + r,
      /*
      onabort: response => { console.warn("Abort:", response); },
      onerror: response => { console.warn("Error:", response); },
      ontimeout: response => { console.warn("Timeout:", response); },
      */
      onload: response => {
        let post = response?.responseText?.match(
          /\bpermalink="([^"]+)"[^<>]*\bcontent-href="([^"]+\.(?:jpeg|png|webp|gif))"[^<>]*\bpost-title="([^"]+)"/
        );
        if (post) {
          // unescape HTML elements in the title (e.g. `&#39;` -> `'`)
          // ... This *should* be safe given my replacements. What do you think?
          let title = $html('p');
          title.innerHTML = post[3].replace(/</g, '&lt;').replace(/>/g, '&gt;');
          title = title.innerText;

          qa$('.sut_reddit.empty').forEach(elem => {
            elem.classList.remove('empty');
            elem.append($html('p', {},
              $html('b', { text:"Reddit: Latest from " }, 'a',
                { href:reddit + '/' + r, text:r })));
            let a = elem.appendChild($html('a', { href:reddit + post[1] }));
            a.append($html('div', { text:title, class:'reddit-title' }));
            let img = elem.appendChild($html('img', { src:post[2] }));
            let img_popup = new nf.dialog('', { open:false, recenter:2 });
            img.addEventListener('click', event => {
              let rect = img.getBoundingClientRect();
              img_popup.root.style.top = (rect.top - 16) + "px";
              img_popup.root.style.left = rect.left + "px";
              img_popup.open();
            });
            img_popup.append($html('div', { class:'center sut_reddit' },
              $html('a', { href:reddit + post[1], title:title },
                img.cloneNode()
              )
            ));
            img_popup.root.classList.add('sut_reddit_popup');
          });
        }
    }});	// end GM.xmlHttpRequest(reddit.com)
  });		// end forEach(reddit template)
  style.textContent += `
    .sut_reddit img { display:block; max-width:100%; cursor:zoom-in; }
    .nfDialog button.nfDialogClose { color:buttonText!important; }
    .nfDialog.sut_reddit_popup .center { text-align:center; }
    .nfDialog.sut_reddit_popup .sut_reddit img {
      max-height:76vh; display:inline-block; cursor:inherit;
    }
    .sut_reddit .reddit-title {  }
  `;
}
nf.wait$(`#userbio_self-content > ul.menu + p:not(.seen)`, onBioBox);
// end images in User Space Slashbox }}}

// Make the preview button accessible to Alt+Shift+p (just like Wikipedia) {{{
function access_key(on, key) {
  nf.wait$(`span[id^="${on}"] a.btn[onclick]`, b => {
    if (! document.querySelector(`[accesskey="${key}"]`)) { b.accessKey = key; }
  });
}
access_key("preview", "p");
access_key("submit", "s");
access_key("edit", "e");	// Continue Editing
// }}}
