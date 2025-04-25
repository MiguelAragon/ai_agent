const express = require("express"),
    api = express.Router({ mergeParams: true }),
    conversations = require("./conversations"),
    calls = require("./calls");


api.get("/", function(req, res) {
    res.send(`API`);
});

api.use("/calls", calls);
api.use("/conversations", conversations);

module.exports = api;

