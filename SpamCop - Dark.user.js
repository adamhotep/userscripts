// ==UserScript==
// @name	SpamCop - Dark theme
// @namespace	https://github.com/adamhotep/userscripts
// @author	Adam Katz
// @version	1.1.20250208.1
// @icon	https://www.spamcop.net/images/favicon.ico
// @include	https://*.spamcop.net/*
// @include	https://spamcop.net/*
// @grant	none
// ==/UserScript==

// To use this, your browser must have "Website appearance" set to "Dark"
// (or "Automatic" if your toolkit/OS is set to "Dark").

function addStyle(css) {
  let style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  document.head.appendChild(style);
  style.textContent = css;
  return style;
}

addStyle(`

:root			{ color-scheme:light dark; }
@media ( prefers-color-scheme: dark ) {

  body > *:not(#logo, #topmenu, #login, #nav) {
    color:CanvasText!important; background-color:Canvas!important;
  }
  .graphbox		{ background-color:#333; }
  #sidebar, #news	{ background-color:#0f181d; }
  body, .column 	{ color:#fff; background-color:#000!important; }
  #content		{ border-bottom-width:0; }
  #footer	{ background:linear-gradient(Canvas, #000, #000, #000) #000; }
  #content .faqbody b	{ color:#fff; }
  #content b, .faqtitle,
    .header, #cesbody h2, #cesbody h3, .column h3, #news h3 { color:#f9b; }
  .warning		{ color:#f90; }
  .bannermsg		{ color:#f8f; }
  a:link, [color="blue"] {color:#68f; }
  a:visited		{ color:#daf; }
  a:active, .error	{ color:#f44; }
  #donate, #donate a	{ color:#000; background-color:#f9b; }
  .btn-link		{ color:#34f; }
  .jqplot-target	{ filter:invert() hue-rotate(180deg); }

}

/* Make tabs look like tabs */
#nav, #nav a	{ border-bottom-width:0!important; }
#nav a	{ display:inline-block; vertical-align:bottom; padding-bottom:0.5ex; }
#nav a[href="${location.pathname + location.search}"], #nav a:hover {
  color:CanvasText; background-color:Canvas; border-color:Canvas;
}

`);

