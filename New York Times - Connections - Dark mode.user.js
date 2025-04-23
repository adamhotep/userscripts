// ==UserScript==
// @name	New York Times - Connections - Dark mode
// @match	https://*.nytimes.com/games/connections*
// @match	https://www.nytimes.com/interactive/2024/upshot/connections-bot.html
// @icon	https://www.nytimes.com/games-assets/v2/assets/connections/NYT-Connections-Icon.svg
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @version	0.1.20250420.0
// @grant	none
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

// Note, this requires the brower to request Dark Mode

document.head
  .append($html('meta', { name:'color-scheme', content:'light dark' }));
document.head.append($html('meta', { name:'darkreader-lock' }));

nf.style$(`
  @media ( prefers-color-scheme: dark ) {
    :root {
      --connections-yellow: #8e803f;	/* was #f9df6d */
      --connections-maroon: #ba81e5;	/* was #ba81c5 */
      --connections-blue: #a0c4ff;	/* was #b0c4ef */
      --connections-green: #a0c35a;
      --yellow:var(--connections-yellow);
      --green:var(--connections-green);
      --blue:var(--connections-blue);
      --purple:var(--connections-maroon);
    }

    /* Invert the whole document, correct colors, undo (double-invert) images */
    html, img { filter: invert() hue-rotate(180deg); }
    dt [data-level] {
      filter:invert() hue-rotate(180deg) brightness(1.7) saturate(.8);
    }
    body { background-color:var(--grey, #efefef); color:#000; }

  }

`);

