import React, { Component, useState } from 'react';
import logo from './logo.svg';
// import './App.css';

const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
const { Pair, GetQuotesRequest, GetQuotesResponse, Quote } = require('./deqs_pb.js');
const { SignedContingentInput } = require('./external_pb.js');
const { PingPongClient } = require('./deqs_grpc_web_pb');
const { PingRequest, PongResponse } = require('./deqs_pb.js');

const enableDevTools = window.__GRPCWEB_DEVTOOLS__ || (() => {
});

var client = new DeqsClientAPIClient('http://localhost:9090', null, null);
var pingclient = new PingPongClient('http://localhost:9090', null, null);
enableDevTools([
	pingclient,
]);
class App extends Component {
	callPingClient = () => {
		const request = new PingRequest();
		request.setPing('Hello');


		pingclient.ping(request, {}, (err, response) => {
			if (response == null) {
				console.log("encountered Error:" + err)
				console.log(err);
			} else {
				console.log(response.getBaseRangeMin())
			}
		});
	}
	render() {
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<button style={{ padding: 10 }} onClick={this.callPingClient}>Click for grpc request</button>
				</header>
			</div>
		);
	}
}


export default App;
