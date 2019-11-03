import React from 'react'
import { render } from 'react-dom'
import { App } from './components/App'
import { css, Global } from '@emotion/core'

const globalStyle = css`
  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  #app {
    display: flex;
    height: 100%;
    flex-direction: column;
  }
`

render(
  <>
    <Global styles={globalStyle} />
    <App />
  </>,
  document.getElementById('app')
)
