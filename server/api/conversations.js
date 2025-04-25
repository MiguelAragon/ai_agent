const express = require("express"),
  	api = express.Router({ mergeParams: true }),
    { getOrder }  = require('./utils/orders'),
    { v4: uuidv4 } = require('uuid'),
    { getConversation, getConversations, saveConversation } = require('./utils/conversations'),
    { openai } = require("./utils/utils");
    
api.get('/', async (req, res) => {
    const conversations = getConversations().map(f => f.replace(".json", ""));
    res.json(conversations);
});

api.get('/:conversationId', async (req, res) => {
    const conversationId = req.params.conversationId,
        conversation = getConversation(conversationId);
    res.json(conversation);
});

api.post('/', async (req, res) => {
    try {
        const message = req.body?.message,
            conversationId  = req?.body?.conversationId || uuidv4(),
            conversation = getConversation(conversationId),
            systemPrompt = `You are a Parcel Tracking Assistant. Your role is to help users track their parcels and provide delivery information.
          
            When users ask about tracking, status, or delivery information, provide clear and concise responses based on this data.
            If users ask about topics not related to parcel tracking, politely inform them that you can only assist with parcel tracking queries.
            
            If tou receive an order check parcer (e.g., 101, 102), just reply exactly with "ORDER <number>" (e.g., ORDER 102). 
            If no order number is mentioned, reply normally.`;
  
        const messages = [
            { role: "system", content: systemPrompt },
                ...(conversation || []),
            { role: "user", content: message }
            ].filter(Boolean);
      
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
        });
  
        let response = completion.choices[0].message.content || "";
      
        if (response.startsWith("ORDER")) {
            const orderId = response.split(" ")[1],
                order = getOrder(orderId);
  
            if (order) {
                const completionOrder = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content:  `
                            You are a Parcel Tracking Assistant. Your role is to help users track their parcels and provide delivery information.
                            This is the parcel information:
                            - Tracking ID: ${order?.id}
                            - Status: ${order?.status}
                            - Delivery Address: ${order?.address}
                            - Delivered Date: ${order?.delivered_date}
                            - Arrival Date: ${order?.arrival_date}
                            - Delivery Attempt: ${order?.attemp}
                            - Recipient Name: ${order?.name}`
                            },
                        { role: "user", content: message }
                    ],
                });
  
                response = completionOrder.choices[0].message.content || "";
            }else{
                response = `Sorry, there's no order with the number: ${orderId}, please try again.`;
            }
        }
  
        // Save conversation
        saveConversation(conversationId, "user", message);
        saveConversation(conversationId, "system", response);
  
        res.json({ response, conversationId });
    } catch (err) {
        console.log(err);
        res.json({ response: `Something went wrong: ${err?.message || err}`});
    }
});
  

module.exports = api;