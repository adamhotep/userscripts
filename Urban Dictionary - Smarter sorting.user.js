// ==UserScript==
// @name	Urban Dictionary - Smarter sorting
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @include	https://www.urbandictionary.com/define*
// @version	1.0.0.20190720
// @grant	none
// ==/UserScript==

// New sorting algorithm: ~precision times log(average annual upvotes)
// NOTE: this only sorts the current page's content (sorted as yea - nay)
function score(yea, nay, age) {
  yea /= 1; nay /= 1; age /= 1; 	// make sure these are numbers
  if (yea + nay == 0) { return -age; }	// older unvoted = lower (more chances)
  let prevalence = yea;
  if (yea > age) { prevalence /= age; }	// ensure prevalence >= 1
  return yea / (yea + nay) * Math.log(prevalence);
}

var content = document.getElementById("content");
if (content) {
  var panels  = content.childNodes;
  var defs = [];

  for (let p = 0, pl = panels.length; p < pl; p++) {
    let up   = panels[p].querySelector(".up   .count");
    let down = panels[p].querySelector(".down .count");
    let age  = panels[p].querySelector(".contributor");
    if (!up || !down || !age) { continue; }
    age = age.innerText.match(/[A-Z][a-z]*\s\d+,\s\d+$/);
    age = (Date.parse(Date()) - Date.parse(age)) / 31536000000; // age in years
    panels[p].dataset.score = score(up.innerText, down.innerText, age);
    defs.push(panels[p]);
    let ribbon = panels[p].querySelector(".ribbon");
    if (ribbon) {
      ribbon.title += "(resorted by userscript)";
    }
  }

  defs.sort( function(a, b) { return b.dataset.score - a.dataset.score; } );
  for (let d = 0, dl = defs.length; d < dl; d++) {
    content.appendChild(defs[d]); // removes and adds them by descending score
  }

}

// Miscellaneous style tweaks
let style = document.createElement("style");
style.type = "text/css";
document.head.appendChild(style);
style.textContent = /* syn=css */ `

  /* white-on-yellow (.food) and white-on-lime (.drugs), etc. are problems */
  .category [style*=" color: white"] {
    color:inherit!important; text-shadow:0 0 1.5px #fff;
  }

  /* Shrink the top categories/trends box */
  #columnist, #columnist li { font-size:75%; }

`;
