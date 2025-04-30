// ==UserScript==
// @name	Rogule - Beer button & dark mode support
// @description	The beer button rests ten turns; hit it 10x to gain 1 HP
// @match	https://rogule.com/*
// @match	https://*.nytimes.com/*/connections-companion-*
// @icon	https://rogule.com/icon.png
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @version	0.1.20250429.0
// @grant	none
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

// Note, The dark mode part requires the brower to be set to prefer Dark Mode.

document.head
  .append($html('meta', { name:'color-scheme', content:'light dark' }));
// Disable Dark Reader if it exists. Dark Reader doesn't do well on this site.
let no_darkreader =
  document.head.appendChild($html('meta', { name:'darkreader-lock' }));

// Here's an alternative "door" tile that actually looks like a door.
// To install it, put it after (or instead of) the `img[title="door"]` line.
//   img[title="door"] { content:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:26px'><text x='15%' y='75%'>🚪</text></svg>"); filter:brightness(1.5); opacity:.5; margin-left:-.15ex; }
//
// It can have proper tile width with `transform:scale(2,1)` (use `margin-left:-.25ex`).
// I found it too distracting (even at 50% opacity), so I left it out.

let style = nf.style$(`

  @media ( prefers-color-scheme: dark ) {

    /* Invert the whole document, correct colors, undo (double-invert) images */
    html, img, #beer span { filter: invert() hue-rotate(180deg); }
    img[title="wall"] { filter:brightness(3.3) saturate(.5); }
    img[title="door"] { filter:brightness(.98); }

    html { background-color:#eeeef4; }	/* invert+rotates to #0b0b11, not quite pure black */

  }

  #beer { position:absolute; left:3em; bottom:3em; height:2em; width:2em; }
  #beer span { text-shadow:0 0 .1ex #444; }

`);

// Beer button: rest 10x (10 rests = 0.1 HP vs 3 HP from a 🥃)
nf.wait$('#game button.key:has(path[d$="385.5z"])', wait => {

  let game = q$('#game');
  let beer = game.appendChild($html('button', { class:'key', id:'beer' }));
  let mug = beer.appendChild($html('span', { text:'🍺' }));	// beer mug
  beer.counter = 0;
  beer.addEventListener('click', ev => {
    let get_hp = x => qa$('#health-bars img[title~="green"]').length;
    let old_hp = get_hp();

    let action = x => wait.dispatchEvent(new Event(x, { bubbles:true }));
    for (let i = 0; i < 10; i++) {
      action('mousedown');
      action('mouseup');
    }
    mug.textContent = '🍻';	// show as clinking beer mugs for a half-second
    nf.sleep(150, x => {
      let time = 350;
      let new_hp = get_hp();
      if (new_hp > old_hp) {	// HP went up!
        mug.textContent = '🥴';	// make it a woozy face
        console.log("You feel a little better.");
        beer.counter = 0;
        time = 700;
      } else if (new_hp == old_hp) {
        if (beer.counter++ == 0) {
          console.log("You feel thirsty. Drink more!");
        }
      }
      nf.sleep(time, x => mug.textContent = '🍺');	// beer mug
    });
  });

});

