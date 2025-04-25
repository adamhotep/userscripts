// ==UserScript==
// @name	Google Search - Sort exact-hit images by size
// @namespace	https://github.com/adamhotep/userscripts
// @icon	data:image/svg+xml;utf8,<svg viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg"><rect fill="none" height="192" width="192"/><g><circle fill="#34a853" cx="144.07" cy="144" r="16"/><circle fill="#4285f4" cx="96.07" cy="104" r="24"/><path fill="#ea4335" d="M24 135c0 18 15 33 33 33H96v-16H56c-9 0-16-8-16-18v-18H24v19z"/><path fill="#fbbc05" d="M168 73c0-18-15-33-33-33H116l20 16c9 0 16 8 16 18v30h16V73z"/><path fill="#4285f4" d="M112 24H80L68 40H57C39 40 24 55 24 73V92h16V74c0-10 7-18 16-18h80L112 24z"/></g></svg>
// @match	https://www.google.com/search?*
// @author	Adam Katz
// @version	0.1.20250424.0
// @grant	none
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

nf.wait$('a:not([href])', a => {
  if (a.innerText == "Exact matches") return false;

  let all = q$('#search h1 + div:has(> div)');
  all.hits = 0;

  nf.wait$(':scope > div:not([density])', hit => {
    let g = q$('span:last-child span[style*="text-overflow:ellipsis"]', hit);
    if (g) {
      g = g.innerText
        .match(/\b([0-9]+)(?![0-9]),?([0-9]*)x([0-9]+)(?![0-9]),?([0-9]*)\b/);
      if (g) {
        let w = (g[1] + "" + g[2]) / 1;
        let h = (g[3] + "" + g[4]) / 1;
        hit.setAttribute("width", w);
        hit.setAttribute("height", h);
        hit.setAttribute("density", w * h);
        hit.setAttribute("unsorted", all.hits++);
      }
    }
  }, all);

  // down defaults to true (descending) unless specified or attr is "unsorted"
  let sort_hits = (attr, down = attr != "unsorted") => {
    let up = down ? -1 : 1;
    down   = down ? 1 : -1;
    [...all.children]
      .sort((a, b) => down * b.getAttribute(attr) + up * a.getAttribute(attr))
      .forEach(e => { all.appendChild(e); })
  }

  let buttonbar = null;
  [...qa$('div[data-sbu^="/setprefs?"] div')]
    .some(d => {
      if (d.innerText == "SafeSearch") {
        buttonbar = d.parentElement;
        return true;
      }
    });
  if (!buttonbar) {
    buttonbar = q$('div[style*="z-index:100"]');
  }

  if (buttonbar && !q$("select.sorter", buttonbar)) {
    buttonbar.append("Sort by: ");
    let select = buttonbar.appendChild($html('select', { class:"sorter" },
      'option', { text:"unsorted" },
      'option', { text:"density" },
      'option', { text:"width" },
      'option', { text:"height" }
    ));
    select.addEventListener('change', e => { sort_hits(select.value); });
  }

});
