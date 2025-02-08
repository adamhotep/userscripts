// ==UserScript==
// @name	Github - UI Tweaks
// @namespace	https://github.com/adamhotep/userscripts
// @include	https://gist.github.com/*
// @include	https://github.com/*
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus.js
// @require	https://github.com/adamhotep/nofus.js/raw/main/nofus-dialog.js
// @grant	GM.info
// @grant	GM_info
// @author	Adam Katz
// @version	1.2.20250208.0
// ==/UserScript==

/******************************************************************************\

 To install this script, first install a Userscript manager like Greasemonkey
 or Violentmonkey. Then view this script in its raw form and your browser will
 recognize the .user.js extension and ask if you want to install it.
 Further installation instructions: https://github.com/adamhotep/userscripts

 To configure this script for easier cloning across multiple SSH accounts,
 click Github's green `<> Code` button on any repository, switch to SSH, and
 then click the 👥 (people, aka "busts in silhouette") button at the top right.
 That will open this script's dialog, which will guide through the rest.

\*****************************************************************************/

const copyright = `copyright 2016+ by Adam Katz

This program is free software: you can redistribute it and/or modify it
under the terms of version 3 of the GNU General Public License as published
by the Free Software Foundation. This program is distributed in the hope
that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
included LICENSE file or else http://www.gnu.org/licenses for more details.

Beerware: If you consider this helpful, you are welcome to buy me a drink.`;

// Shim for GM.info on older userscript interpreters (maybe unnecessary?)
if (typeof GM == "undefined") {
  GM = {};
  if (typeof GM_info == "object") { GM.info = GM_info; }
}
const meta = what => {
  if (typeof GM?.info?.script == "object") return GM.info.script[what];
  return '';
}

