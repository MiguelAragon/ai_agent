require('dotenv').config();
const express = require('express'),
    path = require('path'),
    cors = require('cors');
    
process.env.PATH_LOGS = path.join(__dirname, "logs");

const WSServer = require("./api/utils/ws"),
    api = require("./api/api"),
    PORT = process.env.PORT || 3000;
    app = express();

// Initialize Express app
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", api);

// Start the Express server
const server = app.listen(PORT, () => {
  console.log(`🚀 [Server] Running on port ${PORT}`);
});

WSServer.init(server);