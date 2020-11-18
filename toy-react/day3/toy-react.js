const RENDER_TO_DOM = Symbol('render to dom')

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }

  setAttribute(name, value) {
    this.props[name] = value
  }

  appendChild(component) {
    this.children.push(component)
  }

  get vdom() {
    const res = this.render()
    console.log('get vdom render', res)
    debugger
    return res.vdom
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }

  update() {
    let isSame
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      // 第一次渲染
      this.state = newState
      this.rerender()
      return
    }

    // 非第一次渲染
    const merge = (oldState, newState) => {
      // 简单的diff
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          // 递归
          merge(oldState[p], newState[p])
        }
      }
    }

    merge(this.state, newState)
    this.update()
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type)
    this.type = type
  }

  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom)
    return this
  }

  [RENDER_TO_DOM](range) {
    this._range = range

    let root = document.createElement(this.type)

    for (let name in this.props) {
      let value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        // 把匹配到的首字母变为小写
        this.root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLocaleLowerCase()),
          value
        )
      } else {
        if (name == 'className') {
          this.root.setAttribute('class', value)
        } else {
          this.root.setAttribute(name, value)
        }
      }
    }

    if (!this.vchildren) {
      this.vchildren = this.children((child) => child.vdom)
    }

    for (let child of this.vchildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }

    replaceContent(range, root)
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = '#text'
    this.content = content
  }

  get vdom() {
    return this
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    let root = document.createTextNode(this.content)
    replaceContent(range, root)
  }
}


function replaceContent(range,node){
  range.insertNode(node)
  // 下面的两步是为了防止 range出错
  range.setStartAfter(node)
  range.deletContents()

  // 替换
  range.setStartBefore(node)
  range.setEndAfter(node)
}







export function createElement(type, attributes, ...children) {
  let e
  if (typeof type == 'string') {
    e = new ElementWrapper(type)
  } else {
    e = new type()
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p])
  }

  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child == 'string') {
        child = new TextW()
      }
    }
  }

  insertChildren(children)
  return e
}
