// Yes! I don't like to work in only 1 file too!
/**
 * Coded by BlackBird#9999 @ Discord
 * https://github.com/BlackWolfff/CloudsdaleFM-Web-Player
 */

(function() {

const STATUS_URL = "https://server.cloudsdalefm.net/status-json.xsl";
const STREAM_URL = "https://www.cloudsdalefm.net/stream";

const _getMain = nodeType => {
    // I don't want to do .main everywhere and if is long to be sure it's not just component with all that props
    let keys = Object.keys(nodeType)
    if(typeof nodeType === "object" && keys[0] === "main" && keys[3] === undefined && (keys[1] === "children" || keys[1] === "component")) {
        return nodeType.main
    }
    return nodeType
}

const createElement = (nodeType, props, ...children) => {
    if(!nodeType) throw new Error("nodeType must be defined")
    let node = null;

    if(typeof nodeType === "function") { // constructor function, aka component
        const component = new nodeType({ props, children })
        const compRender = component.render()
        if(!compRender) throw new Error("Component must return node object from render!")
        node = _getMain(compRender)
        return { main: node, component }
        // i don't want childrens if i render component
    }
    if(typeof nodeType === "object") { // already created component
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
                if(Array.isArray(child)) {
                    for(const element of child) {
                        node.appendChild(_getMain(element))
                    }
                    continue;
                }
                if(!(child instanceof Node)) {
                    if(typeof child === "object")
                        child = _getMain(child)
                    else
                        child = document.createTextNode(child)
                }
                node.appendChild(child)
            }
            return { main: node, children}
        }
    } 
    return node
}

const norm = (val, mul = false) => {
    if(mul)
        return Math.round(val * 100)
    return (val / 100).toFixed(2)
}

