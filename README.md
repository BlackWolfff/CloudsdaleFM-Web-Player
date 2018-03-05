# CloudsdaleFM Web Player
Simple custom controls for HTML5 Audio.

It renders itself inside given html tag or tag with that id. I tried to imitate React just to make creating DOM element bit easier, I should use html template or something but meh.

# Usage
This player will be on cloudsdale serwer, so you can just attach main.js to your site and point it to div with
```js
new CloudsdalePlayer("Tag name or Div ID")
```
Player automaticly adds default stylesheet to your web page! See Options to see how to change/disable that

Script will try to attach player even if you didin't tell it to, it will look for div with id `CloudsdalePlayer`

This player have some options that you can play with eg. if you want to use contex menu.

You add them with passing object as 2nd argument to constructor
```js
new CloudsdalePlayer("someID", { contextMenu: false })
```
## Avaible options are:
+ `dataFetchFreq`: `Number` - Delay between song title and listeners amount updates, is seconds
    - default: `15`
+ `volume`: `Number` - Default volume that player will start on in %
    - default: `50`
+ `volumeStep`: `Number` - How much volume increase/decrease when scrolled over slider
    - default: `5`
+ `style`: `String` - URL path to your own stylesheet that will be attached to head, pass `false` to disable that.
    - default: `./style.css`
+ `contextMenu`: `Boolean` - Enable/Disable menu that appears when right clicked on player.
    - default: `true`
+ `background`: `Boolean` - If true div that player was attached to will automaticly get `withBG` class along with `CloudsdalePlayer`
    - default: `true`
+ `autoRender`: `Boolean` - If true Player will automaticly render when created, it should stay true.
    - default: `true`

# Example
In HTML
```html
<div id="CloudsdalePlayer"></div>
```
or (this can sometimes not work)
```html
<CloudsdalePlayer />
```

Then in HTML create `<script>` tag that contains
```js
new CloudsdalePlayer("CloudsdalePlayer")
```
So whole player on page would look like this
```html
<div id="player"></div>
<script>
    new CloudsdalePlayer("player");
</script>
```
