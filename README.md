# Signing messages securely with Public keys

## Testing steps

1. First you need to start the server to interact with the client. During server initialization phase, you would also set the password which is used for interacting with the clients. To start up the server locally, run the following command:
`cd server && npm start -- -p <PASSWORD>`
The server runs on port 8000.

2. Now that your server is up and running and ready to be consumed. Initiate the client.
`cd client && npm start`
This is initate a React.js app on port 3000.

a. The first thing you will see is simple input displaying text area for entering password. Enter the password that you set on the server side.

b. Now you are ready to talk to the server while the token is valid. The next UI you will see where you can generate public-private key pair. Click this button to proceed. This will only execute code on the FrontEnd.

c. In your next screen, you should be able to see the key pairs. And the post button. The post button pushes the public key to the server. Press this button to proceed.

d. In your server program, you should be able to see that a public key was received.

3. Now that you have exchanges key, it is time to actually send encrypted messages. In your next screen on the client, you should see a text area box. Enter your message and click send. This should send the message along with its signature to the server.

4. On the server side, you should see the received message along with who signed it.

Congratualations, you can now securely receive messages from anyone.

## Requirement checklist

- [x] Node.js only
- [x] Make a server and a client
- [x] Client should authenticate to the Server with a password
- [x] Allow an authenticated user to store a public key of some kind on the server
- [x] Client should be able to sign a given message with its private key
- [x] Allow anyone to submit a signed message to the server to verify if it has been signed by the private key associated with a specified user's public key
- [x] For data storage you can either keep everything in memory or, if you want to use a database, use mongo.
- [x] Upload to a git repository named YourFirstName-2018

### Notes

- Client uses React.js which is a JavaScript framework. The UX is clean, but it is not using command arguments.
- The password is never stored. It is loaded in memory.
- Anyone with the private key can sign the message, but they would have to call the endpoint directly and not using the UI.
