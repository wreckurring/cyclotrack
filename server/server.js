require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const locationHandler = require('./sockets/locationHandler');

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH'],
}));
app.use(express.json());

app.use('/api', require('./routes/api'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PATCH"],
  },
});

connectDB();

// Sockets
io.on('connection', (socket) => {
  locationHandler(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
