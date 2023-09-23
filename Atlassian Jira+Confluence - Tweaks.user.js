// ==UserScript==
// @name	Atlassian Jira/Confluence - tweaks
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @description	UI tweaks for Atlassian Jira (tickets) and Confluence (wiki)
// @include	https://jira.*
// @include	https://jira-*
// @include	https://confluence.*
// @include	https://confluence-*
// @include	https://wiki.*/display/*/*
// @match	https://*/confluence/display/*/*
// @match	https://*/*/confluence/display/*/*
// @match	https://*/conf/display/*/*
// @match	https://*/*/conf/display/*/*
// @require	https://git.io/waitForKeyElements.js
// @version	0.3.20230824.0
// @grant	none
// ==/UserScript==

/* Tweaks include:
     * Make fixed-width text (inline and code blocks) better:
       * border around inline fixed-width text
       * edit code blocks in fixed width
     * Spell-check comment fields
     * Make clickable anchors for Confluence page sections for easy sharing
     * Add an "expand/collapse all" button for collapsed Confluence content
     * Clone Jira tickets' comment-sorting button to be visible from the bottom
     * "Remember my login" should default to being checked
     * Probably more stuff that hasn't made it to this list
*/

// helpers {{{

function debug(text) { return true; }
//function debug(text) { console.log(text); }
debug("Atlassian Jira/Confluence - Tweaks: started\n" + Date());

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

function main(where=document) { try {

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

    // remove frivolous trailing <br>
    let trailing_br = /<br>[\r\n]{0,2}<\/span>$/;
    if (elem.innerHTML.match(trailing_br)) {
      elem.innerHTML = elem.innerHTML.replace(trailing_br, '</span>');
    }

    let self_link = document.createElement("a");
    let target = elem.id || elem.name;
    if (target == "comments-section-title") { target = "comments-section"; }
    self_link.href = "#" + target;
    self_link.classList.add("self-link");
    elem.classList.add("heading");
    elem.appendChild(self_link);
  }

  // these code items are empty or have syntax highlighting & should be ignored
  let code = 'code:not(' + [
    ":empty", ".color1", ".color2", ".color3", ".comments", ".constants",
    ".functions", ".keyword", ".plain", ".script", ".spaces", ".string",
    ".preprocessor", ".value", ".variable"
  ].join("):not(") + ")";

  addStyle(/* syn=css */ `

    /* borders for inline monospace font elements */
    ${ sel(jira, 'tt:not(:empty)' )}, ${ sel(wiki, code) } {
      padding:0 0.2em; margin:0 0.2em;
      /* code block borders are #bbb with radius=5px */
      border:1px dashed #bbbb; border-radius:3px;
    }
    /* I don't remember what this one is for, but it was probably
     * an older attempt at overriding the above for syntax highlighting,
     * for which I now have a better solution. Disabled for now.
    ${ sel(both, 'div.codeContent ' + code) } {
      padding:0; margin:0; background:inherit;
      border:none!important; border-radius:inherit;
    }
    /**/

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

    /* some odd Firefox bug makes the default monospace not work right */
    body pre, body pre *, code, kbd, td.code div	{
      font-family:Panic Sans,DejaVu Sans Mono,Consolas,ui-monospace!important;
    }

    /* hovering shouldn't move the text! *(appears fixed)/
    .issue-data-block:not(:hover) {
      border-left:5px solid transparent;
      padding-left:5px;
    } */

    /* gray the weekends in calendar month views */
    .plugin-calendar .fc .fc-view-month .fc-sun,
    .plugin-calendar .fc .fc-view-month .fc-sat {
      background-color:#f4f5f7;
    }
    .plugin-calendar .fc .fc-view-month .fc-sun .fc-day-number,
    .plugin-calendar .fc .fc-view-month .fc-sat .fc-day-number {
      color:#999;
    }

  `, where); // fix for wandering ` & syntax highlighting

} catch(e) { debug("error:\n" + e); } }

