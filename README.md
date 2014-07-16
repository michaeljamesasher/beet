beet
====

Flow based programming using webpages.

Basic idea is to have each block an ordinary web page so we can use the wealth of javascript libraries out there and each block can be debugged independently. The only strict format is that each block have somewhere a js function named 'main' which takes the desired inputs and returns the output. 'main' will be called each time the inputs are changed. To include interaction, simply include listeners which call main when a user does something.


There are alternatives, such as http://meemoo.org/ and http://noflojs.org/. However they each have their own format which makes turning a webpage into a block a bit of a pain.
