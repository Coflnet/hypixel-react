import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from "react-router-dom";
import routes from "../src/routes";

ReactDOM.render(
  <div>
    <BrowserRouter children={routes} />
    <footer className="footer">
      <a href="https://coflnet.com/impressum" className="link">Imprint</a>
      <a href="https://coflnet.com/terms" className="link">Terms of Use</a>
    </footer>
  </div>
  , document.getElementById('root'))
