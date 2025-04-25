require('dotenv').config();
const express = require('express'),
    path = require('path'),
    cors = require('cors');
    
process.env.PATH_LOGS = path.join(__dirname, "logs");

const WSServer = require("./api/wsserver"),
    api = require("./api/api"),
    PORT = process.env.PORT || 3000;
    app = express();

// Initialize Express app
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/api", api);

// Optional: define routes if needed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Express server
const server = app.listen(PORT, () => {
  console.log(`🚀 [Server] Running on port ${PORT}`);
});

WSServer.init(server);