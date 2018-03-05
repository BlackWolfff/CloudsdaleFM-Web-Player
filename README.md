# CloudsdaleFM Web Player
Simple custom controls for HTML5 Audio.

It renders itself inside given html tag or tag with that id. I tried to imitate React with all that `createElement` just to make creating DOM element bit easier, I should use html template or something but meh. It doesn't matter if you don't care about code, it's fast don't worry.

Remember that player will still 'work' even if you don't render it! It will still download data in background etc.

# Usage
This player will be on cloudsdale serwer (when it will be done, duh) so you can just attach one js file from `probably https://cloudsdale.net/player.js ? idk` to your site and point it to div with
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
First, you need to add main js file to your site with
```html
</script src="url later"></script>
```
Just put it in somewhere in head

Then anywhere on your site
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
Remember that player tries to render right away so in <head> you need to wait for DOM to load with event or something, you can always turn off auto render and then render it in body or event.

Best way to deal with this is to put that ^ in <body> tag after div or tag for the player.

So whole player on page would look like this
```html
<!-- Somewhere in head -->
</script src="url later"></script>

<!-- Now in body -->
<div id="player"></div>
<script>
    new CloudsdalePlayer("player");
</script>
```
Buuut... let's say we don't want context menu, a (Mega)bit smaller data usage, player starting at 10 volume, and we have our own style without background... easy!
```html
<!-- Don't forget to attach main js etc.-->
<div id="player"></div>
<script>
    new CloudsdalePlayer("player", {
        contextMenu: false,
        dataFetchFreq: 60,
        volume: 10,
        style: "./BetterThanDefault.css",
        background: false
    });
</script>
```
Done!
