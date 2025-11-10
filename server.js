// server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// 1. Initialize Server and WebSocket
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 2. Set up initial data
// We'll store votes in memory.
// For a real app, you'd use a database!
const poll = {
  question: "What's your favorite programming language?",
  options: {
    javascript: 0,
    python: 0,
    rust: 0,
  }
};

// 3. Middleware
// This lets our server read JSON data from requests
app.use(express.json());
// This serves our static HTML files from the 'public' folder
app.use(express.static('public'));


// 4. WebSocket Logic
// This function sends the current poll data to ALL connected clients
function broadcastPollUpdate() {
  // Convert the poll data to a JSON string
  const data = JSON.stringify(poll);
  
  // Loop through all connected clients and send them the new data
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Set up what happens when a new client connects
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // When a new client connects, send them the *current* poll results
  ws.send(JSON.stringify(poll));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});


// 5. HTTP Routes (API)
// This is the endpoint the voting page will call
app.post('/vote', (req, res) => {
  // Get the option the user voted for from the request body
  const { option } = req.body;

  if (option && poll.options.hasOwnProperty(option)) {
    // Increment the vote count
    poll.options[option]++;
    
    // IMPORTANT: After updating the votes, tell all WebSocket clients
    broadcastPollUpdate();
    
    // Send a success response back to the voter
    res.status(200).json({ success: true, message: 'Vote counted!' });
  } else {
    // Send an error if the option is invalid
    res.status(400).json({ success: false, message: 'Invalid option.' });
  }
});


// 6. Start the Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is live at http://localhost:${PORT}`);
});