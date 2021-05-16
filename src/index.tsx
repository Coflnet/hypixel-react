import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from "react-router-dom";
import routes from "../src/routes";
import { websocketHelper } from "./api/WebsocketHelper"

websocketHelper.init();

ReactDOM.render(
  <div>
    <BrowserRouter children={routes} />
  </div>
  , document.getElementById('root'))
