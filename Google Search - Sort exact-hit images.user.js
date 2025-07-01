// ==UserScript==
// @name	Google Search - Sort exact-hit images by size
// @namespace	https://github.com/adamhotep/userscripts
// @icon	data:image/svg+xml;utf8,<svg viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg"><rect fill="none" height="192" width="192"/><g><circle fill="#34a853" cx="144.07" cy="144" r="16"/><circle fill="#4285f4" cx="96.07" cy="104" r="24"/><path fill="#ea4335" d="M24 135c0 18 15 33 33 33H96v-16H56c-9 0-16-8-16-18v-18H24v19z"/><path fill="#fbbc05" d="M168 73c0-18-15-33-33-33H116l20 16c9 0 16 8 16 18v30h16V73z"/><path fill="#4285f4" d="M112 24H80L68 40H57C39 40 24 55 24 73V92h16V74c0-10 7-18 16-18h80L112 24z"/></g></svg>
// @match	https://www.google.com/search?*
// @author	Adam Katz
// @version	0.2.20250530.0
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
        hit.setAttribute("width", nf.sprintf("%d.%07d", w, h));	// w then h
        hit.setAttribute("height", nf.sprintf("%d.%07d", h, w)); // h then w
        hit.setAttribute("density", w * h);
        hit.setAttribute("google-default", all.hits++);
        if (all.hits > 1) all.setAttribute("gssehi", all.hits);
      }
    }
  }, all);

  // down defaults to true (descending) unless specified or attr is "google-default"
  let sort_hits = (select, down = select.value != "google-default") => {
    let attr = select.value;
    let reverse = select.getAttribute("reverse");
    if (attr == reverse) down = !down;
    let up = down ? -1 : 1;
    down   = down ? 1 : -1;
    [...all.children]
      .sort((a, b) => down * b.getAttribute(attr) + up * a.getAttribute(attr))
      .forEach(e => { all.appendChild(e); });
    select.setAttribute("reverse", attr == reverse ? "" : attr);
  }

  nf.wait$('div:has(> div[role="list"] a:not([href]))', google_tabs => {

    if (google_tabs && !q$("#gssehi_sorter")) {
      let sorter = google_tabs.appendChild($html('div', { id:"gssehi_sorter" }));
      sorter.append("Sort by: ");
      let select = sorter.appendChild($html('select', { reverse:"google-default" },
        'option', { text:"google-default" },
        'option', { text:"density" },
        'option', { text:"width" },
        'option', { text:"height" }
      ));
      select.addEventListener('click', e => { sort_hits(select); });
      // wait 0.3 seconds and then sort by density
      nf.sleep(300, () => {
        select.value = "density";
        sort_hits(select);
      });
    }

  });

});

// only show the sorter when there are things to sort
nf.style$(`

  #gssehi_sorter			{ display:none; }
  body:has([gssehi]) #gssehi_sorter	{ display:initial; }

`);