const audioPlayer = new (class {
    constructor() {
        this.stream = new Audio(STREAM_URL)
        this.loading = false
        this.error = false
        this.lastVolume = 0
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

    mute() {
        if(this.stream.volume <= 0) {
            this.volume = this.lastVolume
        } else {
            this.volume = 0
        }

    }

    set volume(vol) {
        if(vol < 0) vol = 0
        if(vol > 100) vol = 100
        this.lastVolume = norm(this.stream.volume, true)
        this.stream.volume = norm(vol)
        return vol
    }

    get volume() {
        return norm(this.stream.volume,true)
    }
})()

class Component { // ye.. i'm that lazy
    constructor({ props, children }) {
        this.props = props
        if(children.length > 0)
            this.children = children
    }
}

class ContextMenu extends Component {
    constructor(p) {
        super(p)
        this.open = false

        this.options = [
            {
                title: "Popup player",
                action: () => window.open("https://cloudsdalefm.net/player/", "CloudsdaleFM Player", `left=${window.outerWidth/2-200},top=50,innerWidth=420px,innerHeight=100px,resizable=false`)
            },
            {
                className: "separator"
            },
            {
                title: "Home page",
                action: () => window.open("https://www.cloudsdalefm.net/", "_blank")
            }
        ]
    }

    onContextmenu(evn) {
        evn.preventDefault()
        this.hide()
        this.show(evn)
    }

    hide() {
        if(!this.open) return;
        this.main.style.display = "none";
        this.open = false
    }
    show(evn) {
        if(this.open) return;
        this.main.style.display = "block";

        const x = evn.x
        const y = evn.y

        const Xsum = x + this.main.clientWidth
        if(window.innerWidth < Xsum) 
            this.main.style.left = window.innerWidth - this.main.clientWidth - 20 + "px"
        else 
            this.main.style.left = x + "px"

        const Ysum = y + this.main.clientHeight
        if(window.innerHeight < Ysum)
            this.main.style.top = window.innerHeight - this.main.clientHeight - 10 + "px"
        else
            this.main.style.top = y + "px"
        
        this.open = true
    }

    render() {
        const options = []
        const middle = callback => {
            return function handleEvent(evn){
                if(evn.which === 3) return
                callback(evn)
            }
        }

        for(const element of this.options) {
            let innerText = ""
            if(element.title) {
                if(typeof element.title === "function") innerText = element.title()
                else innerText = element.title
            }
            const node = createElement("li", null, innerText)
            if(element.className) 
                node.main.className = element.className
            if(element.action)
                node.main.addEventListener("mousedown", middle(element.action.bind(element)))
            options.push(node)
        }

        const wrapper = createElement(
            "div", 
            { className: "CloudsdalePlayerContextMenu" },
            createElement("ul", { className: "contentMenuList" }, options)
        )
        wrapper.main.addEventListener("contextmenu", evn => {
            evn.preventDefault() 
            evn.stopPropagation()
        })

        if(!this.props.active) return wrapper.main // don't add events

        this.props.target.addEventListener("contextmenu", this.onContextmenu.bind(this))
        window.addEventListener("mousedown", evn => {
            const keyCode = event.which || event.keyCode;
            if(evn.which != 3)
                this.hide()
        })
        window.addEventListener("keydown", (event) => {
            const keyCode = event.which || event.keyCode;
            if(keyCode == 27)
                this.hide()
        
        })
        window.addEventListener('blur', this.hide.bind(this))

        this.main = wrapper.main

        return wrapper
    }
}

class App extends Component {

    onButtonClick(action) {
        if(action) // start playing
            this.nowPlaying.listeners++
        else 
            this.nowPlaying.listeners--
        this.nowPlaying.updateState()
    }

    render() {
        this.app = createElement(
            "div", 
            { className: "window"}, 
            createElement(PlayButton, { onClick: this.onButtonClick.bind(this) }),
            createElement(
                "div", 
                { className: "rightContainer" },
                createElement(NowPlaying, { refresh: this.props.options.dataFetchFreq*1000, webTitle: this.props.options.webTitle }),
                createElement(
                    Slider, 
                    { 
                        defaultVolume: this.props.options.volume, 
                        step: this.props.options.volumeStep, 
                        useScroll: !!this.props.options.volumeStep,
                        changeColor: this.props.options.changeColor
                    }
                )
            )
        )

        this.nowPlaying = this.app.children[1].children[0].component
        return this.app
    }
}

class PlayButton extends Component{
    setState(state) {
        this.button.className = `button ${state}`
    }

    onClick(evn) {
        if(evn.buttons !== 1) return;
        if(audioPlayer.loading || audioPlayer.error) return;
        if(audioPlayer.playing) {
            audioPlayer.pause()
            this.props.onClick(false)
            this.setState("play")
        } else {
            this.setState("load")
            audioPlayer.play().then(() => {
                audioPlayer.loading = false
                this.props.onClick(true)
                this.setState("pause")
            })
            .catch(err => {
                audioPlayer.error = true
                audioPlayer.loading = false
                if(audioPlayer.playing) // it is possible that stream start playing but promise will reject.
                    audioPlayer.pause()
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
    constructor(p) {
        super(p)
        this.listeners = 0
        this.title = "Niczego"
        if(this.props.webTitle) {
            this.webTitle = document.head.getElementsByTagName("title")[0]
            if(!this.webTitle) {
                this.webTitle = document.createElement("title")
                document.head.append(this.webTitle)
            }
        }
        else this.webTitle = false
    }

    fetchData() {
        return fetch(STATUS_URL)
        .then(res => {
            if (!res.ok) return false
            return res.text()
        }).then(body => {
            const data = { title: "Niczego", listeners: 0}
            if(body === false) return data
            let source = JSON.parse(body).icestats.source
            if (typeof source === "object" && Array.isArray(source)) 
                if(source[0].hasOwnProperty("data.title")) {
                    data.title = source[0].title
                    data.listeners = source[0].listeners
                }
                else {
                    data.title = source[1].title
                    data.listeners = source[1].listeners
                }
            else if(typeof source === "object" && source.hasOwnProperty("title")) {
                data.title = source.title
                data.listeners = source.listeners
            }
            else return data
            if(!data.title) return data
            return data
        }) // this is here since first version of player, it's mess, but i'm too lazy to change it.
    }

    updateData() {
        this.fetchData().then(data => {
            this.listeners = data.listeners
            this.title = data.title
            this.updateState()
        })
    }

    updateState() {
        const marqueed = `<marquee>${this.title}</marquee>`
        if(this.songTitleNode.innerHTML !== marqueed && this.songTitleNode.innerHTML !== this.title) {
            if(this.title.length > 40)
                this.songTitleNode.innerHTML = marqueed
            else
                this.songTitleNode.innerHTML = this.title
            if(this.webTitle) 
                this.webTitle.text = this.title + " @ CloudsdaleFM.net"
        }

        let newListenres = this.getListeners()
        if(this.listenersNode.innerHTML != newListenres) // i don't know when both will be string or number so == is perfect (finally i need to use that xD)
            this.listenersNode.innerHTML = newListenres
    }

    getListeners() {
        if(this.listeners < 1) return `: Nikt :c`
        return `${this.listeners > 1 && this.listeners < 5 ? "ją" : ""}: ${this.listeners} ${this.listeners < 5 ? this.listeners === 1 ? "osoba" : "osoby" : "osób"}`
    }

    render() { 
        window.slider = this
        const listenersWrapper = createElement(
            "div", 
            { className: "listeners" }, 
            "Tej piosenki słucha", 
            createElement("span", null, this.getListeners())
        )
        const wrapper = createElement(
            "div", 
            { className: "nowPlayingContainer" },
            createElement("div", { className: "nowPlaying" }, "Całe nic"),
            listenersWrapper
        )
        
        this.listenersNode = listenersWrapper.children[1].main
        this.songTitleNode = wrapper.children[0].main

        this.updateData()
        setInterval(() => {
            this.updateData()
        }, this.props.refresh)
        
        return wrapper
    }
}

class Slider extends Component {
    constructor(props) {
        super(props)
        this.volume = this.props.defaultVolume
    }

    onScroll(evn) {
        evn.preventDefault()
        let newVol = 0
        if(evn.deltaY < 0)
            newVol = audioPlayer.volume + this.props.step
        else 
            newVol = audioPlayer.volume - this.props.step
        this.setState(newVol)
    }

    onClick(evn) {
        if(evn.buttons !== 1) return;
        const volume = norm(evn.offsetX / this.slider.clientWidth, true)
        this.setState(volume)
    } 

    setState(vol) {
        audioPlayer.volume = vol
        if(vol < 0) vol = 0
        if(vol > 100) vol = 100 //rly.. i do that in audio player already >.-.<
        this.sliderInner.style.width = `${vol}%`
        if(this.props.changeColor) 
            this.sliderInner.style.background = `hsl(${(110 - vol) + 40}, 100%, 47%)`
    }

    render() { // also, render is called once xD So i can use it like componentWillMount in React
        this.sliderInner = createElement("div", { className: "sliderInner" })
        this.setState(this.volume)

        const wrapper = createElement(
            "div", 
            { className: "sliderContainer" },
            createElement("div", { className: "slider" }, this.sliderInner)
        )
        this.slider = wrapper.children[0].main
        this.slider.addEventListener("mousedown", this.onClick.bind(this)) // maybe i should do events as props in createElement... naaaah
        this.slider.addEventListener("mousemove", this.onClick.bind(this))
        if(this.props.useScroll) 
            wrapper.main.addEventListener("mousewheel", this.onScroll.bind(this))
            // it's acually hard to aim just for slider xD Or it could be just me being retarted.

        return wrapper
    }
}

const defaultOptions = {
    contextMenu: true,
    style: "https://www.cloudsdalefm.net/player/style.css",
    autoRender: true,
    background: true,
    dataFetchFreq: 15,
    volume: 50,
    volumeStep: 5,
    changeColor: true,
    webTitle: false
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
        
        this.DOM = {}

        this.init()
    }

    init() {
        this.prepareDOM()

        if(this.options.style) 
            document.head.appendChild(createElement("link", { rel: "stylesheet", href: this.options.style }))
    }

    prepareDOM() {
        this.DOM.context = createElement(ContextMenu, { target: this.renderDom, active: this.options.contextMenu })
        this.DOM.window = createElement(App, { options: this.options })

        if(this.options.autoRender) {
            this.render(this.renderDom)
            instances.push(this)
        }
    }

    render(target = this.renderDom) {
        target.className = "CloudsdalePlayer"
        if(this.options.background)
            target.className += " withBg"
        
        if(this.options.contextMenu)
            document.body.prepend(this.DOM.context.main)
        
        target.append(this.DOM.window.main)
    }
}

window.CloudsdalePlayer = Player
window.addEventListener("DOMContentLoaded", () => {
    if(instances.length < 1) {
        console.warn("Player is added to page but not rendered! Trying to render with default settings...");
        const player = new Player("CloudsdalePlayer")
    }
})
})()