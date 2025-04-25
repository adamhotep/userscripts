// ==UserScript==
// @name	New York Times - Connections - Dark mode
// @match	https://*.nytimes.com/games/connections*
// @match	https://*.nytimes.com/interactive/2024/upshot/connections-bot.html
// @match	https://*.nytimes.com/*/connections-companion-*
// @icon	https://www.nytimes.com/games-assets/v2/assets/connections/NYT-Connections-Icon.svg
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @version	0.1.20250424.0
// @grant	none
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

// Note, this requires the brower to request Dark Mode

document.head
  .append($html('meta', { name:'color-scheme', content:'light dark' }));
let no_darkreader =
  document.head.appendChild($html('meta', { name:'darkreader-lock' }));

let style = nf.style$(`
  @media ( prefers-color-scheme: dark ) {

    /* Invert the whole document, correct colors, undo (double-invert) images */
    html, img { filter: invert() hue-rotate(180deg); }
    dt [data-level] {
      filter:invert() hue-rotate(180deg) brightness(1.7) saturate(.8);
    }

    html {
      --connections-yellow: #8e803f;	/* was #f9df6d */
      --connections-maroon: #ba81e5;	/* was #ba81c5 */
      --connections-blue: #a0c4ff;	/* was #b0c4ef */
      --connections-green: #a0c35a;
      --yellow:var(--connections-yellow);
      --green:var(--connections-green);
      --blue:var(--connections-blue);
      --purple:var(--connections-maroon);
    }
    body { background-color:var(--grey, #efefef); color:#000; }

  }

`);

// Dark Reader does a much better job on the companion (💡 hint) pages,
// so use it if it is available
if (location.pathname.includes("companion")) {
  no_darkreader.remove();
  nf.wait$('html[data-darkreader-scheme]', html => {
    if (html.dataset.darkreaderScheme == "dark") { style.remove(); }
  });
}