/* disabled remnant of older version, not sure if I meant to remove it
var content =
  q$(`.user-content-block, .action-body, #issue-description, #main-content`, 1);

for (let c=0; c < content.length; c++) {
  content[c].innerHTML = content[c].innerHTML

    // remove empty inline tags that might interfere with our CSS bg/borders
    .replace(/<(tt|code)\b\s*[^>]*>\s+<\/\1>/g, "")

    // connect contiguous tags that would interrupt our CSS bg/borders
    .replace(/(<(tt|code)\b\s*[^>]*>)([^<]+)<\/\2>\1/, "$1$3");
}
*/

main(document);

// for pop-ups: edit code blocks in fixed-width (the way it'll be displayed)
waitForKeyElements(`iframe`, function(elem) {
  debug("Atlassian Jira/Confluence - Tweaks: loaded an iframe\n" + Date());
  elem.removeAttribute("wfke_found"); // cheat wfke's been_there, use our own
  for (let f=0; f < frames.length; f++) {
    if (!frames[f].document.body.getAttribute("been_there")) {
      /*
      addStyle(`

        body pre.external-macro, code, kbd	{ font-family:monospace; }

      `, frames[f].document);
      */
      frames[f].document.body.setAttribute("been_there", 1);
      main(frames[f].document);
    }
  }
});

// wtf, Atlassian. Never use !important in production. Traverse your own CSS.
// It's MUCH worse to use it in a style attribute because it can't be changed.
// (Also, setting the font within a `pre` is really weird and unnecessary)
waitForKeyElements(`pre > span[style]`, function(elem) {
  elem.style.removeProperty("font-family");
});

// Allow expanding or collapsing everything (source and expands) {{{
let ajs_menu = q$(".ajs-menu-bar");
if (ajs_menu && q$(".expand-control")) { // menu && things to expand
  let expander_item = document.createElement("li");
  expander_item.classList.add("ajs-button", "normal");
  let expand = document.createElement("a");
  expand.classList.add("aui-button", "aui-button-subtle", "expand");
  expand.href = "#";
  expand.rel = "nofollow";
  expand.title = "Expand all source and expand items";
  expand.textContent = "Expand";
  expand.addEventListener("click", () => {
    if (expand.classList.contains("collapse")) {	// collapse
      document.querySelectorAll('.expand-control').forEach(e => {
        if (e.getAttribute("aria-expanded") == "true"
          || e.querySelector(".expanded")) { e.click() }
      });
      expand.classList.remove("collapse");
      expand.textContent = "Expand";
    } else {	// expand
      expand.classList.add("collapse");
      document.querySelectorAll('.expand-control:not([aria-expanded="true"])')
        .forEach(e => { if (!e.querySelector(".expanded")) { e.click() } });
      expand.textContent = "Collapse";
    }
    expand.title = expand.title.replace(/^\w+/, expand.textContent);
  });
  expander_item.appendChild(expand);
  ajs_menu.insertBefore(expander_item,
    ajs_menu.children[ajs_menu.children.length-1]);
}	// }}}

// Remind the user how comments are sorted at the bottom of the comments {{{
var comments = q$("#activitymodule");
if (comments) {
  waitForKeyElements(`#sort-button`, sort => {
    var sort2 = sort.cloneNode(true);
    sort2.id = "sort-button2";
    sort2.style.float = "right";
    // copy CSS from #sort-button and other inheritances
    sort2.style.display = "flex";
    sort2.style.alignItems = "center";
    sort2.style.fontWeight = "600";
    // sync sort2's content with sort1 after it is updated from a click (0.3s)
    function sync_sorters() {
      setTimeout(() => { sort2.innerHTML = sort.innerHTML; }, 300);
    }
    sort.addEventListener("click", () => { sync_sorters() });
    // apparently sync_sorters isn't redundant and is needed? Harmless otherwise
    sort2.addEventListener("click", () => { sort.click(); sync_sorters() });
    comments.appendChild(sort2);
  });
}	// }}}

// Check "remember my login" by default {{{
// If you share your browser profile, you probably don't tweak with userscripts.
// Apparently, Confluence uses 'os_cookie' to name that checkbox. WTF.
let check = 'input[type="checkbox"]';
let remember_me = q$(`${check}#login-form-remember-me, ${check}#os_cookie`);
if (remember_me) { remember_me.checked = true; }
// }}}
