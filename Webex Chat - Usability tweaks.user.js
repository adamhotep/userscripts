// ==UserScript==
// @name	Webex Chat - Usabilty tweaks
// @namespace	https://github.com/adamhotep/userscripts
// @version	0.4.20251111.0
// @author	Adam Katz
// @icon	https://web.webex.com/favicon.ico
// @match	https://web.webex.com/*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @grant	none
// ==/UserScript==

let css = nf.style$(`/* Webex Chat - Usability tweaks CSS */

/* orange color for unread messages (bold isn't sufficiently distinguishable) */
div#space-list div .md-space-row-content-is-new-activity > *,
.md-space-row-content-is-new-activity mdc-text[data-test="list-item-first-line"]::part(text) /* 20241223 */
{
  color:var(--message-bodyText-extParticipants-text-hovered, orange)!important;
  font-weight:750!important;
}

.md .dl, .md .md-dl, dl, ol, ul { font-size:inherit; }

body .activity .activity-item-message .md .li,
body .activity .activity-item-message .md .md-li,
body .activity .activity-item-message li,
body .md .activity .activity-item-message .li,
body .md .activity .activity-item-message .md-li {
  padding:0;
}

/* fix fonts in Linux, ymmv */
.composer-section .ql-container { font:13px sans-serif!important; }
.activity-item pre > code { font:85% monospace!important; }

.activity-item pre > code span.linenumber { min-width:2rem!important; }
off .activity-item pre > code .linenumber + span { margin-left:1ex; }
.activity-item pre > code.wrapped .linenumber { display:none!important; }
.activity-item-base-section pre { white-space:pre!important; }
.activity-item-base-section pre > .wrapped { white-space:pre-wrap!important; }
.activity-item-base-section pre > .wrapped span { white-space:inherit!important}
mdc-button[title="Wrap"] { background-color:#0000; color:inherit; }
mdc-button[title="Wrap"]:hover {
  /* light and dark seem to be flipped for me */
  background-color:light-dark(#fff1, #0001) !important;
}
/* This makes no sense, but it gets the smallest height for me */
.activity-item pre > code > * { line-height:2!important; }

/* Markdown tables */
.wcut			{ border-spacing:0; margin:1em 0 1em .5ex;
			  --border:solid 1px #8884; }
.wcut th		{ border-bottom:var(--border); }
.wcut tr > * + *	{ border-left:var(--border); }
.wcut :is(td,th)	{ padding:.2ex .5ex; }
.wcut tr:nth-child(2n)	{ background-color:#8882; }
`);
css.alignments = {};

// automatically dismiss the "Network issues detected" dialog
nf.wait$('mdc-dialog[header-text="Network issues detected"]', dialog => {
  if (dialog.shadowRoot) {
    nf.wait$('mdc-button[part="dialog-close-btn"]', close => {
      close.click();
    }, dialog.shadowRoot);
  }
});

// Markdown tables {{{
// It is possible that Webex gets confused by this and refuses to render the
// altered contents. If this happens, view another chat and then come back.
// Markdown table spec: https://github.github.com/gfm/#table
nf.wait$('.activity-item-message', msg => {
  const p = '< (?: /? p | br ) \\b [^>]* >';
  const pipe = '(?<! \\\\ ) (?: \\\\ \\\\ )* \\|';
  const end_pipe = `${pipe} [\x20\\t]* (?: ${p} | \\r? \\n | $ )`;
  nf.sleep(851, () => { msg.innerHTML = msg.innerHTML.replace(nf.regex(`
    # first line: head row (populates $1)
    (?: ${p} | ^ ) \\s* ( ${pipe} .* ) ${end_pipe}

    # second line: delimiter row (hyphens to separate the header from the body)
    # (populates $2 for alignment)
    ( (?: ${pipe} \\s* (?: : \\s* )? -+ \\s* (?: : \\s* )? )+ ) ${end_pipe}

    # all subsequent table lines are the body (populates $3)
    \\s* ( (?: ${pipe} \\s* .* ${end_pipe} )+ )
  `, 'xmg'),
    (all, head, alignments, body) => {
      let alignment_array = [];
      let align = '';
      // skip the opening pipe and all trailing columns that lack alignment,
      // then split and run for each column
      alignments.replace(/^\||\|[^:]*$/g, '').split(/\s*\|\s*/).forEach(col => {
        let dir = '';
        if (col.startsWith(':')) {
          align = true;
          if (col.endsWith(':')) dir = 'center';
          else dir = 'left';
        } else if (col.endsWith(':')) {
          align = true;
          dir = 'right';
        }
        alignment_array.push(dir);
      });
      if (align) {
        align = nf.hash(alignment_array, 36);
        if (!css.alignments[align]) {
          css.alignments[align] = 1;
          let new_css = '\n';
          let c = 0;
          alignment_array.forEach(col => {
            c++;
            if (col) new_css +=
              `.wcut.${align} tr > *:nth-child(${c}) { text-align:${col} }\n`;
          });
          nf.style$(new_css, css);
        }
      }
      let clean = $html('p');
      clean.innerHTML = all;
      clean = clean.innerText;
      return `<table class="wcut ${align}"><tr>`
        // cleaned original text is presented as rollover text to the first cell
        + head.replace(/\|/g, '<th>').replace(/<th>/, `<th title="${clean}">`)
        + '<tr>'
        + body.replace(/\r\n|<(?:p|br)\b[^>]*>/g, '\n')
          .replace(/\s*\|[ \t]*(?=((?:\n|<\/p>))?)/g,
            (all, newline) => newline ? '<tr>' : '<td>')
          .replace(/<tr><\/p>/g, '')
        + '</table>'
    }
  )});
  // it appears Webex inserts an extra cell on the last row. remove if empty.
  nf.wait$('.wcut tr:last-child td[draggable]:last-child', drag => {
    if (drag.textContent == "") drag.remove();
  });
}); // end Markdown tables }}}

// Add a button to wrap/unwrap code blocks {{{
nf.wait$(`.activity-item-message :has(+pre)
  > mdc-button[id^="copy-"]:not([wcut])`,
  copy => {
    let wrap = copy.cloneNode();
    copy.setAttribute('wcut', "been-there");
    ['id', 'data-test', 'data-clipboard-text', 'prefix-icon'].forEach(attr => {
      wrap.removeAttribute(attr);
    });
    wrap.ariaLabel = wrap.title = "Wrap";
    wrap.textContent = '︎︎\u21A9\ufe0e';
    // Something about this custom element controls the Event Listeners
    // but it doesn't have an issue with the onclick attribute
    wrap.setAttribute('onclick', `
      let code = this.parentElement.nextElementSibling.querySelector('code');
      code.classList.toggle('wrapped');
    `);
    copy.parentElement.insertBefore(wrap, copy);
    // for some reason, adding the wrap button disables the copy button. fix:
    copy.ariaLabel = copy.title = "Copy";
    copy.setAttribute('onclick',
      `navigator.clipboard.writeText(this.dataset.clipboardText)`
    );
}); // end wrap/unwrap code blocks }}}
