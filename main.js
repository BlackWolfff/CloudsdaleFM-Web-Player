(function() {

const STATUS_URL = "https://server.cloudsdalefm.net/status-json.xsl";
const STREAM_URL = "https://www.cloudsdalefm.net/stream";

const _getMain = nodeType => {
    // I don't want to do .main everywhere and if is long to be sure it's not just component with all that props
    let keys = Object.keys(nodeType)
    if(typeof nodeType === "object" && keys[0] === "main" && keys[1] === "children" && keys[2] === undefined) {
        return nodeType.main
    }
    return nodeType
}

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
        return Math.floor(val * 100)
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
        if(this.stream.volume <= 0.001) {
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
    constructor(p) {
        super(p)
        this.listeners = 0
        this.title = "Niczego"
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
            if (data.title.length > 35) {
                data.title = `<marquee>${data.title}</marquee>`
            }
            return data
        }) // this is here since first version of player, it's mess, but i'm too lazy to change it.
    }

    updateData() {
        this.fetchData().then(data => {
            this.reRender(data.title, data.listeners)
        })
    }

    reRender(title, listeners) {
        const titleNode = this.songTitleNode.main
        const listenersNode = this.listenersNode.main
        if(titleNode.innerHTML !== title)
            titleNode.innerHTML = title
        if(listenersNode.innerHTML != listeners) // i don't know when both will be string or number so == is perfect (finally i need to use that xD)
            listenersNode.innerHTML = listeners
    }

    render() { 
        const listenersWrapper = createElement(
            "div", 
            { className: "listeners" }, 
            "Tej piosenki słucha: ", 
            createElement("span", null, this.listeners), 
            " osób"
        )
        const wrapper = createElement(
            "div", 
            { className: "nowPlayingContainer" },
            createElement("div", { className: "nowPlaying" }, this.title),
            listenersWrapper
        )
        
        this.listenersNode = listenersWrapper.children[1]
        this.songTitleNode = wrapper.children[0]

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
        this.volume = props.defaultVolume
    }

    onScroll(evn) {
        let newVol = 0
        if(evn.deltaY < 0)
            newVol = audioPlayer.volume + this.props.step
        else 
            newVol = audioPlayer.volume - this.props.step
        console.log(newVol)
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
        this.sliderInner.style.width = `${vol}%`
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
        this.slider.addEventListener("mousewheel", this.onScroll.bind(this))

        return wrapper
    }
}

const defaultOptions = {
    contextMenu: true,
    style: "./style.css",
    autoRender: true,
    background: true,
    dataFetchFreq: 15,
    volume: 50,
    volumeStep: 5
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
        this.DOM.context = createElement(ContextMenu, null)
        this.DOM.window = createElement(
            "div", 
            { className: "window"}, 
            createElement(PlayButton, { imgUrl: this.options.images }),
            createElement(
                "div", 
                { className: "rightContainer" },
                createElement(NowPlaying, { refresh: this.options.dataFetchFreq*1000 }),
                createElement(
                    Slider, 
                    { defaultVolume: this.options.volume, step: this.options.volumeStep }
                )
            )
        )

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
            target.append(this.DOM.context)
        
        target.append(this.DOM.window.main)
    }
}

window.CloudsdalePlayer = Player
window.addEventListener("DOMContentLoaded", () => {
    if(instances.length < 1) {
        console.warn("Player is added to page but not rendered! Trying to render with default settings...");
        const player = new Player("CloudsdalePlayer")
        console.log(player)
        window.p = player
    }
})
})()