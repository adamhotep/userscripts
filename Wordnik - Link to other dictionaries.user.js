// ==UserScript==
// @name	Wordnik - Link to other dictionaries
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	0.6.20250123.0
// @include	https://www.wordnik.com/words/*
// @require	https://git.io/waitForKeyElements.js
// @grant	GM_addStyle
// @grant	GM_xmlhttpRequest
// @grant	GM.xmlHttpRequest
// ==/UserScript==

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

// linkify cross-references (why doesn't Wordnik do this?)
waitForKeyElements('xref', function(xref) {
  let link = document.createElement("a");
  link.textContent = xref.innerText;
  xref.textContent = "";
  xref.appendChild(link);
  link.href = "/words/" + link.textContent;
});

var term = location.pathname.substr(7); // remove the "/words/" prefix
term = term.replace(/\/$/, '');
var extra = document.createElement("div");

Node.prototype.prependChild = function(elem) {
  if (this.childElementCount == 0) { return this.appendChild(elem); }
  return this.insertBefore(elem, this.firstElementChild);
}

function addSection(header) {
  let section = document.createElement("ul");
  section.classList.add(header.replace(/\W+/g, "_"));
  let item = document.createElement("li");
  item.append(header);
  item.classList.add("h");
  section.appendChild(item);
  extra.appendChild(section);
  return section;
}

function addLink(section, href, text, title="") {
  let item = document.createElement("li");
  let link = document.createElement("a");
  link.href = href;
  if (title) { link.title = title; }
  link.append(text);
  item.appendChild(link);
  return section.appendChild(item);
}


//var up = document.querySelector(".word_page");
var up = document.querySelector(".module-2columnRight");
if (term && up) {

  up.prependChild(extra);

  // close button
  let checker = document.createElement("input");
  checker.type = "checkbox";
  checker.checked = false;
  checker.id = "wnkxtra_hidden";
  up.insertBefore(checker, extra);
  let x = document.createElement("label");
  x.id = "wnkxtra_x";
  x.htmlFor = checker.id;
  x.title = "shrink/grow";
  extra.prependChild(x);

  extra.id = "wnkxtra";

  let dicts = addSection("More Dictionaries");

  /*
  addLink(dicts,
    "https://www.wordnik.com/words/" + term,
    "Wordnik",
    "American Heritage 4e, Century Dictionary, GNU Collaborative Int'l, Roget's II 3e, Wordnet 3.0, Wiktionary"
  );
  */
  addLink(dicts,
    "https://en.wiktionary.org/wiki/Special:Search?go=Go&search=" + term,
    "Wiktionary", "User-driven general dictionary, sister to Wikipedia"
  );
  addLink(dicts,
    "https://www.urbandictionary.com/define.php?term=" + term,
    "Urban Dictionary", "User-driven slang dictionary, can be NSFW"
  );
  addLink(dicts,
    "https://www.collinsdictionary.com/dictionary/english/" + term,
    "Collins",
    "Unabridged Collins, Official Scrabble, frequencies via Google Ngrams"
  );
  addLink(dicts,
    "https://www.dictionary.com/browse/" + term,
    "Dictionary.com", "Random House Unabridged, Collins, American Heritage, +"
  );
  addLink(dicts,
    "https://www.merriam-webster.com/dictionary/" + term,
    "Merriam-Webster"
  );

  let thesrs = addSection("Thesauruses");

  addLink(thesrs,
    "https://www.merriam-webster.com/thesaurus/" + term,
    "Merriam-Webster", "Roget's Thesaurus?"
  );
  addLink(thesrs,
    "http://www.moby-thesaurus.org/search?q=" + term,
    "Moby Thesaurus", "Perhaps the biggest thesaurus out there"
  );
  addLink(thesrs,
    `https://www.wordnik.com/words/${term}#related`,
    "Wordnik",
    "American Heritage 4e, Century, GNU Collaborative Int'l, Roget's II 3e, Wordnet 3.0, Wiktionary"
  );
  addLink(thesrs,
    "http://words.bighugelabs.com/" + term,
    "Big Huge Thesaurus", "Princeton Wordnet, CMU Pronouncing Dictionary"
  );
  addLink(thesrs,
    "https://www.thesaurus.com/browse/" + term,
    "Thesaurus.com", "Random House Unabridged, Collins, American Heritage, +"
  );
  addLink(thesrs,
    "https://thesaurus.yourdictionary.com/" + term,
    "YourDictionary", "YourDictionary Thesaurus"
  );

  let others = addSection("Other");

  let wikipedia = "https://en.wikipedia.org/wiki/Special:Search?go=Go&search=";
  addLink(others,
    wikipedia + term, "Wikipedia", "User-driven general encyclopedia"
  );

  let disam = " (disambiguation)";
  addLink(others,
    wikipedia + term + disam,
    "Wikipedia" + disam, "User-driven general encyclopedia"
  );

  addLink(others,
    "https://books.google.com/ngrams/graph?content=" + term
    + "&case_insensitive=on&year_start=1900&year_end=2999"
    + "&corpus=15&smoothing=3",
    "Google Ngrams", "Popularity of this word in printed books"
  );

  addLink(others,
    "https://duckduckgo.com/?ko=s&kp=-1&kw=w&kd=-1&ia=news&iax=1&q=" + term,
    "DuckDuckGo News"
  );
  addLink(others,
    "https://duckduckgo.com/?ko=s&kp=-1&kw=w&kd=-1&ia=web&iax=1&q=" + term,
    "DuckDuckGo Web"
  );
  addLink(others,
    "https://duckduckgo.com/?ko=s&kp=-1&kw=w&kd=-1&ia=images&iax=1&q=" + term,
    "DuckDuckGo Images"
  );

  img_link = addLink(others,
    "https://www.startpage.com/do/search?cat=pics&query=" + term,
    "Google Images"
  ).childNodes[0];
  img_link.id = "img_link";
  img_link.title = "Google Images via Startpage.com";
  GM_xmlhttpRequest({
    method: 'GET',
    url: img_link.href,
    onload: function(response) {
      let dom = response.responseXML;
      // https://wiki.greasespot.net/index.php?title=GM.xmlHttpRequest#GET_request
      if (!dom) {
        dom = new DOMParser()
          .parseFromString(response.responseText, "text/html");
      }
      dom = dom.body;
      let img = dom.querySelector(`img.image-thumbnail[src]`);
      if (img) {
        let new_img = document.createElement("img");
        new_img.loading = "lazy";
        new_img.title = "First Google Image hit (anonymized by Startpage.com)";
        new_img.src = img.src.replace(location.host, "www.startpage.com");
        new_img.classList.add("startpage_image");
        img_link.appendChild(new_img);
      }
    }
  });

}

