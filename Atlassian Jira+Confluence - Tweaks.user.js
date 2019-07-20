// ==UserScript==
// @name	Atlassian Jira/Confluence - tweaks
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @description	UI tweaks for Atlassian Jira (tickets) and Confluence (wiki)
// @include	https://jira.*
// @include	https://confluence.*
// @require	https://git.io/waitForKeyElements.js
// @version	0.1.2.20190720
// @grant	none
// ==/UserScript==

/* Tweaks include:
     * Make fixed-width text (inline and code blocks) better:
       * border around inline fixed-width text
       * edit code blocks in fixed width
     * Spell-check comment fields
     * Make clickable anchors for Confluence page sections for easy sharing
     * Probably more stuff that hasn't made it to this list
*/

// helpers {{{

// Note, this very importantly takes a document argument for each iframe
function addStyle(css, doc=document) {
  let style = doc.createElement("style");
  style.type = "text/css";
  style.textContent = css;
  doc.head.appendChild(style);
  return style;
}

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

// lots of different potential parents for given selector;
// parents is an array by reference, args is an array of the remaining arguments
function sel(parents, ...args) {
  let output = "";
  while (args.length) {
    let child = args.shift();

    // iterate through lists (prepend their items) when given them
    if (child.indexOf(",") != -1) {
      // don't unshift this, that prepends the array rather than its elements
      args = child.split(/\s*,\s*/).concat(args);
      continue;
    }

    for (let j = 0; j < parents.length; j++) {
      if (output) output += ", ";
      output += parents[j] + " " + child;
    }
  }
  return output;
}

// end helpers }}}

var link_icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAACxMAAAsTAQCanBgAAABgUExURUxpcZKSknFxcYCAgKGhoWVlZZubm319fVdXV4aGhoiIiJCQkG5ublxcXHJycpKSkmVlZd3d3YiIiFxcXKGhoVNTU5ubm+bm5vX19e/v7+Pj4+vr6+3t7bGxsdfX12tra+Tj6rUAAAAOdFJOUwCWls+Wlpb+lpbzz8/UUcJgcwAAAHxJREFUGNNNzYkOwiAQBFBqaReqLvehFf3/vxSbjGWyIdkJmyfEPzJGKYasuda8nvtkHqbPhF37l9e/BwXtJkpNjlBwyzXzky8o5n5PxS7wrtvumwsKXqNCt5QUPOrH8+CxdTYOHoUSPoP35nsKg7f0/xbeERUcPDTwjnwBI3oH02ImngkAAAAASUVORK5CYII="; // {{{ this is a vim fold }}}

var jira = [ '#description-val .user-content-block', '.action-body' ];
var wiki = [ '.wiki-content', '#comments-section' ];
var both = jira.concat(wiki);
var syn = ['.syntaxhighlighter.sh-eclipse', '.syntaxhighlighter.sh-confluence'];

function main(where=document) {

  // spell-check edit comment fields
  let edit_comments = q$(`input[name="versionComment"]`, where, 1);
  for (let c = 0; c < edit_comments; c++) {
    edit_comments[c].spellcheck = true;
  }

  let headings = "";
  for (let h = 1; h < 8; h++) {
    if (h > 1) headings += ", ";
    headings += `h${h}[id], h${h}[name], a[name] + h${h}, h${h} + a[name]`;
  }

  let anchors = q$( sel(both, headings), where, 1 );
  for (let a = 0; a < anchors.length; a++) {
    let elem = anchors[a];
    if (elem.nodeName == "A") { // deal with <h1>blah</h1><a name="this">
      elem = elem.previousElementSibling;
    }
    if (! elem.innerText.match(/\S/) ) { continue; } // skip empty headings

    let self_link = document.createElement("a");
    let target = elem.id || elem.name;
    if (target == "comments-section-title") { target = "comments-section"; }
    self_link.href = "#" + target;
    self_link.classList.add("self-link");
    elem.classList.add("heading");
    elem.appendChild(self_link);
  }

  addStyle(/* syn=css */ `

    /* borders for inline monospace font elements */
    ${ sel(jira, 'tt:not(:empty)' )}, ${ sel(wiki, 'code:not(:empty)') } {
      padding:0 0.2em; margin:0 0.2em;
      /* code block borders are #bbb with radius=5px */
      border:1px dashed #bbbb; border-radius:3px;
    }
    /* I don't remember what this one is for... */
    ${ sel(both, 'div.codeContent code:not(:empty)') } {
      padding:0; margin:0; background:inherit;
      border:none!important; border-radius:inherit;
    }

    ${ sel(jira, 'a[href]') }				{ color:#06b; }
    ${ sel(jira, 'a[href]:visited') }			{ color:#60b; }
    ${ sel(jira, 'a[href]:hover', 'a[href]:active') }	{ color:#00f; }

    /* linkified anchors */
    ${ sel(both,'.heading:not(:hover) > a.self-link') }	{ display:none; }
    ${ sel(both, '.heading > a.self-link::after') } {
      margin-left:0.5ex; opacity:0.667; position:absolute;
      content:url(${link_icon});
    }

    /* tweaks to colors in syntax highlighter for code blocks */
    ${ sel(syn, 'code.comments') }		{ color:#aaa; }
    ${ sel(syn, 'code.comments a:link') } 	{ color:#aaf; }
    ${ sel(syn, 'code.comments a:visited') }	{ color:#daf; }
    ${ sel(syn, 'code.comments a:active') }	{ color:#00f; }

    body#tinymce pre.external-macro		{ font-family:monospace; }

  `, where); // fix for wandering ` & syntax highlighting
}

var content =
  q$(`.user-content-block, .action-body, #issue-description, #main-content`, 1);

for (let c=0; c < content.length; c++) {
  content[c].innerHTML = content[c].innerHTML

    // remove empty inline tags that might interfere with our CSS bg/borders
    .replace(/<(tt|code)\b\s*[^>]*>\s+<\/\1>/g, "")

    // connect contiguous tags that would interrupt our CSS bg/borders
    .replace(/(<(tt|code)\b\s*[^>]*>)([^<]+)<\/\2>\1/, "$1$3");
}

main(document);

// for pop-ups: edit code blocks in fixed-width (the way it'll be displayed)
waitForKeyElements(`iframe`, function(elem) {
  elem.removeAttribute("wfke_found"); // cheat wfke's been_there, use our own
  for (let f=0; f < frames.length; f++) {
    if (!frames[f].document.body.getAttribute("been_there")) {
      addStyle(/* syn=css */ `

        body#tinymce pre.external-macro		{ font-family:monospace; }

      `, frames[f].document);
      frames[f].document.body.setAttribute("been_there", 1);
    }
  }
});
