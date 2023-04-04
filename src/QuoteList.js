import React, { Component, useState, useEffect, useRef } from 'react';
import logo from './logo.png';
import currency_config from './currency_config.json';
import { Tooltip } from 'react-tooltip';
import { areTokensInOrder, getTradingPairKey, getTokenName, selectQuotesForDesiredAmount } from './QuoteHelper';

const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
const { Pair, GetQuotesRequest, GetQuotesResponse, Quote } = require('./deqs_pb.js');
const { SignedContingentInput } = require('./external_pb.js');
const { PingPongClient } = require('./deqs_grpc_web_pb');
const { PingRequest, PongResponse } = require('./deqs_pb.js');

const Amounts = [0, 1, 2, 3, 4, 5];

const currencyPriority = [
    { name: "GBP", tokenId: 0 },
    { name: "EUR", tokenId: 1 },
    { name: "USD", tokenId: 2 }
];

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

const groupQuotesByQuantityAndPair = (quotes) => {
    return quotes.reduce((result, quote) => {
        const quantity = quote.quantity;
        const pair = quote.pairs[0];
        const pairKey = getTradingPairKey(pair);
        result[quantity] = result[quantity] || {};
        result[quantity][pairKey] = result[quantity][pairKey] || [];
        result[quantity][pairKey].push(quote);
        return result;
    }, {});
};

const sortQuotesByBaseCurrency = (quotes, priority) => {
    const priorityMap = priority.reduce((map, currency, index) => {
        map[currency] = index;
        return map;
    }, {});

    return quotes.sort((quote1, quote2) => {
        const base1 = quote1.pairs[0].base_currency;
        const base2 = quote2.pairs[0].base_currency;
        const basePriority1 = priorityMap[base1] || Infinity;
        const basePriority2 = priorityMap[base2] || Infinity;

        if (basePriority1 < basePriority2) {
            return -1;
        } else if (basePriority1 > basePriority2) {
            return 1;
        } else {
            return 0;
        }
    });
};



const combineQuotesIntoBuckets = (values, quotes) => {
    // Group quotes by quantity and pair
    const quantityQuotes = groupQuotesByQuantityAndPair(quotes);

    // Combine quotes for each quantity and pair
    const combinedQuotes = Object.keys(quantityQuotes).map((quantity) => {
        const pairQuotes = quantityQuotes[quantity];
        const pair = pairQuotes[0].pairs[0];
        const pairKey = getTradingPairKey(pair);
        const sortedPairQuotes = sortQuotesByBaseCurrency(pairQuotes, currencyPriority);
        const bid = sortedPairQuotes[0].price;
        const ask = sortedPairQuotes[1].price;
        return {
            quantity,
            pair_key: pairKey,
            bid,
            ask,
        };
    });

    // Filter out combined quotes with invalid bid/ask
    const filteredQuotes = combinedQuotes.filter(({ bid, ask }) => {
        return bid > 0 && ask > 0 && bid < ask;
    });

    // Sort combined quotes by value and quantity
    const sortedQuotes = sortQuotesByQuantity(filteredQuotes);

    return sortedQuotes;
};

const sortQuotesByQuantity = (quotes) => {
    return quotes.sort((quote1, quote2) => {
        if (quote1.quantity < quote2.quantity) {
            return -1;
        } else if (quote1.quantity > quote2.quantity) {
            return 1;
        } else {
            return 0;
        }
    });
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


function groupByPair(quotes) {
    return quotes.reduce((result, quote) => {
        const { base_token_id, counter_token_id } = quote.pair;
        const group = `${base_token_id.toString()}_${counter_token_id.toString()}`;
        result[group] = result[group] || [];
        result[group].push(quote);
        return result;
    }, {});
}

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
            const bid_key = JSON.stringify(areTokensInOrder(baseTokenId, counterTokenId) ? config_pair : {base_token_id: counterTokenId, counter_token_id: baseTokenId});
            const ask_key = JSON.stringify(areTokensInOrder(baseTokenId, counterTokenId) ? {base_token_id: counterTokenId, counter_token_id: baseTokenId} : config_pair);
            currencyAmountMap[tradingPair][key] = {
                bid: null,
                ask: null,
                config_pair,
                bid_key,
                ask_key,
                quantity,
            };
        });
    });
    return currencyAmountMap;
}


