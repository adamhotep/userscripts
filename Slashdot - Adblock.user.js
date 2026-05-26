// ==UserScript==
// @name	Slashdot - Adblock
// @version	0.4.20260413.0
// @grant	none
// @icon	https://slashdot.org/favicon.ico
// @include	https://slashdot.org/*
// @include	https://*.slashdot.org/*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// ==/UserScript==

/* tweak the CSS */
nf.style$(`

  /* older */
  #firehose > div > article[id$="-adblocked"], /* high specificity needed */
  #announcement, /* this has never been anything but (internal) ads */
  #slashdot_deals, .adwrap
  { display:none!important; }

  /* I had to turn off Adblock Plus, now there's more to squash */
  footer#ft, #sitewide-top-banner-placeholder
  { display:none!important; }

`);

/* new as of Dec 2024:
 * these ads actually verify they're rendered; push them off screen instead */
nf.wait$(`#firehose-message-tray + span[id]:has(iframe),
  #slashboxes > :has(iframe),
  #slashboxes > :has(~ .block.nosort) /* (requires high karma) */,
  #bottomadspace ~ *,
  a[target="_blank"]:has(img):not([href^="https://www.reddit.com/"]),
  #firehoselist + span[id]:has(iframe),
  div[style*="top:"],
  [id*="adblocked"],
  div:has(+a[name="main-articles"])
`, elem => {
  elem.style.position = 'absolute';
  elem.style.top = '-200vh';
});

nf.wait$(`.sticky`, elem => { elem.remove(); });

/* older */
nf.wait$('article[id] > header > div.ntv-sponsored-disclaimer',
  articleText => {
    let sponsoredContent = articleText.parentElement.parentElement;

    // this gets overwritten and reverted (thus the CSS above)
    sponsoredContent.style.display = "none!important";

    // this overrides the bypass slashdot somehow configured:
    sponsoredContent.id += "-adblocked";
  }
);

// "Disable Advertising" is an option for /. users with high karma
nf.wait$('input[name="adsoff"]', function(adsoff) {
  if (!adsoff.checked) adsoff.click();
});
