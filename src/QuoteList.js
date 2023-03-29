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
    const [quotes, setQuotes] = useState([]);

    const handleGetQuotes = () => {
        const request = new GetQuotesRequest();
        const pair = new Pair();
        pair.setBaseTokenId(1);
        pair.setCounterTokenId(2);
        request.setPair(pair);
        request.setBaseRangeMin(1);
        request.setBaseRangeMax(1000000);
        request.setLimit(100);

        client.getQuotes(request, {}, (err, response) => {
            if (err) {
                console.error(err);
                return;
            }

            const quotesList = response.getQuotesList();
            const quotesData = quotesList.map((quote) => {
                const pair = quote.getPair();
                const id = quote.getId().toString();
                const blockVersion = quote.getSci().getBlockVersion();
                const requiredOutputAmounts = quote.getSci().getRequiredOutputAmountsList().map((amount) => {
                    return {
                        amount: amount.getValue(),
                        tokenId: amount.getTokenId(),
                    };
                });
                const pseudoOutputAmount = {
                    amount: quote.getSci().getPseudoOutputAmount().getValue(),
                    tokenId: quote.getSci().getPseudoOutputAmount().getTokenId(),
                };

                return {
                    id,
                    pair,
                    blockVersion,
                    requiredOutputAmounts,
                    pseudoOutputAmount,
                };
            });

            setQuotes(quotesData);
        });
    };

    return (
        <div>
            <button onClick={handleGetQuotes}>Get Quotes</button>
            <ul>
                {quotes.map((quote) => (
                    <li key={quote.id.toString()}>
                        Quote ID: {quote.id.toString()}<br />
                        Pair: {quote.pair.toString()}<br />
                        Block Version: {quote.blockVersion}<br />
                        Required Output Amounts: <br />
                        <ul>
                            {quote.requiredOutputAmounts.map((amount, index) => (
                                <li key={index}>
                                    Amount: {amount.amount}<br />
                                    Token Id: {amount.tokenId}<br />
                                </li>
                            ))}
                        </ul>
                        Pseudo Output Amount: <br />
                        <ul>
                            <li>
                                Amount: {quote.pseudoOutputAmount.amount}<br />
                                Token Id: {quote.pseudoOutputAmount.tokenId}<br />
                            </li>
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default QuoteList;