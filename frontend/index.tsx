
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
console.log("rootElement found:", !!rootElement);
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("calling createRoot");
const root = ReactDOM.createRoot(rootElement);
console.log("calling render");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
