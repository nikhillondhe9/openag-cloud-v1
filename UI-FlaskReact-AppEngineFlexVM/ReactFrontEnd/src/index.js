import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import App from './js/App';
import registerServiceWorker from './js/registerServiceWorker';
import 'bootstrap/dist/css/bootstrap.css';
import { CookiesProvider } from 'react-cookie'

ReactDOM.render(<CookiesProvider>

    <App />
  </CookiesProvider>, document.getElementById('root'));
registerServiceWorker();