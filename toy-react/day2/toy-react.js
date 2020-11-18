const RENDER_TO_DOM = Symbol('render to doms')

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }

  setAttribute(name, value) {
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

  appendChild(component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    // range的位置在root的子节点的最后面
    component[RENDER_TO_DOM](range)
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }

}

// 文本节点
class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

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

  [RENDER_TO_DOM](range) {
    this._range = range
    // render 外部使用定义
    // let res = this.render()
    // console.log('this.render',res)

    // 这里的逻辑是this.render()返回的是组件的话递归这个方法
    // 返回的是 ElementWrapper 或 TextWrapper 就 range.insertNode
    this.render()[RENDER_TO_DOM](range) 
  }

  rerender() {
    let oldRange = this._range
    console.log('oldRange', oldRange)

    // 新的range插入旧的range前面
    let range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range)

    // 旧的range 变成在 新的range后面
    oldRange.setStart(range.endContainer, range.endOffset)
    // 只读属性 Range.endOffset 返回代表 Range 结束位置在 Range.endContainer 中的偏移值的数字。
    oldRange.deleteContents()
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      // 第一次渲染
      this.state = newState
      this.rerender()
      return
    }

    // 非第一次渲染
    const merge = (oldState,newState) => {
      // 简单的diff
      for(let p in newState){
        if(oldState[p] === null || typeof oldState[p] !== 'object'){
          oldState[p] = newState[p]
        }else{
          // 递归
          merge(oldState[p],newState[p])
        }
      }
    } 


    merge(this.state,newState)
    this.rerender()
    
  }
}

// @babel/plugin-transform-react-jsx 会把标签解析成createElement
export function createElement(type,attributes,...children){
  let e 
  if(typeof type === 'string'){
    e = new ElementWrapper(type)
  }else{
    e = new type
  }

  for(let p in attributes){
    e.setAttribute(p,attributes[p])
  }

  // console.log("outer this",this) undefined
  let insertChildren = (children) => {
    // console.log("innner this",this) undefined
    for(let child of children){
      if(typeof child == 'string'){
          child = new TextWrapper(child)
      }
      if(child === null){
        continue 
      }
      if(typeof child === 'object' && child instanceof Array){
        insertChildren(child)
      }else{
        e.appendChild(child)
      } 
    }
  }


  // console.log('children',children)
  insertChildren(children)
  return e
}


export function render(component,parentElement){
  let range = document.createRange()
  range.setStart(parentElement,0)
  range.setEnd(parentElement,parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}