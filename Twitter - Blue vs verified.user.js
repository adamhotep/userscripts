// ==UserScript==
// @name        Twitter - Blue vs verified
// @description	Denote paid verifications
// @author      @chaoticvibing - GH @busybox11 and Adam Katz @adamhotep
// @namespace	https://github.com/adamhotep/userscripts
// @match       *://*.twitter.com/*
// @version	1.2.20221112.0
// @grant       none
// ==/UserScript==

// previous metadata
// @description 11/9/2022, 11:45:28 PM
// @updateURL    https://gist.githubusercontent.com/busybox11/53c76f57a577a47a19fab649a76f18e3/raw/twitterblue-nerd.js
// @downloadURL  https://gist.githubusercontent.com/busybox11/53c76f57a577a47a19fab649a76f18e3/raw/twitterblue-nerd.js
// YOU'RE FREE TO DO WHATEVER YOU WANT WITH THIS SCRIPT BUT IF YOU DO MAKE SOMETHING
// PLEASE MAKE SURE TO MENTION ME SOMEWHERE - I hope you'll understand why :)
// Also https://paypal.me/busybox11 because I am broke

// I'm interpreting busybox11's code as if MIT-licensed -adamhotep
// My changes are MIT licensed -adamhotep

/* INSTRUCTIONS
 *
 * - Install a userscript browser extension
 *     (I used ViolentMonkey https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag,
 *     but you can use any extension you want, such as tampermonkey, it should work fine)
 *     FIREFOX USERS: It seems to work better with TamperMonkey: https://addons.mozilla.org/fr/firefox/addon/tampermonkey/
 * - Import the script
 *     On ViolentMonkey, click on the extension icon, then gear icon (Open dashboard)
 *     There should be a plus icon on the top left hand corner, click on it and select Install from URL
 *     Use this URL: https://gist.githubusercontent.com/busybox11/53c76f57a577a47a19fab649a76f18e3/raw/twitterblue-nerd.js
 * It should now work and update by itself
 *
 */

/*
 * DISCLAIMER
 * I made this in a rush because of a challenge I convinced myself to do in reply to a tweet:
 * https://twitter.com/Quinten0508/status/1590464705822224384?s=20&t=R_KhoR4a-_3fI4n4mbmmGA
 * It might have horrible performance and it could not be reliable as I've tested this very quickly
 * on some places I could find Twitter blue checkmarks, but I haven't made much research on it.
 * At least it runs fine on my Ryzen 9 5900HS laptop and I don't see any noticeable frame drops
 * on my 165Hz QHD display since I made this script, which might be a sign it's not impacting much.
 * (I don't care anyway, fell free to modify it if it isn't)
 */

// 1.1.0 ALSO UPDATE ON HEADER OF PROFILE
// 1.1.1 AUTO UPDATE
// 1.1.2 Better handling of verified notifications
// 1.1.3 Better error logging
// 1.2.0 INITIAL VERY WIP FIREFOX SUPPORT


// CODE MODIFIED FROM https://stackoverflow.com/questions/70507318/how-to-get-react-element-props-from-html-element-with-javascript
function getReactProps(parent, target) {
    // INITIAL VERY WIP FIREFOX HANDLING
    parent = (window.chrome) ? parent : parent.wrappedJSObject;

    const keyof_ReactProps = Object.keys(parent).find(k => k.startsWith("__reactProps$"));
    const symof_ReactFragment = Symbol.for("react.fragment");

    //Find the path from target to parent
    let path = [];
    let elem = (window.chrome) ? target : target.wrappedJSObject;
    while (elem !== parent) {
        let index = 0;
        for (let sibling = elem; sibling != null;) {
            if (sibling[keyof_ReactProps]) index++;
            sibling = sibling.previousElementSibling;
        }
        path.push({ child: elem, index });
        elem = elem.parentElement;
    }
    //Walk down the path to find the react state props
    let state = elem[keyof_ReactProps];
    for (let i = path.length - 1; i >= 0 && state != null; i--) {
        //Find the target child state index
        let childStateIndex = 0, childElemIndex = 0;
        while (childStateIndex < state.children.length) {
            let childState = state.children[childStateIndex];
            if (childState instanceof Object) {
                //Fragment children are inlined in the parent DOM element
                let isFragment = childState.type === symof_ReactFragment && childState.props.children.length;
                childElemIndex += isFragment ? childState.props.children.length : 1;
                if (childElemIndex === path[i].index) break;
            }
            childStateIndex++;
        }
        let childState = state.children[childStateIndex] ?? (childStateIndex === 0 ? state.children : null);
        state = childState?.props;
        elem = path[i].child;
    }
    return state;
}


function updateBlueTick(elem, props) {
  if (props.isBlueVerified) {
    elem.parentElement.classList.add("isBlueVerified");
    elem.parentElement.title = "Twitter Blue subscriber, unverified";
  }
}

function handleMutation(mutations) {
  try {
    for (mutation of mutations) {
      for (elem of mutation.addedNodes) {
        const blueticks = elem.querySelectorAll('[aria-label="Verified account"]')

        try {
          for (bluetick of blueticks) {
            if (bluetick !== null) {
              let propsElem = getReactProps(bluetick.parentElement, bluetick)

              if (propsElem.children !== undefined) {
                const props = propsElem.children[0][0].props
                if (props.isBlueVerified !== undefined) {
                  updateBlueTick(bluetick, props)
                } else {
                  // VERY HACKY FIX DO BETTER NEXT TIME
                  const otherProps = propsElem.children[0][2].props
                  updateBlueTick(bluetick, otherProps)
                }
              } else {
                const propsElemParent = getReactProps(bluetick.parentElement.parentElement.parentElement, bluetick.parentElement.parentElement)
                const propsParent = propsElemParent.children[0][0].props
                updateBlueTick(bluetick, propsParent)
              }
            }
          }
        } catch(e) {console.log(e)}
      }
    }
  } catch(e) {}
}

const observer = new MutationObserver(handleMutation)
observer.observe(document, { childList: true, subtree: true })


let style = document.createElement('style');
style.setAttribute('type', 'text/css');
document.head.appendChild(style);
style.textContent = /* syn=css */ `

  .isBlueVerified::before {
    content: "💰"; text-align:center; background-color:#1d9bf0aa;
    border-radius:1em; width:2.5ex; height:2.5ex;
    margin-left:0.4ex; padding:1px; font-size:75%;
  }
  .isBlueVerified:hover::before { background-color:#1d9bf0; }
  .isBlueVerified svg { display:none; }

`;
