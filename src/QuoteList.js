import React, { Component, useState, useEffect, useRef } from 'react';
import logo from './logo.png';
import currency_config from './currency_config.json';
import { Tooltip } from 'react-tooltip';
import { areTokensInOrder, getTradingPairKey, getTokenName, selectQuotesForDesiredAmount } from './QuoteHelper';
import './QuoteList.css';


const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
const { Pair, GetQuotesRequest, GetQuotesResponse, Quote } = require('./deqs_pb.js');
const { SignedContingentInput } = require('./external_pb.js');
const { PingPongClient } = require('./deqs_grpc_web_pb');
const { PingRequest, PongResponse } = require('./deqs_pb.js');

const Amounts = [0, 1, 2, 3, 4, 5];

const enableDevTools = window.__GRPCWEB_DEVTOOLS__ || (() => {
});

var client = new DeqsClientAPIClient('http://localhost:9090', null, null);

const quoteIdStyle = {
    margin: '10px 0',
    padding: '10px',
    backgroundColor: '#f2f2f2'
}

const quoteItemStyle = {
    fontWeight: 'bold'
}

const boxesWithScrollbarStyle = {
    border: '1px solid black',
    padding: '10px',
    margin: '10px',
    borderRadius: '10px',
    overflow: 'hidden', // hide overflowing text
    textOverflow: 'ellipsis', // add ellipsis to truncated text
    whiteSpace: 'nowrap', // prevent text from wrapping
    maxWidth: '100%', // set a maximum width to avoid expanding beyond the box
};

const truncatedStyle = {
    border: '1px solid black',
    padding: '10px',
    margin: '10px',
    borderRadius: '10px',
    overflow: 'hidden', // hide overflowing text
    textOverflow: 'ellipsis', // add ellipsis to truncated text
    whiteSpace: 'nowrap', // prevent text from wrapping
    maxWidth: '100%', // set a maximum width to avoid expanding beyond the box
};



const groupHeaderStyle = {
    marginBottom: '10px',
};

const bucketizeQuotesForAllAmounts = (amounts, pairToQuotesMap) => {
    const result = {};
    console.log("inside buckets");
    for (const [pairString, quotes] of pairToQuotesMap) {
        const pair = JSON.parse(pairString);
        console.log("bucketizing: " + getTradingPairKey(pair));
        console.log("quotes: " + quotes.length);
        const selectedQuotesMap = {};
        for (const amount of amounts) {
            selectedQuotesMap[amount] = selectQuotesForDesiredAmount(amount, quotes);
            console.log("selected quotes for amount");
            console.log(amount);
            console.log("price" + selectedQuotesMap[amount].price);
            console.log(selectedQuotesMap[amount].quotes);
        }
        result[pairString] = selectedQuotesMap;
    }
    return result;
};

const groupBy = (items, key) => {
    return items.reduce((result, item) => {
        const group = item[key];
        result[group] = result[group] || [];
        result[group].push(item);
        return result;
    }, {});
};
const groupBoxStyle = {
    border: '1px solid black',
    borderRadius: '10px',
    padding: '10px',
    marginBottom: '10px',
    height: '300px', // set a fixed height for the grouping box
};

const groupWrapperStyle = {
    width: '100%',
    margin: '0',
};

const smallTextStyle = {
    fontSize: '0.8em',
};

const renderItemName = (name) => {
    const MAX_LENGTH = 5;
    const displayName = name ? (name.length > MAX_LENGTH ? `${name.slice(0, MAX_LENGTH)}...` : name) : 'null';
    return (
        <div>
            <Tooltip id={`tooltip-${name}`} place="bottom" effect="solid">
                {name || 'null'}
            </Tooltip>
            <div data-tip data-for={`tooltip-${name}`}>
                {displayName}
            </div>
        </div>
    );
};