var css = document.createElement("style");
css.type = "text/css";
css.textContent = /* syn=css */ `

.content		{ padding-left:7em; }
#wnkxtra_hidden 	{ display:none; }
#wnkxtra_x { float:right; border:1px solid light-dark(#bbb, #444);
  color:light-dark(#aaa, #666); border-radius:1em; width:1.2em;
  margin:-.15ex .3ex 0 0; text-align:center; cursor:pointer; }
#wnkxtra_hidden:checked + #wnkxtra { width:1em; max-height:1.2em;
  transition:max-height .2s ease-out, width .5s ease-out; }
#wnkxtra_hidden + #wnkxtra #wnkxtra_x:after		{ content: "−"; }
#wnkxtra_hidden:checked + #wnkxtra #wnkxtra_x:after	{ content: "+"; }
#wnkxtra { float:right; width:100%; color:light-dark(#777, #aaa);
  background:light-dark(#fff8, #0008); border:1px solid light-dark(#eee, #333);
  border-radius:1ex; margin:3em 0 0 .5ex; padding:1ex 1ex 1ex 2ex;
  max-height:300vh; overflow:hidden;
  transition:max-height .5s ease-in, width .2s ease-in; }
#wnkxtra ul			{ clear:right; float:left; width:50%; }
#wnkxtra ul.Other		{ clear:both; width:100%; }
#wnkxtra li			{ list-style-type:none; line-height:1em; }
#wnkxtra li.h			{ font-weight:bold; margin:3ex 0 0 -1ex; }
#wnkxtra li:not(.h)::before	{ content:"🠞"; padding-right:.2em; }
#wnkxtra a			{ text-decoration:none; }
#wnkxtra a:hover 		{ text-decoration:underline; }
#wnkxtra .startpage_image	{ display:block; margin-top:3px; }
#wnkxtra .startpage_image:not(:hover)	{ max-width:100%; }
#wnkxtra + *			{ clear:right; }
xref > a			{ color:light-dark(#049, #adf) }

`;
document.head.appendChild(css);
