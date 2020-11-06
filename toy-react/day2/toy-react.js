const RENDER_TO_DOM = Symbol('render to doms')


class ElementWrapper {
  constructor(type){
    this.root = document.createElement(type)
  }

  setAttribute(name,value){
    if(name.match(/^on([\s\S]+)$/)){
      // 把匹配到的首字母变为小写
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c=>c.toLocaleLowerCase()),value)    
    }else{
      if(name == 'className'){
        this.root.setAttribute('class',value)
      }else{
        this.root.setAttribute(name,value)
      }
    }
  }

  appendChild(component){
    let range = document.createRange()
    range.setStart(this.root,this.root.childNodes.length)
    range.setEnd(this.root,this.root.childNodes.length)
    // range的位置在root的子节点的最后面
    component[RENDER_TO_DOM](range)
  }

  [RENDER_TO_DOM](range){
    range.deleteContents()
    range.insertNode(this.root)
  }

}

class TextWrapper {
  constructor(content){
    
  }
}