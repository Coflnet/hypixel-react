import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom'
import routes from './routes';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <BrowserRouter children={routes} />
  , document.getElementById('root'))

serviceWorker.register();
