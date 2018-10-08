import React, { Component } from 'react';
import './App.css';

const sha1 = require('sha1');
const crypto = require('crypto');
const ec_pem = require('ec-pem');
const baseUrl = "http://localhost:8000/";

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
      token: null,
      pem: null,
    };
  }

  _handlePassword = (event) => {
    this.setState({
      password: event.target.value
    });
  }

  _verifyPassword = (event) => {
    event.preventDefault();
    let encryptedPassword = sha1(this.state.password);
    let body = {
      password: encryptedPassword
    };
    fetch(baseUrl + "verify/", {
        method: 'POST',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json'}
    }).then((response) => {
      if (response.status === 200) {
        response.json().then((json) => {
          this.setState({
            token: json.token,
            verified: true
          });
        }).catch((e) => {
          console.error(e);
        });
      }
      else {
        console.error("Incorrect password");
      }
    }).catch((e) => {
      console.error(e);
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
    const ecdh = crypto.createECDH('secp521r1');
    ecdh.generateKeys();
    let privKey = ecdh.getPrivateKey('hex');
    let pubKey = ecdh.getPublicKey('hex');
    let pem = ec_pem(ecdh, 'secp521r1');
    this.setState({
      keysGenerated: true,
      publicKey: pubKey,
      privateKey: privKey,
      pem: pem,
    });
  }

  _submitKey = (event) => {
    event.preventDefault();
    let pubKey = this.state.pem.encodePublicKey();
    let body = {
      token: this.state.token,
      key: pubKey,
    };
    fetch(baseUrl + "store/", {
      method: 'POST',
      body:    JSON.stringify(body),
      headers: { 'Content-Type': 'application/json'}
    }).then((response) => {
      if (response.status === 200) {
        this.setState({
          ready: true
        });
      } else {
        console.error(response.status);
      }
    }).catch((e) => {
      console.error(e);
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
    let msg = Buffer.from(this.state.message);
    var sign = crypto.createSign('sha256');
    sign.update(msg);
    let sig = sign.sign(this.state.pem.encodePrivateKey());

    let body = {
      message: msg,
      sig: sig,
      key: this.state.pem.encodePublicKey(),
    };
    fetch(baseUrl + "talk/", {
      method: 'POST',
      body:    JSON.stringify(body),
      headers: { 'Content-Type': 'application/json'}
    }).then((response) => {
      if (response.status === 200) {
        console.log("Successfully received");
      } else {
        console.error(response.status);
      }
    }).catch((e) => {
      console.error(e);
    });
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
