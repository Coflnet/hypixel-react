import React from 'react';
import ReactDOM from 'react-dom';
import './bootstrap-react.min.css';
import './bootstrap-dark-full.min.css';
import './index.css';
//import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from "react-router-dom";
import routes from "../src/routes";


ReactDOM.render(
  <div id="react-container">
    <BrowserRouter children={routes} />
  </div>
  , document.getElementById('root'))
