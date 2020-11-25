const RENDER_TO_DOM = Symbol('render to dom')

// 组件
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
    return res.vdom
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }

  update() {
    // 判断是否相同节点 （简单版）
    let isSameNode = (oldNode, newNode) => {

      if (oldNode.type !== newNode.type) {
        return false
      }

      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false
        }
      }

      if (
        Object.keys(oldNode.props).length > Object.keys(newNode.props).length
      ) {
        return false
      }

      if (newNode.type == '#text') {
        if (newNode.content !== oldNode.content) {
          return false
        }
      }

      return true
    }

    let update = (oldNode, newNode) => {
      
      // type,props,children
      // #text content
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range

      // patch children
      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren

      // console.log('oldNode.vchildren',oldNode.vchildren)
      // console.log('newNode.vchildren',newNode.vchildren)
    

    if (!newChildren || !newChildren.length) {
      return
    }

    let tailRange = oldChildren[oldChildren.length - 1]._range

      for(let i=0;i<newChildren.length;i++){
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]
        if(i < oldChildren.length){
          update(oldChild,newChild)
        }else{
          let range = document.createRange()
          range.setStart(tailRange.endContainer,tailRange.endOffset)
          range.setEnd(tailRange.endContainer,tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange  = range 
          // TODO: update 
        }
      }
    }

    let vdom = this.vdom
    update(this._vdom,vdom)
    this._vdom = vdom
  }

  setState(newState) {
    console.log('setState',newState)
    
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


// 元素
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
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLocaleLowerCase()),
          value
        )
      } else {
        if (name == 'className') {
          root.setAttribute('class', value)
        } else {
          root.setAttribute(name, value)
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

function replaceContent(range, node) {
  range.insertNode(node)
  // 下面的两步是为了防止 range出错
  range.setStartAfter(node)
  range.deleteContents()

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
        child = new TextWrapper(child)
      }
      if (child === null) {
        continue
      }
      if (typeof child === 'object' && child instanceof Array) {       
        insertChildren(child)
      } else {
        e.appendChild(child)
      }
    }
  }

  insertChildren(children)
  return e
}

export function render(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}
