// ==UserScript==
// @name	Atlassian Jira+Confluence - Tweaks
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @description	UI tweaks for Atlassian Jira (tickets) and Confluence (wiki)
// @include	https://jira.*
// @include	https://jira-*
// @include	https://confluence.*
// @include	https://confluence-*
// @include	https://wiki.*/display/*/*
// @include	https://wiki.*/pages/viewpage.action?*
// @match	https://*/confluence/display/*/*
// @match	https://*/confluence/pages/viewpage.action?*
// @match	https://*/*/confluence/display/*/*
// @match	https://*/*/confluence/pages/viewpage.action?*
// @match	https://*/conf/display/*/*
// @match	https://*/conf/pages/viewpage.action?*
// @match	https://*/*/conf/display/*/*
// @match	https://*/*/conf/pages/viewpage.action?*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @version	0.5.20241103.0
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
     * Auto-click "log in" when on a stub page that needs you to log in
     * Gray out weekends in calendar views
     * Pre-populate Confluence's "Site Search" field given "Page Not Found"
     * Auto-collapse *jira-integration comments
     * Remove unnecessary junk in links to comments
     * Fixed some syntax highlighting bugs
     * Probably more stuff that hasn't made it to this list
*/

nf.debug("started");

var jira = ':is(#description-val, .user-content-block, .action-body)';
var wiki = ':is(.wiki-content, #comments-section)';
var both = jira.substr(0, jira.length - 1) + ", " + wiki.substr(4);
// these code items are empty or have syntax highlighting & should be ignored
var code = 'code:not(:is(:empty, .color1, .color2, .color3, .comments, '
         + '.constants, .functions, .keyword, .number, .plain, .script, '
         + '.spaces, .string, .preprocessor, .value, .variable))';

var syn_light = '.syntaxhighlighter:is(.sh-eclipse, .sh-confluence)';

function main(where=document) { try {

  // spell-check edit comment fields
  let edit_comments = q$(`input[name="versionComment"]`, where, 1);
  for (let c = 0; c < edit_comments; c++) {
    edit_comments[c].spellcheck = true;
  }


  nf.style$(`

    /* borders for inline monospace font elements */
    ${jira} tt:not(:empty), ${wiki} ${code} {
      padding:0 0.2em; margin:0 0.2em;
      /* code block borders are #bbb with radius=5px */
      border:1px dashed #bbbb; border-radius:3px;
    }
    /* I don't remember what this one is for, but it was probably
     * an older attempt at overriding the above for syntax highlighting,
     * for which I now have a better solution. Disabled for now.
    ${both} div.codeContent ${code} {
      padding:0; margin:0; background:inherit;
      border:none!important; border-radius:inherit;
    }
    /**/

    ${jira} a[href]			{ color:#06b; }
    ${jira} a[href]:visited		{ color:#60b; }
    ${jira} a[href]:is(:active, :hover) { color:#00f; }

    /* linkified section anchors */
    ${both} .heading:not(:hover) > a.self-link	{ display:none; }
    ${both} .heading > a.self-link::after {
      margin-left:0.5ex; opacity:0.667; position:absolute; content:"\\1f517";
    }

    /* tweaks to colors in syntax highlighter for code blocks */
    .syntaxhighlighter a:link:not(:hover) {
      color:inherit!important; filter:contrast(.5) brightness(1.5);
    }
    ${syn_light} code.comments				{ color:#aaa!important }
    ${syn_light} code.comments a:link			{ color:#aaf!important }
    ${syn_light} code.comments a:visited		{ color:#daf!important }
    ${syn_light} code.comments a:is(:active, :hover)	{ color:#00f!important }
    .syntaxhighlighter.sh-rdark code.number		{ color:#090; }

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

    /* The Symbol picker is clipped */
    #insert-char-dialog { width:640px!important; }
    .aui-dialog .dialog-panel-body { padding-top:0; padding-bottom:0; }
    iframe#content_insert-char-dialog { height:calc(100% + 1ex); }
    table#charmap-picker { border-spacing:0; }
    #charmap-picker, #charmap-picker #charmap-view { padding:0; }

  `, where); // fix for wandering ` & syntax highlighting

} catch(e) { nf.debug("error:\n%o", e); } }

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

