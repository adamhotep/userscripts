// ==UserScript==
// @name	Logic Games Online Netwalk - Tweaks
// @description	Put the puzzle up top and prevent scrolling
// @author	Adam Katz
// @version	1.0.20210830.1
// @grant	none
// @include	https://www.logicgamesonline.com/netwalk/*
// @icon	https://www.logicgamesonline.com/favicon.ico
// ==/UserScript==

// Copyright 2019+ by Adam Katz, GPL v3+ {{{
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>. }}}

/* tweak the CSS to make the page fit without scrolling */
let style = document.createElement('style');
style.setAttribute('type', 'text/css');
document.head.appendChild(style);
style.textContent = /* syn=css */ `

#navbar       { margin-top:10em; }
#header       { width:15em; position:absolute; }
#scroller     { display:block; margin-top:2em; }
body.noscroll { overflow:hidden; }

body.noscroll #explain.red       { color:red; font-size:0; overflow:hidden;
  transition:all 0.33s ease-out; }
body:not(.noscroll) #explain.red {
  transition:color 1.1s ease-out, font-size 0.5s ease-out; }

`;

// add a `Help` button to expand/collapse the game explanation
let title = document.querySelector("h1");
let explain = document.querySelector(`#explain`);
let form = document.querySelector(`form[action="/netwalk/"]`);
let scroller = document.createElement("input");
scroller.type = "button";
scroller.value = "Help";
scroller.id = "scroller";
form.appendChild(document.createElement("br"));
form.appendChild(scroller);
scroller.onclick = function() {
  let goto = explain;
  document.body.classList.toggle("noscroll");
  if (document.body.classList.contains("noscroll")) {
    goto = title;
  }
  goto.scrollIntoView();
}

// collapse if between 573 and 900 pixels tall, also make the help text red
if (573 < window.innerHeight && window.innerHeight < 900) {
  scroller.onclick();
  explain.classList.add("red");
}
