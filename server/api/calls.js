const express = require("express"),
    moment = require("moment"),
  	api = express.Router({ mergeParams: true }),
  	{ getCall, getCalls, saveCall } = require('./utils/calls'),
	{ log } = require('./utils/utils');

api.get('/calls', async (req, res) => {
    const calls = getCalls().map(f => f.replace(".json", ""));
    res.json(calls);
});

api.get('/:callSid', async (req, res) => {
    const callSid = req.params.callSid,
        call = getCall(callSid);
    res.json(call);
});


// Status webhook for call events
api.post('/status', (req, res) => {
    log("status_calls", JSON.stringify(req.body));
    const callSid = req.body.CallSid,
        status = req.body.CallStatus;
    
    console.log(`📱 [Twilio] Call ${callSid} status: ${status}`);
    
    if (status === 'completed' || status === 'failed' || status === 'busy' || status === 'no-answer' || status === 'canceled') {
      saveFinalConversationLog(callSid);
    }
    
    res.status(200).send('OK');
});


api.post('/failed', async (req, res) => {
    log("status_calls", JSON.stringify(req.body));
    res.status(200).send('OK');
});


api.post('/voice', (req, res) => {
    const { hostname } = new URL(process.env.BASE_URL),
        data = req.body || {},
        callSid = data?.CallSid,
		params = Object.entries(data).map(([key, value]) => {
			return `<Parameter name="${key}" value="${value}"/>`;
	  	}).join('\n');
          
    // Respond with TwiML to start stream and enable TTS
    const xml = `
      	<Response>
          <Connect>
            <Stream url="wss://${hostname}/call/${callSid}" track="inbound_track" />
          </Connect>
          <Pause length="60"/>
      	</Response>`;
          
    data.CallStarted = moment().utc().format("YYYY-MM-DD HH:mm:ss"); 
    saveCall({data, callSid, execution: `Llamada iniciada: ${xml}`});
    res.type('text/xml');
    res.send(xml);
});


// Twilio inbound call endpoint
// api.post('/inbound', async (req, res) => {
//     try {
//       log("inbound", "Inbound Call", req.body);
//       const twiml = new twilio.twiml.VoiceResponse(),
//           greeting = "Hi! This is your Parcel Tracking Assistant. What can I do for you today?";
      
//       // Use Twilio's text-to-speech with Australian English voice
//       twiml.say({ voice: TWILIO_VOICE, language: 'en-AU'}, greeting);
  
//       // Record user's response
//       twiml.record({
//         action: '/api/calls/transcribe',
//         method: 'POST',
//         maxLength: 30,
//         playBeep: false,
//         trim: 'trim-silence'
//       });
  
//       //Save Call
//       saveCall(req.body, "user", greeting);
  
//       res.type('text/xml');
//       res.send(twiml.toString());
//     } catch (error) {
//       console.log('Error handling inbound call:', error);
//       res.status(500).send('Error handling call');
//     }
//   });
  
// Transcribe and respond to user's message
// api.post('/transcribe', async (req, res) => {
//   try {
//     log("inbound", "Transcribe", req.body);
//     const twiml = new twilio.twiml.VoiceResponse();
//     const transcription_text = await transcribe(req?.body?.RecordingUrl),
//         systemPrompt = "You are a Parcel Tracking Assistant. Your role is to help users track their parcels and provide delivery information.";
//         call = getCall(req?.body?.CallSid);
    
//     const messages = [
//         { role: "system", content: systemPrompt },
//         ...(call?.transcription || []),
//         { role: "user", content: transcription_text }
//     ].filter(Boolean);

//     log("inbound", "messages", messages);

//     const completion = await openai.chat.completions.create({
//         model: "gpt-3.5-turbo",
//         messages: messages,
//     });

//     let response = completion.choices[0].message.content || "";
    
//     if (response.startsWith("ORDER")) {
//         const orderId = response.split(" ")[1],
//             order = getOrder(orderId);

//         if (order) {
//             const completionOrder = await openai.chat.completions.create({
//                 model: "gpt-3.5-turbo",
//                 messages: [
//                 { role: "system", content:  `
//                     You are a Parcel Tracking Assistant. Your role is to help users track their parcels and provide delivery information.
//                     This is the parcel information:
//                     - Tracking ID: ${order?.id}
//                     - Status: ${order?.status}
//                     - Delivery Address: ${order?.address}
//                     - Delivered Date: ${order?.delivered_date}
//                     - Arrival Date: ${order?.arrival_date}
//                     - Delivery Attempt: ${order?.attemp}
//                     - Recipient Name: ${order?.name}`
//                     },
//                 { role: "user", content: message }
//                 ],
//             });

//             response = completionOrder.choices[0].message.content || "";
//         }else{
//             response = `Sorry, there's no order with the number: ${orderId} .`;
//         }
//     }

//     // Record next user message
//     twiml.record({
//       action: '/api/calls/transcribe',
//       method: 'POST',
//       maxLength: 30,
//       playBeep: false,
//       trim: 'trim-silence'
//     });

//     // Save conversation
//     saveCall(req.body, "user", transcription_text);
//     saveCall(req.body, "system", response);

//     twiml.say({ voice: TWILIO_VOICE, language: 'en-AU'}, response);
//     log("inbound", "response", response);

//     res.type('text/xml');
//     res.send(twiml.toString());
//   } catch (error) {
//     console.log('Error transcribing and responding:', error);
//     res.status(500).send(`Error processing response: ${error?.message || error}`);
//   }
// });

  
// Twilio inbound call endpoint
// api.post('/inbound_ws', async (req, res) => {
//     try {
//       log("inbound", "Inbound Call", req.body);
//       const twiml = new twilio.twiml.VoiceResponse(),
//           greeting = "Hi! This is your Parcel Tracking Assistant. What can I do for you today?";
      
//       // Use Twilio's text-to-speech with Australian English voice
//       twiml.say({ voice: TWILIO_VOICE, language: 'en-AU'}, greeting);
  
  
//       twiml.say({ voice: TWILIO_VOICE, language: 'en-AU'}, greeting);
//       const start = twiml.start();
//       start.stream({ url: `wss://2222-180-190-127-104.ngrok-free.app:3000` });
//       twiml.pause({ length: 60 });
  
//       //Save Call
//       saveCall(req.body, "user", greeting);
  
//       res.type('text/xml');
//       res.send(twiml.toString());
//     } catch (error) {
//       console.log('Error handling inbound call:', error);
//       res.status(500).send('Error handling call');
//     }
// });
  
module.exports = api;