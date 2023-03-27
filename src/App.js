import React, { Component } from 'react';
	import logo from './logo.svg';
	import './App.css';
	

	const { DeqsClientAPIClient } = require('./deqs_grpc_web_pb.js');
	const { SubmitQuotesRequest, SubmitQuotesResponse } = require('./deqs_pb.js');
  const { PingPongClient } = require('./deqs_grpc_web_pb');
	const { PingRequest, PongResponse } = require('./deqs_pb.js');

	// var client = new DeqsClientAPIClient('http://localhost:9090', null, null);
	var client = new PingPongClient('http://localhost:9090', null, null);

	class App extends Component {
	  
	  callGrpcService = () => {
	    const request = new PingRequest();
	    request.setPing('Ping');
	

	    client.ping(request, {}, (err, response) => {
	      if (response == null) {
	        console.log(err)
	      }else {
	        console.log(response.getPong())
	      }
	    });
    }
	

	  render() {
	    return (
	      <div className="App">
	        <header className="App-header">
	          <img src={logo} className="App-logo" alt="logo" />
	          <button style={{padding:10}} onClick={this.callGrpcService}>Click for grpc request</button>
	        </header>
	      </div>
	    );
	  }
	}
	

	export default App;
