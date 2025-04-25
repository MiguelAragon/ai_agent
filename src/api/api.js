const express = require("express"),
    api = express.Router({ mergeParams: true }),
    conversations = require("./controllers/conversations"),
    calls = require("./controllers/calls");

api.get("/", function(req, res) {
    res.send(`API`);
});

api.use("/calls", calls);
api.use("/conversations", conversations);

module.exports = api;