function updateCurrencyMap(currencyMap, updatedBucketsMap) {
    console.log("inside update currencyMap");
    for (let key in updatedBucketsMap) {
        if (updatedBucketsMap.hasOwnProperty(key)) {
          console.log("updatedBucketsMap has key:" + JSON.stringify(key));
        }
      }
    for (let key in currencyMap) {
      let amountMap = currencyMap[key];
      for (let amount in amountMap) {
        let entry = amountMap[amount];
        let bid_key = entry.bid_key;
        console.log("bid_key"+JSON.stringify(bid_key));
        if (updatedBucketsMap.hasOwnProperty(bid_key)) {
            console.log("had own property bid_key");
        }
        for (let key in updatedBucketsMap[bid_key]) {
            if (updatedBucketsMap[bid_key].hasOwnProperty(key)) {
              console.log("amount_key: updatedBucketsMap[bid_key] has key:" + JSON.stringify(key));
            }
          }
        console.log("amount_key: "+JSON.stringify(amount))
        if (updatedBucketsMap.hasOwnProperty(bid_key) && updatedBucketsMap[bid_key].hasOwnProperty(amount)) {
            console.log("updated bucket and amount_key");
            entry.bid = updatedBucketsMap[bid_key][amount].price;
        }
        let ask_key = entry.ask_key;
        if (updatedBucketsMap.hasOwnProperty(ask_key) && updatedBucketsMap[ask_key].hasOwnProperty(amount)) {
          entry.ask = updatedBucketsMap[ask_key][amount].price;
        }
      }
    }
    return currencyMap;
  }
  

function QuoteList() {
    const [groupedQuotes, setQuotesMap] = useState(new Map());
    const [intervalId, setIntervalId] = useState(null);
    const countRef = useRef(0);
    // Create a map of currency and amount pairs
    const currencyAmountMap = buildCurrencyPriceBuckets();

    const handleGetQuotes = () => {
        const requests = buildGetQuotesRequests();
        sendGetQuotesRequests(client, requests, setQuotesMap, countRef);
    };

    // Call handleGetQuotes() every 30 seconds
    const startPolling = () => {
        const id = setInterval(() => {
            handleGetQuotes();
        }, 30000);
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

    // // Process the quotes when they are updated.
    // useEffect(() => {
    //     const groupedQuotes = groupByPair(groupedQuotes);
    //     // Do something with the grouped quotes
    // }, [groupedQuotes]);

    // const groupedQuotes = groupByPair(groupedQuotes);
    const numGroups = groupedQuotes.size;
    const buckets = bucketizeQuotesForAllAmounts(Amounts, groupedQuotes);
    console.log("Buckets content:", JSON.stringify(buckets, null, 2));
    updateCurrencyMap(currencyAmountMap, buckets);
    console.log("currencyAmountMap content:", JSON.stringify(currencyAmountMap, null, 2));
    const bucketsArray = Array.from(buckets);
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" style={{ width: '100px', height: '100px' }} />
                <div>
                    <p>Number of different groups: {groupedQuotes.size}</p>
                    <button onClick={handleGetQuotes}>Get Quotes</button>
                    <button onClick={stopPolling}>Stop Polling</button>
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

                    <ul>
                        {[...groupedQuotes].map(([pair, quotes]) => (
                            <li key={pair} style={quoteIdStyle}>
                                <ul>
                                    {quotes.map((quote) => (
                                        <li key={quote.id}>
                                            <span style={quoteItemStyle}>Pair:</span> {pair}
                                            <br />
                                            <span style={quoteItemStyle}>Block Version:</span> {quote.blockVersion}
                                            <br />
                                            Required Output Amount: <br />
                                            <ul>
                                                <li>
                                                    Amount: {quote.requiredOutputAmounts.amount}
                                                    <br />
                                                    Token Id: {quote.requiredOutputAmounts.tokenId}
                                                    <br />
                                                </li>
                                            </ul>
                                            Pseudo Output Amount: <br />
                                            <ul>
                                                <li>
                                                    Amount: {quote.pseudoOutputAmount.amount}
                                                    <br />
                                                    Token Id: {quote.pseudoOutputAmount.tokenId}
                                                    <br />
                                                </li>
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                    <pre>{JSON.stringify(buckets, null, 2)}</pre>
                </div>
            </header>
        </div>

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
