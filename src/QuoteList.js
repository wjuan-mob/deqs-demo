import React, { Component, useState, useEffect, useRef } from 'react';
import logo from './logo.png';
import currency_config from './currency_config.json';
import { Tooltip } from 'react-tooltip';

const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
const { Pair, GetQuotesRequest, GetQuotesResponse, Quote } = require('./deqs_pb.js');
const { SignedContingentInput } = require('./external_pb.js');
const { PingPongClient } = require('./deqs_grpc_web_pb');
const { PingRequest, PongResponse } = require('./deqs_pb.js');

const enableDevTools = window.__GRPCWEB_DEVTOOLS__ || (() => {
});

var client = new DeqsClientAPIClient('http://localhost:9090', null, null);

const currencyPriority = ["GBP", "EUR", "USD"];

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

const getPairKey = (pair) => {
    const { base_currency, counter_currency } = pair;
    const orderedCurrencies = [
        base_currency,
        counter_currency
    ].sort((a, b) => {
        return currencyPriority.indexOf(b) - currencyPriority.indexOf(a);
    });
    return `${orderedCurrencies[0]}/${orderedCurrencies[1]}`;
};

const groupQuotesByQuantityAndPair = (quotes) => {
    return quotes.reduce((result, quote) => {
        const quantity = quote.quantity;
        const pair = quote.pairs[0];
        const pairKey = getPairKey(pair);
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
        const pairKey = getPairKey(pair);
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


const selectQuotesForDesiredAmount = (desiredAmount, quotes) => {
    if (desiredAmount === 0) {
        const sortedQuotes = quotes.sort((a, b) => a.requiredOutputAmounts[0] / a.pseudoOutputAmount - b.requiredOutputAmounts[0] / b.pseudoOutputAmount);
        return [sortedQuotes[0], sortedQuotes[0].requiredOutputAmounts[0] / sortedQuotes[0].pseudoOutputAmount];
    }

    const sortedQuotes = quotes.sort((a, b) => a.requiredOutputAmounts[0] / a.pseudoOutputAmount - b.requiredOutputAmounts[0] / b.pseudoOutputAmount);

    let selectedQuotes = [];
    let selectedPseudoOutputAmount = 0;

    for (const quote of sortedQuotes) {
        const quoteRatio = quote.requiredOutputAmounts[0] / quote.pseudoOutputAmount;

        if (selectedPseudoOutputAmount + quote.pseudoOutputAmount <= desiredAmount) {
            selectedQuotes.push(quote);
            selectedPseudoOutputAmount += quote.pseudoOutputAmount;
        } else {
            const remainingPseudoOutputAmount = desiredAmount - selectedPseudoOutputAmount;
            const selectedQuoteRatio = quote.requiredOutputAmounts[0] / quote.pseudoOutputAmount;
            const proratedRequiredOutputAmount = selectedQuoteRatio * remainingPseudoOutputAmount;
            const proratedQuote = {
                ...quote,
                requiredOutputAmounts: [proratedRequiredOutputAmount],
                pseudoOutputAmount: remainingPseudoOutputAmount,
            };
            selectedQuotes.push(proratedQuote);
            break;
        }
    }

    const selectedRatio = selectedQuotes.reduce((total, quote) => {
        return total + quote.requiredOutputAmounts[0] / quote.pseudoOutputAmount;
    }, 0) / selectedQuotes.length;

    return [selectedQuotes, selectedRatio];
};


const selectQuotesForAllAmounts = (amounts, quotes) => {
    return amounts.map(amount => selectQuotesForDesiredAmount(amount, quotes));
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
    const displayName = name.length > MAX_LENGTH ? `${name.slice(0, MAX_LENGTH)}...` : name;
    return (
        <div>
            <Tooltip id={`tooltip-${name}`} place="bottom" effect="solid">
                {name}
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
        const request = new GetQuotesRequest();
        const pair = new Pair();
        const baseTokenId = config_pair.base_token_id;
        const counterTokenId = config_pair.counter_token_id;
        pair.setBaseTokenId(baseTokenId);
        pair.setCounterTokenId(counterTokenId);
        request.setPair(pair);
        request.setBaseRangeMin(1);
        request.setBaseRangeMax(1000000);
        request.setLimit(limit);
        requests.push({ request, baseTokenId, counterTokenId });
        distinctPairs.add(`${baseTokenId}_${counterTokenId}`); // Add the current pair to the set
    });
    console.log(`Distinct pairs: ${Array.from(distinctPairs).join(", ")}`); // Log the distinct pairs

    return requests;
}

function handleGetQuotesResponse(response, setQuotes, countRef) {
    const newQuotesData = [];
    const quotesList = response.getQuotesList();
    quotesList.forEach((quote) => {
        const id = quote.getId().toString();
        const pair = quote.getPair();
        const base_token_id = pair.getBaseTokenId();
        const counter_token_id = pair.getCounterTokenId();
        const blockVersion = quote.getSci().getBlockVersion();
        const requiredOutputAmounts = quote
            .getSci()
            .getRequiredOutputAmountsList()
            .map((amount) => {
                return {
                    amount: amount.getValue(),
                    tokenId: amount.getTokenId(),
                };
            });
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

        newQuotesData.push(quoteData);
    });

    setQuotes(prevQuotes => [...prevQuotes, ...newQuotesData]); // Append new quotes to existing quotes    
    countRef.current++; // Increment the count
}

function sendGetQuotesRequests(client, requests, setQuotes, countRef) {
    requests.forEach(({ request, baseTokenId, counterTokenId }) => {
        client.getQuotes(request, {}, (err, response) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("received:" + response);
            handleGetQuotesResponse(response, setQuotes, countRef);
        });
    });
}

function QuoteList() {
    const [quotes, setQuotes] = useState([]);
    const [intervalId, setIntervalId] = useState(null);
    const countRef = useRef(0);

    const handleGetQuotes = () => {
        const requests = buildGetQuotesRequests();
        sendGetQuotesRequests(client, requests, setQuotes, countRef);
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

    // Process the quotes when they are updated.
    useEffect(() => {
        const groupedQuotes = groupByPair(quotes);
        // Do something with the grouped quotes
    }, [quotes]);

    const groupedQuotes = groupByPair(quotes);
    const numGroups = Object.keys(groupedQuotes).length;

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" style={{ width: '100px', height: '100px' }} />
                <div>
                <p>Number of different groups: {numGroups}</p>
                    <button onClick={handleGetQuotes}>Get Quotes</button>
                    <button onClick={stopPolling}>Stop Polling</button>
                    <ul>
                        {Object.entries(groupedQuotes).map(([pair, quotes]) => (
                            <li key={pair} style={quoteIdStyle}>
                                <ul>
                                    {quotes.map((quote) => (
                                        <li key={quote.id}>
                                            <span style={quoteItemStyle}>Pair:</span> {pair}
                                            <br />
                                            <span style={quoteItemStyle}>Block Version:</span> {quote.blockVersion}
                                            <br />
                                            <span style={quoteItemStyle}>Required Output Amounts:</span> <br />
                                            <ul>
                                                {quote.requiredOutputAmounts.map((amount, index) => (
                                                    <li key={index}>
                                                        <span style={quoteItemStyle}>Amount:</span> {amount.amount}
                                                        <br />
                                                        <span style={quoteItemStyle}>Token Id:</span> {amount.tokenId}
                                                        <br />
                                                    </li>
                                                ))}
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
