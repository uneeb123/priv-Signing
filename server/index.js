const program = require('commander');
const sha1 = require('sha1');
const crypto = require('crypto');
const ec_pem = require('ec-pem');

program
  .option('-p', '--password', 'Password for authentication')
  .parse(process.argv);

var encryptedPassword;
 
// password given
if (program.args) {
  encryptedPassword = sha1(program.args[0]);
} else {
  console.error("Restart server with password");
  return;
}

// 5 hours
const tokenTimeLimit = 1000*60*60*5;

/* Server configuration */

const express = require('express')
const app = express()
const port = 8000
const cors = require('cors');

/* Database configuration */

const MongoClient = require('mongodb').MongoClient;
const mongoUri = "mongodb+srv://bitpay:FmnSbk65dWPXyPXf@cluster0-4k2c1.mongodb.net/test?retryWrites=true"
const databaseName = "test";
const tokenCollectionName = "bitpayTokens";
const userCollectionName = "bitpayUsers";

var client;
var database;
var tokenCollection;
var userCollection;

function safeExit() {
  if (client) {
    client.closed();
  }
}

// make sure client is closed in case process is interrupted
process.on('SIGINT', () => {
  console.log("Closing connection");
  safeExit();
  process.exit();
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function issueToken() {
  return new Promise((resolve, reject) => {
    let timestamp = Date.now();
    let expiry = timestamp + tokenTimeLimit;
    let token = getRandomInt(1, 1000);
    let record = {
      token: token,
      expiry: expiry,
    };
    tokenCollection.insertOne(record, function(err, result) {
      if (err) {
        reject(err);
      }
      else {
        resolve(token);
      }
    });
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    tokenCollection.find({token: token}).toArray(function(err, docs) {
      if (err != null || docs === undefined || docs.length == 0) {
        resolve(false);
      }
      else {
        let expiry = docs[0].expiry;
        if (Date.now() < expiry) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

function storePublicKey(pubKey) {
  return new Promise((resolve, reject) => {
    let userId = getRandomInt(1, 1000);
    let record = {
      userId: userId,
      pubKey: pubKey,
    }
    userCollection.insertOne(record, function(err, result) {
      if (err) {
        reject();
      }
      else {
        resolve();
      }
    });
  });
}

function knownKey(pubKey) {
  return new Promise((resolve, reject) => {
    userCollection.find({pubKey: pubKey}).toArray(function(err, docs) {
      if (err != null || docs === undefined || docs.length == 0) {
        resolve(false);
      }
      else {
        resolve(true);
      }
    });
  });
}

function decryptMessage(msg, sig, key) {
  return new Promise((resolve, reject) => {
    /*
    console.log(msg);
    console.log(sig);
    console.log(key);
    var curve = crypto.createECDH('secp521r1');
    curve.setPublicKey(key, 'hex');
    var pem = ec_pem(curve, 'secp521r1');
    var verifier = crypto.createVerify('ecdsa-with-SHA1');
    const verify = crypto.createVerify('sha256');
    verifier.update(msg);
    */

    var verify = crypto.createVerify('sha256');
    verify.update(msg);
    let verified = verify.verify(key, sig);


    //let verified = verifier.verify(pem.encodePublicKey(), sig, 'base64');
    console.log(verified);
    resolve(verified);
  });
}

/* API calls */

const bodyParser = require('body-parser')
// to support JSON-encoded bodies
app.use(bodyParser.json());
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());


app.get('/', (request, response) => {
  response.send("Hello");
});

app.post('/verify', (request, response) => {
  let clientPassword = request.body.password;
  if (clientPassword === encryptedPassword) {
    console.log("Password correct. Issuing token.");
    issueToken()
      .then((token) => {
        response.send({token: token});
      }).catch((error) => {
        console.error("Error issuing token", error);
        response.sendStatus(500);
      });
  } else {
    response.sendStatus(401);
  }
});

app.post('/store', (request, response) => {
  let token = request.body.token;
  let key = request.body.key;
  verifyToken(token)
    .then((valid) => {
      if (!valid) {
        console.log("Invalid token provided");
        response.sendStatus(403);
      } else {
        storePublicKey(key)
          .then(() => {
            console.log("Public key successfully stored");
            response.sendStatus(200);
          })
          .catch((error) => {
            console.error("Unable to store public key");
            response.sendStatus(500);
          });
      }
    })
    .catch((error) => {
      console.error("Verification of token failed", error);
      response.sendStatus(500);
    });
});

app.post('/talk', (request, response) => {
  let message = new Buffer(request.body.message);
  let sig = new Buffer(request.body.sig);
  let key = request.body.key;
  knownKey(key).then((known) => {
    if (!known) {
      console.log("Unknown public key");
      response.sendStatus(403);
    } else {
      decryptMessage(message, sig, key).then((authentic) => {
        if (authentic) {
          console.log("RECIEVED MESSAGE FROM " + key);
          console.log(message.toString());
          response.sendStatus(200);
        } else {
          console.error("Received message from unknown user");
          console.log(message);
          response.sendStatus(403);
        }
      }).catch((error) => {
        console.error("Unable to decrypt message", error);
        response.sendStatus(500);
      });
    }
  }).catch((error) => {
    console.error("Unable to verify public key", error);
    response.sendStatus(500);
  });
});

/* Establish connections */

// Open database connection before starting server
MongoClient.connect(mongoUri, {useNewUrlParser: true}, function(err, client)  {
  if (err) {
    console.error(err);
  }

  console.log("Connection established with MongoDb cluster");
  database = client.db(databaseName);
  tokenCollection = database.collection(tokenCollectionName);
  userCollection = database.collection(userCollectionName);

  tokenCollection.createIndex({ token: 1 }, { unique: true }, function(err, results) {
    if (err) {
      console.error(err);
    }
    console.log("Successfully created index for table");
  });
  userCollection.createIndex({ pubKey: 1 }, { unique: true }, function(err, results) {
    if (err) {
      console.error(err);
    }
    console.log("Successfully created index for table");
  });

  app.listen(port, (err) => {
    if (err) {
      console.error('Server unable to start', err)
      safeExit();
      process.exit();
    }
    console.log(`Server is now listening on ${port}`)
  });
});