// Linkify commented web URLs
// This ignores .pl-s (strings) because it may be **constructing** a URL
var plc = document.querySelectorAll(".pl-c");
for (var c = 0, cl = plc.length; c < cl; c++) {
  plc[c].innerHTML = plc[c].innerHTML
    // avoids ampersands (escaped ampersands are okay) and trailing punctuation
    .replace(/\b(https?:\/\/(?:[^&<>"'\s]+(?:&amp;)*)+[^\s;?.!,<>()\[\]{}'"&*])/ig,
             '<a href="$1">$1</a>');
}

// Multi-SSH-account support for https://stackoverflow.com/a/8483960/519360 {{{
//
// Note, I tried to simply have this code alter the value of the text box
// (by both value and value attribute) but the Github code actually populates
// the clipboard from some convoluted JSON and I'm not touching that.

var personal_clone = 'div:has(> #clone-with-ssh)';
let opacity_style = nf.style$('');

nf.wait$(`div:not(:has(#work-clone)) > ${personal_clone}`, clone => {
  let clone2 = clone.cloneNode(1);
  //clone.id = 'personal_clone';	// can't use, gets wiped
  clone2.id = 'work-clone';

  let clone2_label = q$('label[for="clone-with-ssh"]', clone2);
  let clone2_input = q$('#clone-with-ssh', clone2);
  let clone2_button = q$('button[aria-labelledby]', clone2);
  let clone2_span = q$('span[aria-label]', clone2);
  if (!(clone2_label || clone2_input || clone2_button || clone2_span)) {
    return;
  }

  let cloner = clone.parentElement;
  cloner.id = "cloner";
  let login = q$('button[class][data-login]:not([data-login=""])');
  login &&= login.dataset.login;
  let user = '';
  let host = 'git@work.github.com';

  update_althost = () => {
    clone2_input.value = clone2_input.value.replace(/^[^:]+(?=:)/, host);
  }
  update_opacity = () => {
    let selector = (user != login) ? '#work-clone' : personal_clone;
    if (localStorage.getItem('ghuit-ssh-matchonly') == 'true') {
      selector += ' { display:none!important }';
    } else {
      selector += ' { opacity:0.4 }';
    }
    opacity_style.textContent = selector;
  }

  clone2_label.setAttribute('for', 'work-clone-input');
  clone2_input.id = 'work-clone-input';
  clone2_button.id = 'copier';
  let copy_text = clone2_span.getAttribute('aria-label')
    .replace(/url/i, "work $&");
  clone2_button.title = copy_text;	// note, not an exact UI match
  clone2_button.removeAttribute('aria-labelledby');
  let success = clone2_button.appendChild($html('span'));
  clone2_button.addEventListener('click', () => copy(clone2_input.value));
  async function copy(text) {	// note, not an exact UI match
    try {
      await navigator.clipboard.writeText(text);
      clone2_button.title = "Copied!";
      success.textContent = '✔️';	// Unicode check mark
      // These make the checkmark green, even if it was a colored emoji:
      success.style.color = '#050';
      success.style.filter = 'sepia(1) hue-rotate(70deg) saturate(15)';
    }
    catch (error) {
      clone2_button.title = "Copy FAILED!";
      nf.error(error.message);
      success.textContent = '❌';	// Unicode cross mark
      success.style.color = '#a00';
      success.style.removeProperty('filter');
    }
    clone2_button.classList.add('clicked');
    await nf.sleep(3000);
    clone2_button.classList.remove('clicked');
    clone2_button.title = copy_text;
  }
  clone.insertAdjacentElement('beforebegin', clone2);

  user = localStorage.getItem('ghuit-ssh-altuser') ?? '';
  host = localStorage.getItem('ghuit-ssh-althost') ?? host;
  if (!user) {
    cloner.classList.add('ghuit-noalt');
  }

  update_althost();
  update_opacity();

  // Add a dialog to change this setting
  if (! q$('#setup-althost', cloner)) {
    let help = q$('a[href$="/which-remote-url-should-i-use"]');
    if (help) {

      // Button to launch setup
      let setup = help.insertAdjacentElement('beforebegin', $html('a'));
      setup.id = 'setup-althost';
      setup.textContent = '👥';
      setup.title = "Github UI Tweaks (NOT official!): \n"
        + "Configure alternate host for multi-user support";
      setup.addEventListener('click', () => { dialog.open(); });

      let $code = text => $html('code', { text:text });
      let defhost = 'git@work.github.com';
      // Input pattern is a string, interpreted as a full-string match.
      // Bare hyphens need escapes: https://stackoverflow.com/a/79359096/519360
      // "Username may only contain alphanumeric characters or single hyphens,
      // and cannot begin or end with a hyphen." -- https://github.com/signup
      let user_re = '[A-Za-z0-9\\-]+';
      let host_re = '(?:[\\w_.\\-]+@)?[\\w_.\\-]+';

      // ensure we don't duplicate and we do rebuild from scratch
      var dialog = q$('#multi-ssh');
      if (dialog) { dialog.remove(); }

      dialog = new nf.dialog("Github UI Tweaks – Multi-SSH-account setup",
        { id:'multi-ssh', open:false });

      // Tab: Github config
      dialog.tab("Github config",
        $html('p',
          $txt("Specify an alternate Github account and its corresponding "),
          $code("Host"),
          $txt(" or "),
          $code("user@host"),
          $txt(" value for easy account swapping. Use the "),
          $html('strong', { text:"SSH config" }),
          $txt(" tab to finish the setup.")
        ),
        $html('label',
          $html('div', { text:"Alternate Github handle" }),
          new_user = $html('input', { type:'text', value:login, pattern:user_re,
            'dataset.invalid':"Just letters, numbers, and dashes",
            'dataset.invalid_re':'[^A-Za-z0-9]+'
          })
        ),
        $html('label', { title:"The `user` is likely `git`, which you can "
          + "omit if you like; it will be added to the SSH config as needed." },
          $html('div', $txt("Alternate SSH host or user@host")),
          new_host = $html('input', { type:'text', value:(host || defhost),
            pattern:host_re, placeholder:defhost,
            'dataset.invalid':"Host or username@host (like an email)",
            'dataset.invalid_re':'[^@\\w.-]+|(?<=@.*)@'
          })
        ),
        only_match_label = $html('label',
          $html('div', $txt("Only show matched SSH target")),
          only_matched = $html('input', { type:'checkbox' })
        ),
        $html('p', { class:'firefox-only small' },
          $txt("If you use "),
          $html('a', { text:"Firefox containers",
            href:'https://addons.mozilla.org/en-US/firefox/addon/'
            + 'multi-account-containers/' }),
          $txt(`, you'll have to repeat this
            configuration in each relevant container. This will also allow
            you to maintain multiple alternate handle/host pairs.`)
        ),
        $html('p', { id:"ghuit_buttons" },
          cancel = $html('button', { type:'button', text:'❌ Cancel'}),
          $txt(' '),
          save = $html('button', { type:'button', text:'💾 Save' })
        )
      );
      if (localStorage.getItem('ghuit-ssh-matchonly') == 'true') {
        only_matched.checked = true;
        only_match_label.title = "Show only the matching target "
          + "(unchecking this would show the other target with low opacity)";
      } else {
        only_match_label.title = "Show two targets: the matching target and, "
          + "with low opacity, the other. Check this to hide the other target.";
      }
      async function vet_input(evt) {
        evt.target.setCustomValidity("");
        if (!evt.target.checkValidity()) {
          evt.target.setCustomValidity(evt.target.dataset.invalid);
          evt.target.reportValidity();
          evt.target.value = evt.target.value.replace(
            RegExp(evt.target.dataset.invalid_re, 'g'), '');
          await nf.sleep(2500);
          evt.target.setCustomValidity("");
        }
      }
      new_user.addEventListener('input', vet_input);
      new_host.addEventListener('input', vet_input);
      cancel.addEventListener('click', () => dialog.close());
      save.addEventListener('click', () => {
        user = new_user.value;
        if (new_host.value) {
          if (new_host.value.match(/^(?:git@)?github.com$/) &&
            !confirm("You have set your alternate SSH host to the default. "
              + "Is that really what you want? It will disable this feature.")
          ) {
            return;
          }
          host = new_host.value;
        } else {
          new_host.value = host;
        }
        localStorage.setItem('ghuit-ssh-altuser', user);
        localStorage.setItem('ghuit-ssh-althost', host);
        localStorage.setItem('ghuit-ssh-matchonly', only_matched.checked);
        cloner.classList.remove('ghuit-noalt');
        update_opacity();
        dialog.close();
      });

      // Tab: SSH config
      dialog.tab("SSH config",
        $html('p',
          $txt("After updating and saving the config in the "),
          $html('b', { text:'Github config' }),
          $txt(" tab, add the following to your "),
          $code('~/.ssh/config'),
          $txt(" file (this updates with those fields):")
        ),
        $html('pre', ssh_code = $html('code', { class:'ssh_config' })),
        $html('p',
          $txt("This will instruct SSH to use different "),
          $code('IdentityFile'),
          $txt(" keys for different Github accounts based on the "),
          $code('Host'),
          $txt(" you clone with. Change the "),
          $code("IdentityFile"),
          $txt(" values to the proper paths to your SSH keys."),
        ),
        $html('p',
          $txt("See "),
          $html('a', { href:'https://stackoverflow.com/a/8483960/519360',
            text:'this Q&A', title:"Multiple GitHub Accounts & SSH Config" }),
          $txt(" for further guidance.")
        )
      );
      let [host_user, host_host] = host.split('@');
      if (host_host == undefined) {
        host_host = host_user;
        host_user = 'git';
      } else if (host_user == 'git') {
        host_user = '';
      }
      if (host_user) {
        host_user = '\n  <b>User</b>           ' + host_user;
      }

      ssh_code.innerHTML = /* syn=html */ `
        <b>Host</b> ${host_host}
          <b>HostName</b>       github.com${host_user}
          <b>IdentitiesOnly</b> yes
          <b>IdentityFile</b>   ~/.ssh/github-work-key
          <b>ControlPath</b>    ~/.ssh/.control-%C-2

        <b>Host</b> github.com
          <b>IdentitiesOnly</b> yes
          <b>IdentityFile</b>   ~/.ssh/github-personal-key
      `.replace(/^ {8}/mg, '').replace(/\n +$|^\n+/g, '');

      // Tab: About
      dialog.tab("About",
        $html('p',
          $txt(`This is a third-party modification to Github pages.
            It is a part of `),
          $html('a', { text:"Adamhotep's userscripts",
            href:'https://github.com/adamhotep/userscripts/' }),
          $txt(` and is in no way written, endorsed, or otherwise affiliated
            with Microsoft or Github.`)
        ),
        legal = $html('p', { class:'small' })
      );
      legal.innerHTML = meta('name') + " " + meta('version') + ", "
        + copyright.replace(/\n\n/g, "<br/><br/>")
            .replace(/\bhttps?:\/\/\S+/g, '<a href="$&">$&</a>');
    }
  }
});	// end multi-SSH-account support }}}



nf.style$(`
  /* links in comments (colors are literally 33% from comment, 67% link) */
  .pl-c a:not(:hover) { color:light-dark(#3e6792, #7796be); }

  /* Linux/X11 Firefox font tweak for fixed-width code segments */
  .CodeMirror-sizer pre { font-family:monospace !important; }

  /* Style aspects for multi-SSH-account support */
  #copier:not(.clicked) > span, #copier.clicked > svg,
    #cloner.ghuit-noalt #work-clone,
    #cloner:not(:has(a[aria-current="page"] > [data-content="SSH"])) #work-clone
    { display:none !important; }
  #setup-althost
  { margin-right:1ex; color:var(--fgColor-accent, light-dark(#16d, #49f));
    cursor:pointer; text-decoration:none; }
  #setup-althost:not(:hover) { color:initial; filter:saturate(20%); }
  #work-clone:hover, ${personal_clone}:hover { opacity:1; }
  /* multi-ssh-account dialog */
  #multi-ssh { font-size:0.8rem; width:max(40vw, 40em); }
  #multi-ssh.nfDialog .nfDialogHead { font-size:1rem; }
  #multi-ssh .nfDialogBody *:not(pre) > code, #multi-ssh pre:has(> code),
    #multi-ssh .nfDialogBody label:hover
    { background:light-dark(#fff8, #0008); }
  #multi-ssh .nfDialogBody *:not(pre) > code, #multi-ssh pre:has(> code)
    { border:1px dashed var(--bg2); }
  #multi-ssh.nfDialog .nfDialogBody *:not(pre) > code { padding:0 0.4ex; }
  #multi-ssh .nfDialogBody label
    { display:block; border-radius:1ex; padding:0.75ex 0.5ex; }
  #multi-ssh .nfDialogBody label > div:first-child
    { display:inline-block; width:18em; }
  #multi-ssh .nfDialogBody label input[type="text"] { width:16em; }
  #multi-ssh .nfDialogBody input, #multi-ssh button { font-size:0.9rem; }
  #multi-ssh #ghuit_buttons { text-align:right; padding:0 1ex; margin:0; }
  #multi-ssh pre:has(> code) { margin:0 1em; padding:1ex; }
  #multi-ssh pre > code.ssh_config b
    { color:var(--color-prettylights-syntax-entity, light-dark(#63b, #daf));
      font-weight:normal; text-shadow:0 0 0.01ex currentColor; }
  #multi-ssh .small { font-size:85%; }
  #multi-ssh .nfDialogBody .firefox-only { display:none; }
  @-moz-document url-prefix() { /* https://stackoverflow.com/a/953491/519360 */
    #multi-ssh .nfDialogBody .firefox-only { display:block; }
  }
`);
