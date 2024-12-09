import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global CSS
import App from './App'; // Main App component
import reportWebVitals from './reportWebVitals'; // For performance metrics
import { BrowserRouter } from 'react-router-dom'; // React Router for routing
import GeneralContextProvider from './context/GeneralContext'; // Custom Context Provider

// Create root element and render the app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GeneralContextProvider>
        <App />
      </GeneralContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Measure app performance (optional)
reportWebVitals(console.log); // Replace with a custom function or an analytics service if needed
