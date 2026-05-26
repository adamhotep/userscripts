// ==UserScript==
// @name	Web Storage Import-Export
// @namespace	https://github.com/adamhotep/userscripts
// @description	Extract or replace any site's localStorage
// @icon	data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:26px'><text x='15%' y='75%'>💾</text></svg>
// @include	*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus-dialog.js
// @grant	GM.registerMenuCommand
// @grant	GM.info
// @grant	GM.setClipboard
// @author	Adam Katz
// @version	0.1.20260525.3
// @license	GPL
// ==/UserScript==

const license = `Copyright (C) 2026+ by Adam Katz, Licensed under the GPL 3+

This program is free software: you can redistribute it and/or modify it
under the terms of version 3 of the GNU General Public License as published
by the Free Software Foundation. This program is distributed in the hope
that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
included LICENSE file or else https://www.gnu.org/licenses for more details.

🍺 Beerware: If you think this is worth it, you are welcome to buy me a drink.`;

const version = GM?.info?.script?.version;	// fetch from @version metadata

const help = /* syn=markdown */ `

This is a very simple userscript. It presents the current site’s Web Storage
from \`JSON.stringify(localStorage)\` and lets you copy or edit and save it.

### How to use

Click the \`localStorage\` tab. You will see an editable text box
containing a string representing this site's Web Storage in JSON format.
Below that, there are four buttons:

<ol>
* Reload: Reset the text box to the site's web storage (losing any changes)
* Empty: Clear the text box. Hit \`Save\` to then clear the web storage
* Copy: Put the contents of the text box into your clipboard
* Write: Wipe this site's web storage and replace it with the text box's content
</ol>

Install this userscript on multiple browsers. Visit the same web host with each
browser. With the browser that has the localStorage you want to export,
\`Copy\` it. With the browser you want to migrate to, \`Clear\` any existing
storage, paste the content copied from the other browser,
and \`Write\` it to the new browser.`;

const about = /* syn=markdown */ `

**Web Storage Import/Export** ${version}\\
A part of [Adamhotep’s Userscripts](https://github.com/adamhotep/userscripts).

${license}`;

