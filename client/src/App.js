import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      password: "",
      verified: false,
      keysGenerated: false,
      publicKey: "",
      privateKey: "",
      ready: false,
    };
  }

  _handlePassword = (event) => {
    this.setState({
      password: event.target.value
    });
  }

  _verifyPassword = (event) => {
    event.preventDefault();
    // insert code here
    this.setState({
      verified: true
    });
  }

  _enterPasswordUI = () => {
    return (
      <form onSubmit={this._verifyPassword}>
        <input type="password" value={this.state.password}
          placeholder="Enter password" onChange={this._handlePassword} />
        <br />
        <input type="submit" className="btn btn-primary" value="Enter" />
      </form>
    );
  }

  _generateKeys = (event) => {
    event.preventDefault();
    // code here
    this.setState({
      keysGenerated: true
    });
  }

  _submitKey = (event) => {
    event.preventDefault();
    // insert code here
    this.setState({
      ready: true
    });
  }

  _handleMessage = (event) => {
    this.setState({
      message: event.target.value
    });
  }

  _generateKeysUI = () => {
    let keyBody;
    if (this.state.keysGenerated) {
      keyBody = (
        <div>
          <div>Pub key: {this.state.publicKey}</div>
          <div>Priv key: {this.state.privateKey}</div>
          <form onSubmit={this._submitKey}>
            <input type="submit" className="btn btn-primary" value="Share" />
          </form>
        </div>
      );
    }

    return (
      <div>
        <form onSubmit={this._generateKeys}>
          <input type="submit" className="btn btn-primary" value="Generate keys" />
        </form>
        {keyBody}
      </div>
    );
  }

  _submitMessage = (event) => {
    event.preventDefault();
    // insert code here
  }

  _submitMessageUI = () => {
    return (
      <div>
        <form onSubmit={this._submitMessage}>
          <textarea value={this.state.message}
            placeholder="Enter message" onChange={this._handleMessage} />
          <br />
          <input type="submit" className="btn btn-primary" value="Submit" />
        </form>
      </div>
    );
  }

  render() {
    let verified = this.state.verified;
    let ready = this.state.ready;
    let body;
    if (!verified) {
      body = this._enterPasswordUI();
    } else {
      if (!ready) {
        body = this._generateKeysUI();
      } else {
        body = this._submitMessageUI();
      }
    }
    
    return (
      <div className="App">
        <header className="App-header">
          <div>
            {body}
          </div>
        </header>
      </div>
    );
  }
}

export default App;
