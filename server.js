const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

const server = http.createServer(app);

// Enable Socket.io cross-origin connections
const io = new Server(server, {
  cors: { origin: '*' }
});

const VERIFY_TOKEN = 'my_secret_lead_token_123';

// 1. Meta Webhook Handshake Verification (GET request from Meta)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Meta Webhook Verified Successfully!');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2. Meta Lead Notification Receiver (POST request from Meta)
app.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('Received Meta Webhook Payload:', JSON.stringify(body, null, 2));

  // Construct lead card object
  const newLeadData = {
    id: Date.now(),
    leadgen_id: body.entry?.[0]?.changes?.[0]?.value?.leadgen_id || 'TEST_LEAD_ID',
    form_id: body.entry?.[0]?.changes?.[0]?.value?.form_id || 'TEST_FORM_ID',
    created_time: new Date().toLocaleTimeString(),
  };

  // Broadcast lead payload directly to all connected React Native apps
  io.emit('new_lead', newLeadData);

  res.status(200).send('EVENT_RECEIVED');
});

// Start listening on port 4000
server.listen(4000, () => {
  console.log('Backend listening on http://localhost:4000');
});