// function $markdown(text): A preview of my ~upcoming nofus-markdown code {{{
const $markdown = (text) => {
  let p = $html('p', { class:'pseudo-markdown' });
  const linkout = '<a href="$1">$1</a>';
  const strongem = /((?<=^|[ \t])\*+|\*+\b)(.*?)(?:\b\1|\1(?!\S))/g;
  p.innerHTML = text
    .replace(/^ ?\*\s/mg,             '<li>')		  // margin-left:2em
    .replace(/^ ?(?:  |\t)\*\s/mg,    '<li class="in1">') // margin-left:4em
    .replace(/^ ?(?:  |\t){2}\*\s/mg, '<li class="in2">') // margin-left:6em
    .replace(/^ ?(?:  |\t){3}\*\s/mg, '<li class="in3">') // margin-left:8em
    .replace(/\*\*(\b.*?|.*?\b)\*\*/mg, '<strong>$1</strong>')
    .replace(/^(#{1,6})\s*(.*)\s*(?:\1\s*)?$/mg, (all, heading, text) => {
      return `<h${heading.length}>${text}</h${heading.length}>`;
    })
    .replace(/\[\b((?:https?:\/\/|www\.)[^\[\]<>"'`\s]+)\]/g, linkout)
    .replace( /<\b((?:https?:\/\/|www\.)[^\[\]<>"'`\s]+)>/g, linkout)
    .replace(/(?<!\])\(\b((?:https?:\/\/|www\.)[^\[\]<>"'`\s]+)\)/g, linkout)
    .replace(/(?<=\s|^)\b((?:https?:\/\/|www\.)[^\[\]<>"'`\s]+)(?=$|[\s.!?,])/g,
      linkout)
    .replace(nf.regex(`
      \\[ ( [^<>\\[\\]]+ ) \\]
      \\( ( http [^\\s()\\"]+
        (?: \\( [^()]* \\) [^\\s()\\"]* )*
      )(?:\\s+\\"([^\\"]+)\\")?\\)
    `, 'gx'), (all, text, target, title = "") => {
      if (title != "") title = ` title="${title}"`;
      return `<a href="${target}"${title}>${text}</a>`;
    })
    .replace(strongem, (all, asterisks, text) => {
      if (asterisks.length == 1) {
        return `<em>${text.replace(strongem, "<strong>$2</strong>")}</em>`;
      } else if (asterisks.length % 2 == 0) {
        return `<strong>${text.replace(strongem, "<em>$2</em>")}</strong>`;
      }
      return `<strong><em>${text}</em></strong>`;
    })
    .replace(/((?<=^|[ \t])`+|`+\b)(.*?)(?:\b\1|\1(?!\S))/g,
      (all, ticks, text) => {
        // a simple trick to escape HTML in this inline code block
        return `<code>${$html('pre', { text:text }).innerHTML}</code>`;
      })
    .replace(/(?<=[^>])\n\n/g, '<br><br>') // an end-tag prevents a line break
    .replace(/(?<!\\)\\\n/g, '<br>')	// a trailing backslash is a line break
  ;
  return p;
}

const md = '.nfDialog .pseudo-markdown';
nf.style$(`/* Markdown CSS { */
  /* Order matters! Don't consolidate ':is(ul, ol)' and ':is(ul, ol) li.in1' */
  ${md} br + :is(ul,ol,h1,h2,h3,h4,h5,h6)	{ margin-top:0; }
  ${md} :is(ul, ol)		{ margin-left:0; padding-left:2em; }
  ${md} li			{ margin-left:2em; }
  ${md} :is(ul, ol) li		{ margin-left:0; }
  ${md} :is(li.in3, ul li.in4)	{ margin-left:8em; }
  ${md} :is(li.in2, ul li.in3)	{ margin-left:6em; }
  ${md} :is(li.in1, ul li.in2)	{ margin-left:4em; }
  ${md} :is(ul, ol) li.in1	{ margin-left:2em; }
  ${md} code { border-radius:1px; padding:0 0.3ex; font-size:99%;
    border:1px dashed light-dark(#0404, #efe4); color:light-dark(#040, #dfd);
    background-color:light-dark(#0101, #0204);
  }
/* End Markdown CSS } */
`);
// end nofus-markdown code }}}

nf.style$(`/* Web Storage Import/Export */
  .center, dialog#ws_inout .center { text-align:center; }
  dialog#ws_inout .blue { color:light-dark(#008, #88f); }
  dialog#ws_inout #textbox { width:98%; height:50vh; display:inline-block; }
  dialog#ws_inout #button_bar { text-align:right; padding-top:1ex; }
  dialog#ws_inout #button_bar button { margin-right:1ex; padding:0.5ex 1ex; }

  @keyframes flash { 50% { background:light-dark(#bbb, #444); } }
  dialog#ws_inout .flash { animation:flash 0.3s linear 0s 1; }
`);

let inout, textbox, reload;

const flash = (elem) => {
  if (elem.classList.contains("flash")) return;
  elem.classList.add("flash");
  nf.sleep(600, () => { elem.classList.remove("flash") });
}

const make_menu = () => {
  inout = new nf.dialog("Web Storage Import/Export", { id:"ws_inout" });
  let storage_tab = inout.tab("localStorage");
  storage_tab.append($html('h3', { text:"Persistent Web Storage for " },
    $html('span.blue', { text:location.protocol + '//' + location.hostname })));
  storage_tab.append($html('div.center', textbox = $html('textarea#textbox')));
  let button_bar = storage_tab.appendChild($html('div#button_bar'));

  let $button = (label, action) => {
    let b = button_bar.appendChild($html('button',
      { type:'button', text:label }));
    b.addEventListener('click', action);
    return b;
  }

  reload = $button("Reload", ev => {
    textbox.value = JSON.stringify(localStorage);
    flash(textbox);
  });
  $button("Empty", ev => { textbox.value = ''; flash(q$('#write')); });
  $button("Copy", ev => {
    GM.setClipboard(textbox.value);
    ev.target.textContent = "✅ Copied";
    nf.sleep(1500, () => { ev.target.textContent = "Copy" });
  });
  // TODO? File-based import and export
  let write = $button("Write", ev => {
    try {
      if (textbox.value.match(/^[\s{}]*$/)) {	// empty
        localStorage.clear();
        ev.target.textContent = "💾 Cleared";
      } else {
        let data = JSON.parse(textbox.value);
        localStorage.clear();	// don't move above, we need to vet JSON first
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, data[key]);
        });
        ev.target.textContent = "💾 Written";
      }
      flash(textbox);
      nf.sleep(1500, () => { ev.target.textContent = "Write" });
    } catch (error) {
      alert("Invalid or improperly escaped JSON data, not saving");
    }
  });
  write.id = "write";

  inout.tabSpacer();
  inout.tab("Help", $markdown(help));
  let about_tab = inout.tab("About", $markdown(about));
}

const menu = () => {
  if (!inout) make_menu();
  reload.click();
  inout.open();
}

// NOTE! This doesn't work for file:/// pages
GM.registerMenuCommand("Web Storage Import/Export ", menu, 's');

