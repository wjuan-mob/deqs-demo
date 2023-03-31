import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import App from './test';
import reportWebVitals from './reportWebVitals';
import QuoteList from './QuoteList';
import {ItemList} from './QuoteList';
import { CurrencyPairs } from './QuoteList';

// Import the background image
import backgroundImage from './background.png';

// Set the background image as the background for the body element
document.body.style.backgroundImage = `url(${backgroundImage})`;
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundPosition = 'center center';
document.body.style.backgroundRepeat = 'no-repeat';

const items = [
  { pair: 'A/B', quantity: '0M', bid: 1.12, ask: 1.13 },
  { pair: 'A/B', quantity: '1M', bid: 1.11, ask: 1.14 },
  { pair: 'A/B', quantity: '2M', bid: 1.10, ask: 1.15 },
  { pair: 'A/B', quantity: '5M', bid: 1.08, ask: 1.17 },
  { pair: 'A/B', quantity: '10M', bid: 1.05, ask: 1.20 },
  { pair: 'C/D', quantity: '0M', bid: 2.12, ask: 2.13 },
  { pair: 'C/D', quantity: '1M', bid: 2.11, ask: 2.14 },
  { pair: 'C/D', quantity: '2M', bid: 2.10, ask: 2.15 },
  { pair: 'C/D', quantity: '5M', bid: 2.08, ask: 2.17 },
  { pair: 'C/D', quantity: '10M', bid: 2.05, ask: 2.20 },
  { pair: 'E/F', quantity: '0M', bid: 3.12, ask: 3.13 },
  { pair: 'E/F', quantity: '1M', bid: 3.11, ask: 3.14 },
  { pair: 'E/F', quantity: '2M', bid: 3.10, ask: 3.15 },
  { pair: 'E/F', quantity: '5M', bid: 3.08, ask: 3.17 },
  { pair: 'E/F', quantity: '10M', bid: 3.05, ask: 3.20 },
  { pair: 'G/H', quantity: '0M', bid: 4.12, ask: 4.13 },
  { pair: 'G/H', quantity: '1M', bid: 4.11, ask: 4.14 },
  { pair: 'G/H', quantity: '2M', bid: 4.10, ask: 4.15 },
  { pair: 'G/H', quantity: '5M', bid: 4.08, ask: 4.17 },
  { pair: 'G/H', quantity: '10M', bid: 4.05, ask: 4.20 },
  { pair: 'I/J', quantity: '0M', bid: 5.12, ask: 5.13 },
  { pair: 'I/J', quantity: '1M', bid: 5.11, ask: 5.14 },
  { pair: 'I/J', quantity: '2M', bid: 5.10, ask: 5.15 },
  { pair: 'I/J', quantity: '5M', bid: 5.08, ask: 5.17 },
  { pair: 'I/J', quantity: '10M', bid: 5.05, ask: 5.20 },
];

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuoteList />
    {/* <CurrencyPairs /> */}
    <ItemList items={items} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
