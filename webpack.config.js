module.exports = {
  mode:"development",
  entry:{
    day1:'./toy-react/day1/index.js'
  },
  module:{
    rules:[
      {
        test:/\.js$/,
        use:{
          loader:'babel-loader',
          options:{
            presets:['@babel/preset-env'],
            plugins:[
              ['@babel/plugin-transform-react-jsx',
              {pragma:'createElement'}]
            ]
          }
        }
      }
    ]
  },
  // optimization:{
  //   minimize:false
  // }
}