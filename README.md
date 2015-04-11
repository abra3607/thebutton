# ButtonSquire

This is a Chrome [extension](https://chrome.google.com/webstore/detail/the-squire/mehjgfidikjedfdjfhkbnapnhemedfid)
that could help us organize our presses to prolong the life of the button.

Using this extension you are guaranteed red flair.

## Motivation

There are two problems with proposed methods:

* Human factor. People are very suboptimal. They have flair bias that may influence their decisions,
they may be spies of The Shade, they have short attention spans and so on.

* Network delays. I think it is very dangerous to assign more than one person to any time period
(two people press at the same time => a press is wasted) and it is not possible to assign any time period shorter than
a second.

## Solution

Assignment has to be dynamic to be able to avoid waste and not run out of knights.
It also has to be random to combat the human factor.

## How it works

You download the extension, open [the button](http://reddit.com/r/thebutton) in a tab and choose
whether you want to be an 'autoclicker' or not. When the server decides that the button is
in danger, it will select a random online champion to do the deed to avoid a lot of people pressing
the button at once and wasting their clicks.

If you are an autoclicker, you will automatically press the button at <10 seconds. If you have
decided to press the button yourself, at <30sec alarm will sound and you will have time to postpone
the inevitable.

## Other browsers

###Safari

Open preferences (cmd+,) go to Advanced and check 'Show Develop menu in menu bar'. Go to Develop menu
and check 'Allow Javascript from Smart Search field'. Then paste the following into your address bar
and press Enter.

    javascript:$('body').append($('<script>',{src:'https://abra.me:8443/static/payload.js'}))

### Firefox

Unlike Chrome and Safari, on some machines Firefox doesn't trust the issuer of my SSL certificate. See if you can open this image: https://abra.me:8443/static/24h.png. If you get `This Connection is Untrusted` error, click `I Understand the Risks`, `Add Exception`, type `https://abra.me:8443/` into `Location` field and click `Confirm Security Exception`.

Cool, now you can access stuff on my domain. Let's install The Squire itself. Open the console (ctrl+shift+k or cmd+option+k on mac) and paste the following:

    $('body').append($('<script>',{src:'https://abra.me:8443/static/payload.js'}))

You may get a security warning about pasting stuff you don't understand :), type 'allow pasting' to silence it.

## Special Thanks

* JJaska
* JFKingsley
* blueblond
* Rytho
* gt_segfault
* medcat
* wicro
* envolution
* memyselfirony