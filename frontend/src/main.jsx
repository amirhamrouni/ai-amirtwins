import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="bottom-left"
      toastOptions={{
        style: { background: '#1E1E1E', color: '#E0E0E0', border: '1px solid #2A2A2A' },
      }}
    />
  </BrowserRouter>
);
