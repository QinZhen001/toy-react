import {createElement,Component,render} from './toy-react'

class MyComponent extends Component {
  render(){
    return (<div>
        <h1>my Component</h1>
        {this.children}
      </div>)
  }
}

render(<MyComponent id='a' class='c'>
  <div>111</div>
  <div>222</div>
  <div>3333</div>
</MyComponent>,document.body)

















