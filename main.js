(function() {

const createElement = (nodeType, props, ...children) => {
    if(!nodeType) throw new Error("nodeType must be defined")
    let node = null
    if(typeof nodeType === "function") { // constructor function, aka component
        const component = new nodeType(props)
        const compRender = component.render()
        if(!compRender) throw new Error("Component must return node object from render!")
        if(compRender.hasOwnProperty("main"))
            node = compRender.main
        else 
            node = compRender
        // i don't want childrens if i render component
    }
    else if(typeof nodeType === "object") { // already created component
        node = nodeType.render()
    } else { // probaly string, please be a string!
        node = document.createElement(nodeType)
        if(props && typeof props === "object") {
            for(const [key, val] of Object.entries(props)) {
                node[key] = val
            }
        }
        if(children.length > 0) {
            for(let child of children) {
                if(!(child instanceof Node))
                    child = document.createTextNode(child)
                node.appendChild(child)
            }
            return { main: node, children}
        }
    }
    return node
}

const audioPlayer = new (class {
    constructor() {
        this.stream = new Audio("https://www.cloudsdalefm.net/stream")
        this.loading = false
        this.error = false
    }

    get playing() {
        return !this.stream.paused
    }

    pause() {
        if(!this.playing) return;
        this.stream.pause()
    }

    play() {
        if(this.playing) return;
        this.stream.load()
        this.loading = true
        return this.stream.play()
    }
})()

class Component { // ye.. i'm that lazy
    constructor(props) {
        this.props = props
    }
}

class ContextMenu extends Component{
    render() {
        return createElement("div", { className: "contextMenu" }, "This is context Menu!")
    }
}

class PlayButton extends Component{
    setState(state) {
        this.button.className = `button ${state}`
    }

    onClick() {
        if(audioPlayer.loading || audioPlayer.error) return;
        if(audioPlayer.playing) {
            audioPlayer.pause()
            this.setState("play")
        } else {
            this.setState("load")
            audioPlayer.play().then(() => {
                audioPlayer.loading = false
                this.setState("pause")
            })
            .catch(err => {
                audioPlayer.error = true
                audioPlayer.loading = false
                this.setState("fail")
            })
        }
    }

    render() {
        const container = createElement("div", { className: `button play` })
        container.addEventListener("mousedown", this.onClick.bind(this))
        this.button = container
        return container
    }
}

class NowPlaying extends Component {
    render() { 
        const listenersWrapper = createElement(
            "div", 
            { className: "listeners" }, 
            "Tej piosenki słucha: ", 
            createElement("span", null, 0).main, 
            " osób"
        )
        const wrapper = createElement(
            "div", 
            { className: "nowPlayingContainer" },
            createElement("div", { className: "nowPlaying" }, "Some song title").main,
            listenersWrapper.main
        )
        let listeners = 0
        this.listenersNode = listenersWrapper.children[1]
        this.songTitleNode = wrapper.children[0]

        setInterval(() => {
            listeners++
            this.listenersNode.innerHTML = listeners
        },50)
        return wrapper.main
    }
}

const defaultOptions = {
    contextMenu: true,
    style: "./style.css",
    autoRender: true,
    background: true
}

const instances = []

class Player {
    constructor(domRenderNodeName, options) {
        if(instances.length > 0)
            throw new Error("CloudsdalePlayer already exists and is rendered!")
        

        this.renderDom = document.getElementsByTagName(domRenderNodeName)[0] || document.getElementById(domRenderNodeName)
        if(!this.renderDom) {
            throw new Error(`Node with tag or id ${domRenderNodeName} not found!`)
        }
        this.options = {
            ...defaultOptions,
            ...options
        }
        

        this.init()
    }

    init() {
        if(this.options.autoRender) {
            this.render(this.renderDom)
            instances.push(this)
        }
        if(this.options.style)
            document.head.appendChild(createElement("link", { rel: "stylesheet", href: this.options.style }))
    }

    render(target) {
        target.className = "CloudsdalePlayer"
        if(this.options.background)
            target.className += " withBg"
        
        if(this.options.contextMenu)
            target.append(createElement(ContextMenu, null))
        
        target.append(
            createElement(
                "div", 
                { className: "window"}, 
                createElement(PlayButton, { imgUrl: this.options.images }),
                createElement(
                    "div", 
                    { className: "rightContainer" },
                    createElement(NowPlaying, null)
                ).main
            ).main
        )
    }
}

window.CloudsdalePlayer = Player
window.addEventListener("DOMContentLoaded", () => {
    if(instances.length < 1) {
        console.warn("Player is added to page but not rendered! Trying to render with default settings...");
        const player = new Player("CloudsdalePlayer")
        console.log(player)
        window.a = player
    }
})
})()