export function ItemList({ items }) {
    const groupedItems = groupBy(items, 'pair');

    return (
        <div className="item-list" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '10px' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gridGap: '10px',
                }}
            >
                {Object.keys(groupedItems).map((group) => (
                    <div key={group} className="item-group" style={{ backgroundColor: 'white', borderRadius: '5px', padding: '10px' }}>
                        <h2>{group}</h2>
                        {groupedItems[group].map((item, index) => (
                            <div
                                key={item.id}
                                style={{
                                    ...truncatedStyle,
                                    ...(index !== 0 && smallTextStyle),
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    backgroundColor: 'transparent'
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: 'rgba(120, 220, 140, 0.8)',
                                        padding: '10px',
                                        borderRadius: '5px',
                                    }}
                                >
                                    <h3>Bid</h3>
                                    <div>{renderItemName(item.bid)}</div>
                                </div>
                                <div style={{ fontSize: '24px', margin: '0 10px' }}>{item.quantity}</div>
                                <div
                                    style={{
                                        backgroundColor: 'rgba(220, 120, 140, 0.8)',
                                        padding: '10px',
                                        borderRadius: '5px',
                                    }}
                                >
                                    <h3>Ask</h3>
                                    <div>{renderItemName(item.ask)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

function buildGetQuotesRequests() {
    const limit = 100;
    const requests = [];
    const distinctPairs = new Set(); // To keep track of distinct pairs

    currency_config.pairs.forEach((config_pair) => {
        const pair = new Pair();
        const baseTokenId = config_pair.base_token_id;
        const counterTokenId = config_pair.counter_token_id;
        pair.setBaseTokenId(baseTokenId);
        pair.setCounterTokenId(counterTokenId);
        const pairKey = `${baseTokenId}_${counterTokenId}`;
        const swappedPairKey = `${counterTokenId}_${baseTokenId}`;
        if (distinctPairs.has(pairKey) || distinctPairs.has(swappedPairKey)) {
            return; // Skip duplicates
        }
        // Add the request for the original pair
        const originalRequest = new GetQuotesRequest();
        originalRequest.setPair(pair);
        originalRequest.setBaseRangeMin(1);
        originalRequest.setBaseRangeMax(1000000);
        originalRequest.setLimit(limit);
        requests.push({ request: originalRequest, baseTokenId, counterTokenId });

        distinctPairs.add(`${baseTokenId}_${counterTokenId}`); // Add the current pair to the set
        // Add the request for the swapped pair
        const swappedPair = new Pair();
        swappedPair.setBaseTokenId(counterTokenId);
        swappedPair.setCounterTokenId(baseTokenId);
        const swappedRequest = new GetQuotesRequest();
        swappedRequest.setPair(swappedPair);
        swappedRequest.setBaseRangeMin(1);
        swappedRequest.setBaseRangeMax(1000000);
        swappedRequest.setLimit(limit);
        requests.push({ request: swappedRequest, baseTokenId: counterTokenId, counterTokenId: baseTokenId });

        distinctPairs.add(`${counterTokenId}_${baseTokenId}`); // Add the current pair to the set
    });
    console.log(`Distinct pairs: ${Array.from(distinctPairs).join(", ")}`); // Log the distinct pairs
    return requests;
}

function handleGetQuotesResponse(response, setQuotesMap, countRef) {
    const newQuotesData = new Map();
    const quotesList = response.getQuotesList();
    quotesList.forEach((quote) => {
        const id = quote.getId().toString();
        const pair = quote.getPair();
        const base_token_id = pair.getBaseTokenId();
        const counter_token_id = pair.getCounterTokenId();
        const blockVersion = quote.getSci().getBlockVersion();
        const requiredOutputAmounts = {
            amount: quote
                .getSci()
                .getRequiredOutputAmountsList()
                .reduce((accumulator, amount) => {
                    if (amount.getTokenId() !== counter_token_id) {
                        throw new Error('All tokenIds in requiredOutputAmountsList should be equal to counter_token_id');
                    }
                    return accumulator + amount.getValue();
                }, 0),
            tokenId: counter_token_id
        };
        const pseudoOutputAmount = {
            amount: quote.getSci().getPseudoOutputAmount().getValue(),
            tokenId: quote.getSci().getPseudoOutputAmount().getTokenId(),
        };

        const quoteData = {
            id,
            pair: { base_token_id, counter_token_id },
            blockVersion,
            requiredOutputAmounts,
            pseudoOutputAmount,
        };

        const quoteKey = JSON.stringify({ base_token_id, counter_token_id });
        if (newQuotesData.has(quoteKey)) {
            console.log("new quotes data has quoteKey:", quoteKey);
            newQuotesData.get(quoteKey).push(quoteData);
        } else {
            console.log("new quotes data does not have quoteKey:", quoteKey);
            newQuotesData.set(quoteKey, [quoteData]);
        }
    });
    newQuotesData.forEach((quotesData, pairKey) => {
        setQuotesMap((prevQuotesMap) => {
            console.log("updated quotes map");
            return prevQuotesMap.set(pairKey, quotesData);
        });
    });
    countRef.current++; // Increment the count
}

function sendGetQuotesRequests(client, requests, setQuotesMap, countRef) {
    requests.forEach(({ request, baseTokenId, counterTokenId }) => {
        client.getQuotes(request, {}, (err, response) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("received: stuff");
            handleGetQuotesResponse(response, setQuotesMap, countRef);
        });
    });
}

function buildCurrencyPriceBuckets() {
    const currencyAmountMap = {};
    currency_config.pairs.forEach((config_pair) => {
        const baseTokenId = config_pair.base_token_id;
        const counterTokenId = config_pair.counter_token_id;
        const tradingPair = getTradingPairKey(config_pair);
        currencyAmountMap[tradingPair] = {};
        Amounts.forEach((quantity) => {
            const key = parseFloat(quantity);
            const bid_key = JSON.stringify(areTokensInOrder(baseTokenId, counterTokenId) ? config_pair : { base_token_id: counterTokenId, counter_token_id: baseTokenId });
            const ask_key = JSON.stringify(areTokensInOrder(baseTokenId, counterTokenId) ? { base_token_id: counterTokenId, counter_token_id: baseTokenId } : config_pair);
            currencyAmountMap[tradingPair][key] = {
                bid: null,
                ask: null,
                bid_quotes: null,
                ask_quotes: null,
                config_pair,
                bid_key,
                ask_key,
                quantity,
            };
        });
    });
    return currencyAmountMap;
}

function buildEmptyQuotebook() {
    const quoteBook = {};
    currency_config.pairs.forEach((config_pair) => {
        const baseTokenId = config_pair.base_token_id;
        const counterTokenId = config_pair.counter_token_id;
        const tradingPair = getTradingPairKey(config_pair);
        quoteBook[tradingPair] = {};
        const bid_key = JSON.stringify(areTokensInOrder(baseTokenId, counterTokenId) ? config_pair : { base_token_id: counterTokenId, counter_token_id: baseTokenId });
        const ask_key = JSON.stringify(areTokensInOrder(baseTokenId, counterTokenId) ? { base_token_id: counterTokenId, counter_token_id: baseTokenId } : config_pair);
        quoteBook[tradingPair] = {
            bid_quotes: [],
            ask_quotes: [],
            bid_key,
            ask_key,
            bid_depth: 0,
            ask_depth: 0,
        };
    });
    return quoteBook;
}

function compareQuotesByPrice(a, b) {
    return a.requiredOutputAmounts / a.pseudoOutputAmount - b.requiredOutputAmounts / b.pseudoOutputAmount;
}

function mapPairsToQuotesAndPrices(currencyMap) {
    const quoteToPriceMap = {};
    console.log("Pricemap: generate pricemap");
    for (const [quoteKey, quoteList] of currencyMap) {
        console.log("Pricemap: inside pricemap");
        const sortedQuoteList = quoteList.sort(compareQuotesByPrice);

        const quotes = sortedQuoteList.map((quote_data) => {
            const price = quote_data.requiredOutputAmounts.amount / quote_data.pseudoOutputAmount.amount;
            const id = quote_data.id;
            const amount = quote_data.pseudoOutputAmount.amount;
            return { id, price, amount };
        });

        if (quoteToPriceMap[quoteKey]) {
            quoteToPriceMap[quoteKey].push(...quotes);
        } else {
            quoteToPriceMap[quoteKey] = quotes;
        }
    }

    return quoteToPriceMap;
}

function updateQuotebook(quoteBook, setQuoteBook, pairToPriceMap) {
    const updatedQuoteBook = {};
    for (let key in quoteBook) {
        const entry = quoteBook[key];
        const bidKey = entry.bid_key;
        const askKey = entry.ask_key;
        const bidQuotes = pairToPriceMap.hasOwnProperty(bidKey) ? pairToPriceMap[bidKey] : entry.bid_quotes;
        const askQuotes = pairToPriceMap.hasOwnProperty(askKey) ? pairToPriceMap[askKey] : entry.ask_quotes;
        let bidDepth = entry.bid_depth;
        let askDepth = entry.ask_depth;
        if (pairToPriceMap.hasOwnProperty(bidKey)) {
            bidDepth = pairToPriceMap[bidKey].reduce((acc, quote) => {
                console.log(`bid_depth: Adding ${JSON.stringify(quote.amount)} to the accumulator`);
                return acc + quote.amount;
            }, 0);
        }
        if (pairToPriceMap.hasOwnProperty(askKey)) {
            askDepth = pairToPriceMap[askKey].reduce((acc, quote) => acc + quote.amount, 0);
        }

        const updatedEntry = {
            ...entry,
            bid_quotes: bidQuotes,
            ask_quotes: askQuotes,
            bid_depth: bidDepth,
            ask_depth: askDepth
        };
        console.log(`bid_depth: updatedEntry has bid_depth ${JSON.stringify(updatedEntry.bid_depth)}`);

        updatedQuoteBook[key] = updatedEntry;
    }
    setQuoteBook(updatedQuoteBook);
}

function updateCurrencyMap(currencyMap, setCurrencyAmountMap, updatedBucketsMap) {
    const updatedCurrencyMap = {};
    for (let key in currencyMap) {
        const amountMap = currencyMap[key];
        const updatedAmountMap = {};
        for (let amount in amountMap) {
            const entry = amountMap[amount];
            const bidKey = entry.bid_key;
            const askKey = entry.ask_key;
            let updatedBid = entry.bid;
            let updatedBidQuotes = entry.bid_quotes;
            let updatedAsk = entry.ask;
            let updatedAskQuotes = entry.ask_quotes;
            if (updatedBucketsMap.hasOwnProperty(bidKey) && updatedBucketsMap[bidKey] !== null && updatedBucketsMap[bidKey].hasOwnProperty(amount)) {
                updatedBid = updatedBucketsMap[bidKey][amount].price;
                updatedBidQuotes = updatedBucketsMap[bidKey][amount].quotes;
            }
            if (updatedBucketsMap.hasOwnProperty(askKey) && updatedBucketsMap[askKey] !== null && updatedBucketsMap[askKey].hasOwnProperty(amount)) {
                updatedAsk = updatedBucketsMap[askKey][amount].price;
                updatedAskQuotes = updatedBucketsMap[askKey][amount].quotes;
            }
            const updatedEntry = {
                ...entry,
                bid: updatedBid,
                bid_quotes: updatedBidQuotes,
                ask: updatedAsk,
                ask_quotes: updatedAskQuotes
            };
            updatedAmountMap[amount] = updatedEntry;
        }
        updatedCurrencyMap[key] = updatedAmountMap;
    }
    setCurrencyAmountMap(updatedCurrencyMap);
}

function QuoteList() {
    const [groupedQuotes, setQuotesMap] = useState(new Map());
    const [intervalId, setIntervalId] = useState(null);
    const [activeTab, setActiveTab] = useState('quoteBook'); // State to track active tab

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };
    const countRef = useRef(0);
    // Create a map of currency and amount pairs
    const [currencyAmountMap, setCurrencyAmountMap] = useState(buildCurrencyPriceBuckets());
    const [quoteBook, setQuoteBook] = useState(buildEmptyQuotebook());

    const handleGetQuotes = () => {
        const requests = buildGetQuotesRequests();
        sendGetQuotesRequests(client, requests, setQuotesMap, countRef);
    };

    // Call handleGetQuotes() every 3 seconds
    const startPolling = () => {
        handleGetQuotes(); // call handleGetQuotes right away
        const id = setInterval(() => {
            handleGetQuotes();
            console.log("groupedQuotes content:", JSON.stringify(groupedQuotes, null, 2));
            const pairToQuotesMap = mapPairsToQuotesAndPrices(groupedQuotes);
            console.log("pairToQuotesMap content:", JSON.stringify(pairToQuotesMap, null, 2));
            updateQuotebook(quoteBook, setQuoteBook, pairToQuotesMap);
            console.log("quoteBook content", JSON.stringify(quoteBook));

            const buckets = bucketizeQuotesForAllAmounts(Amounts, groupedQuotes);
            updateCurrencyMap(currencyAmountMap, setCurrencyAmountMap, buckets);
        }, 3000);
        setIntervalId(id);
    };

    const stopPolling = () => {
        clearInterval(intervalId);
        setIntervalId(null);
    };

    useEffect(() => {
        startPolling();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);
    // Define a separate component for QuoteBook
    const QuoteBook = ({ quoteBook }) => {
        return (
<div className="quotebook-container white-text">
  {Object.keys(quoteBook).map((pair) => (
    <div key={pair} className="pair-container">
      <div className="pair-header">
        <h2>{pair}</h2>
        <div className="total-depth-container">
          <div className="total-depth-header">Total Depth</div>
          <div className="bid-depth">{quoteBook[pair].bid_depth}</div>
          <div className="ask-depth">{quoteBook[pair].ask_depth}</div>
        </div>
      </div>
      <div className="bid-container">
        <div className="quote-header">
          <div className="amount-header">Amount</div>
          <div className="price-header">Price</div>
        </div>
        <div className="quotes-container">
          <div className="amounts-column">
            {quoteBook[pair].bid_quotes.map((quote) => (
              <div key={quote.id} className="amount-container">
                <div className="amount-bar-container">
                  <div className="amount-header">
                    <div
                      className="amount-tooltip"
                      title={quote.amount} // Set amount as tooltip
                    >
                      &nbsp;
                    </div>
                  </div>
                  <div
                    className="bid-bar"
                    style={{
                      "--bar-width": `${(quote.amount / quoteBook[pair].bid_depth) * 100}%`,
                    }}
                  >
                    <div className="amount">{quote.amount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="prices-column">
            {quoteBook[pair].bid_quotes.map((quote) => (
              <div key={quote.id} className="price-container">
                <div className="price-tooltip" title={quote.price}>
                  {quote.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ask-container">
        <div className="quote-header">
          <div className="amount-header">Amount</div>
          <div className="price-header">Price</div>
        </div>
        <div className="quotes-container">
          <div className="amounts-column">
            {quoteBook[pair].ask_quotes.map((quote) => (
              <div key={quote.id} className="amount-container">
                <div className="amount-bar-container">
                  <div className="amount-header">
                    <div
                      className="amount-tooltip"
                      title={quote.amount} // Set amount as tooltip
                    >
                      &nbsp;
                    </div>
                  </div>
                  <div
                    className="ask-bar"
                    style={{
                      "--bar-width": `${(quote.amount / quoteBook[pair].ask_depth) * 100}%`,
                    }}
                  >
                    <div className="amount">{quote.amount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="prices-column">
            {quoteBook[pair].ask_quotes.map((quote) => (
              <div key={quote.id} className="price-container">
                <div className="price-tooltip" title={quote.price}>
                  {quote.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>



        );
    };
    const ItemList = ({ currencyAmountMap }) => {
        return (
            <div className="item-list" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gridGap: '10px' }}>
                    {Object.keys(currencyAmountMap).map((currency) => (
                        <div key={currency} className="item-group" style={{ backgroundColor: 'white', borderRadius: '5px', padding: '10px' }}>
                            <h2>{currency}</h2>
                            {Object.keys(currencyAmountMap[currency]).map((amount) => (
                                <div key={amount} style={{ ...truncatedStyle, ...smallTextStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'transparent' }}>
                                    <div style={{ backgroundColor: 'rgba(120, 220, 140, 0.8)', padding: '10px', borderRadius: '5px' }}>
                                        <h3>Bid</h3>
                                        <div>{renderItemName(currencyAmountMap[currency][amount].bid)}</div>
                                    </div>
                                    <div style={{ fontSize: '24px', margin: '0 10px' }}>{amount}</div>
                                    <div style={{ backgroundColor: 'rgba(220, 120, 140, 0.8)', padding: '10px', borderRadius: '5px' }}>
                                        <h3>Ask</h3>
                                        <div>{renderItemName(currencyAmountMap[currency][amount].ask)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    return (
        < div className="App" >
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" style={{ width: '100px', height: '100px' }} />
                <div>
                    <p>Number of different groups: {groupedQuotes.size}</p>
                    {intervalId ? (
                        <button onClick={stopPolling}>Stop Polling</button>
                    ) : (
                        <button onClick={startPolling}>Start Polling</button>
                    )}
                    {intervalId ? (
                        <div>
                            <p>Polling is currently running...</p>
                        </div>
                    ) : (
                        <div>
                            <p>Polling is currently stopped.</p>
                        </div>
                    )}

                    {/* Render tab navigation */}
                    <div>
                        <button onClick={() => handleTabChange('quoteBook')}>Quote Book</button>
                        <button onClick={() => handleTabChange('itemList')}>Item List</button>
                    </div>

                    {/* Render content based on active tab */}
                    {activeTab === 'quoteBook' && <QuoteBook quoteBook={quoteBook} />}
                    {activeTab === 'itemList' && <ItemList currencyAmountMap={currencyAmountMap} />}
                </div>
            </header>
        </div >

    );
}

export function CurrencyPairs() {
    return (
        <div>
            {currency_config.pairs.map(pair => (
                <div key={`${pair.base_token_id}-${pair.counter_token_id}`}>
                    Base token id: {pair.base_token_id}<br />
                    Counter token id: {pair.counter_token_id}
                </div>
            ))}
        </div>
    );
}
export default QuoteList;
