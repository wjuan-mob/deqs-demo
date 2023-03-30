import React, { Component, useState } from 'react';
import logo from './logo.svg';
import currency_config from './currency_config.json';
// import './App.css';

const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
const { Pair, GetQuotesRequest, GetQuotesResponse, Quote } = require('./deqs_pb.js');
const { SignedContingentInput } = require('./external_pb.js');
const { PingPongClient } = require('./deqs_grpc_web_pb');
const { PingRequest, PongResponse } = require('./deqs_pb.js');

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

function QuoteList() {
    const [quotes, setQuotes] = useState([]);

    const handleGetQuotes = () => {
        const limit = 100;
        const requests = [];
        const quotesData = [];

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
        });

        requests.forEach(({ request, baseTokenId, counterTokenId }) => {
            client.getQuotes(request, {}, (err, response) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("received:" + response);
                const quotesList = response.getQuotesList();

                quotesList.forEach((quote) => {
                    const id = quote.getId().toString();
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
                        pair: { baseTokenId, counterTokenId },
                        blockVersion,
                        requiredOutputAmounts,
                        pseudoOutputAmount,
                    };

                    quotesData.push(quoteData);
                });

                setQuotes(quotesData);
            });
        });
    };


    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <div>
                    <button onClick={handleGetQuotes}>Get Quotes</button>
                    <ul>
                        {quotes.map((quote) => (
                            <li key={quote.id.toString()} style={quoteIdStyle}>
                                <span style={quoteItemStyle}> Quote ID: </span> {quote.id.toString()}
                                <br />
                                <span style={quoteItemStyle}>Pair:</span> {JSON.stringify(quote.pair)}
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
