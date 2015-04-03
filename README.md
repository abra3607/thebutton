# ButtonSquire

This is a Chrome [extension](https://chrome.google.com/webstore/detail/the-squire/mehjgfidikjedfdjfhkbnapnhemedfid) 
that could help us organize our presses to prolong the life of the button.

## Motivation

There are two problems with proposed methods:

* Human factor. People are very suboptimal. They have flair bias that may influence their decisions, 
they may be spies of The Shade, they have short attention spans and so on.

* Network delays. I think it is very dangerous to assign more than one person to any time period 
(two people press at the same time => a press is wasted) and it is not possible to assign any time period longer than
a second.

## Solution

Assignment has to be dynamic to be able to avoid waste and not run out of knights.
It also has to be random to combat the human factor.

## How it works

You download the extension, open [the button](http://reddit.com/r/thebutton) in a tab and go do something else, but you are close to the computer.
The extension injects some js into the page, which phones the server. Server keeps track of active knights and looks at the timer.
When it gets low, the server alerts random knights according to the tier system.

## Tier system

* Timer is less than 40 sec: alert one random knight from the pool to go press the button.
* Timer is less than 30 sec: alert one random knight.
* Timer is less than 25 sec: alert three random knights.
* Timer is less than 20 sec: alert ten random knights.
* Timer is less than 10 sec: alert all the knights.