nf.debug("main is done");

// Section anchors
var heading = ':is(h1,h2,h3,h4,h5,h6)';
var section = `${heading}:is([id], [name], + a[name]), a[name] + ${heading}`;
nf.wait$(section, elem => {
  if (elem.nodeName == "A") {	// deal with <h1>blah</h1><a name="this">
    elem = elem.previousElementSibling;
  }
  if (! elem.innerText.match(/\S/) ) { return; }	// skip empty headings

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
  nf.debug("found section", elem, "\n", self_link);
});

// for pop-ups: edit code blocks in fixed-width (the way it'll be displayed) {{{
nf.wait$(`iframe`, elem => {
  nf.debug("loaded an iframe");
  // TODO: update to nf.wait$() logic rather than my older wfke logic
  elem.removeAttribute("wfke_found"); // cheat wfke's been_there, use our own
  for (let f=0; f < frames.length; f++) {
    if (!frames[f].document.body.getAttribute("been_there")) {
      /*
      nf.style$(`

        body pre.external-macro, code, kbd	{ font-family:monospace; }

      `, frames[f].document);
      */
      frames[f].document.body.setAttribute("been_there", 1);
      main(frames[f].document);
    }
  }
});	// }}}

// Remove unnecessary junk in links to comments {{{
var comm_link_junk = '&page=com.atlassian.jira.plugin.system.issuetabpanels:'
                   + 'comment-tabpanel#comment';
nf.wait$(`a.comment-created-date-link[href*="${comm_link_junk}"]`, comment => {
    comment.href = comment.href.replace(comm_link_junk, "#comment");
});	// }}}

// Auto-collapse integration comments {{{
// TODO if I'm sufficiently ambitious: add a button that lets the user
// toggle this rather than hard-coding the username (or a part of it as we do)
nf.wait$(
  // :has() is beautiful. No more e.parentElement.nextElementSibling!
  `.verbose button:has(+ div a.user-hover[rel$="jira-integration"])`,
  expander => { expander.click(); nf.debug("collapsed:\n%o", expander); }
);	// }}}

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
  nf.wait$(`#sort-button`, sort => {
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

// Login assistance {{{

// "Remember my login"
// If you share your browser profile, you probably don't tweak with userscripts.
// Apparently, Confluence uses 'os_cookie' to name that checkbox. WTF.
let check = 'input[type="checkbox"]';
let remember_me = q$(`${check}#login-form-remember-me, ${check}#os_cookie`);
if (remember_me) { remember_me.checked = true; }

// "You are not logged in ... first log in" -> click that link
if (login = q$('.aui-message-warning a.lnk[href^="/login.jsp"]')) {
  login.click();
}
// }}}

// Atlassian sucks at CSS. Clean up what we can't just override. {{{
// wtf, Atlassian. Never use !important in production. Fix your own CSS.
// It's MUCH worse to use it in a style attribute because it can't be changed.
// (Also, setting the font within a `pre` is really weird and unnecessary)
nf.wait$(`pre > span[style]`, elem => {
  elem.style.removeProperty("font-family");
});	// }}}

// Page Not Found should search for the page you tried to visit {{{
if (location.pathname.includes("/display/")
&& document.title.indexOf("Page Not Found - ") == 0) {
  let search = q$('#searchfield');
  if (search && search.value == "") {
    search.value = location.pathname.replace(/.*\/display\/[^\/]+[\/]/, "");
  }
}
// }}}

// fix links in code blocks that wrongly incorporate a trailing apostrophe {{{
nf.wait$(`code a[href$="'"]`, link => {
  if (link?.previousSibling?.textContent == "'") {
    link.href = link.href.replace(/(?:%27|\x27)$/, "");
    link.innerHTML = link.innerHTML.replace(/\x27(?=$|<\/)/g, "");
    nf.insertAfter($txt("'"), link);
  }
});	// }}}

nf.debug("done");
