import React, { Component, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
const { Pair, GetQuotesRequest, GetQuotesResponse, Quote } = require('./deqs_pb.js');
const { SignedContingentInput } = require('./external_pb.js');
const { PingPongClient } = require('./deqs_grpc_web_pb');
const { PingRequest, PongResponse } = require('./deqs_pb.js');

const enableDevTools = window.__GRPCWEB_DEVTOOLS__ || (() => {
});

var client = new DeqsClientAPIClient('http://localhost:9090', null, null);

function QuoteList() {
    const [quoteIds, setQuoteIds] = useState({});

    const handleGetQuotes = () => {
        const request = new GetQuotesRequest();
        const pair = new Pair();
        pair.setBaseTokenId(1);
        pair.setCounterTokenId(2);
        request.setPair(pair);
        request.setBaseRangeMin(1);
        request.setBaseRangeMax(1000000);
        request.setLimit(100);
        console.log(request)
        client.getQuotes(request, {}, (err, response) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(response.toObject());
            const quotesList = response.getQuotesList();
            const groupedQuoteIds = quotesList.reduce((acc, quote) => {
                const pair = quote.getPair();

                if (!acc[pair]) {
                    acc[pair] = [];
                }

                acc[pair].push(quote.getId().toString());

                return acc;
            }, {});

            setQuoteIds(groupedQuoteIds);
        });
    };

    return (
        <div>
            <button onClick={handleGetQuotes}>Get Quotes</button>
            <ul>
                {Object.entries(quoteIds).map(([pair, quoteIds]) => (
                    <li key={pair}>
                        {pair}
                        <ul>
                            {quoteIds.map(quoteId => (
                                <li key={quoteId}>{quoteId}</li>
                            ))}
                        </ul>
                    </li>
                ))}

            </ul>
        </div>
    );
}

export default QuoteList;