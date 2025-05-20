// ==UserScript==
// @name	Proximity - Find nearby words
// @description	Adds a text box to search for nearby words
// @match	https://proximity.clevergoat.com/
// @match	https://proximity.clevergoat.com/nearest/*
// @icon	https://proximity.clevergoat.com/favicon.ico
// @author	Adam Katz
// @namespace	https://github.com/adamhotep/userscripts
// @version	0.1.20250519.0
// @grant	none
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

let exploring = 0;
let target = "_blank";

let near_box = $html('div', { id:'near_box', class:'relative' });

let near = near_box.appendChild($html('input', { type:'text', id:'near' }));
near.classList = 'w-full border-2 border-black dark:border-white px-2 py-1.5 '
  + 'rounded-md text-xl outline-none bg-white dark:bg-black ng-untouched '
  + 'ng-pristine ng-valid';
near.pattern = '[a-z]+';
let search = ev => {
  let word = fix_near();
  if (!word) { return; }
  let path = '/nearest/' + btoa(word);
  if (exploring && !ev.ctrlKey || ev.shiftKey) { location.href = path; }
  else { window.open(location.origin + path, target).focus(); }
}
near.addEventListener('keypress', ev => {
  if (ev.key == 'Enter') search(ev)
});
let fix_near = () => {
  return near.value = near.value.toLowerCase().replace(/[^a-z]/g, "");
}
near.addEventListener('input', ev => {
  if (!ev.target.checkValidity()) fix_near();
});

let near_btn = near_box.appendChild($html('button', {
  text:"Nearby",
  class:'px-3 py-1 absolute right-1 top-1 button-primary border-none'
}));
near_btn.addEventListener('click', search);


if (location.pathname.startsWith('/nearest/')) {  // exploring nearby words
  exploring = 1;
  target = "nearest";
  nf.wait$('h2', title => {
    if (! title.textContent.includes("Nearby words")) return;
    title.parentElement.insertBefore(near_box, title);

    // set the page's title to reflect the word
    let next = title.nextElementSibling;
    if (next) {
      let word = q$('span.clever-font-medium', next);
      if (word && next.textContent.includes("nearest words to ")) {
        document.title = word.textContent + " " + document.title;
      }
    }
  });

  nf.wait$('app-nearby-words button', reveal => {
    if (reveal.textContent.includes("Reveal words")) reveal.click();
  });

  let n=1;
  nf.wait$('.grid + .grid .col-span-2', word => {
    let text = word.textContent;
    if (text.match(/^[a-z]{2,}$/)) {
      word.textContent = "";
      let link = word.appendChild($html('a', { text:text, class:"near_link" }));
      link.href = '/nearest/' + btoa(text);
    }
  });

} else {	// playing the game
  nf.wait$('button:nth-child(2):has(+ button)', giveup => {
    if (! giveup.textContent.includes("Give Up")) return;
    let up = giveup.parentElement;
    near_box.classList.add('hidden');
    up.parentElement.appendChild(near_box);
    let near_button = up.insertBefore(giveup.cloneNode(true), giveup);
    near_button.id = 'near_button';
    near_button.textContent = "Nearby…";
    near_button.addEventListener('click', ev => {
      near_box.classList.toggle('hidden');
      nf.sleep(150, () => {
        near.focus();
      });
    });
  });
}

nf.style$(`
  #near_box { margin:1em 0; }
  a.near_link:hover { color:#60a5fa; }
  a.near_link:active { color:#f66; }
`);

