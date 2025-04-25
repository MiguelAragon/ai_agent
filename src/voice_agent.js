const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const { createClient, AgentEvents } = require('@deepgram/sdk');

// Replace with your Deepgram API key
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

async function twilioHandler(twilioWs, req) {
  // Create buffer for audio data
  const BUFFER_SIZE = 20 * 160; // Same buffer size as original code
  let inbuffer = Buffer.alloc(0);
  
  // Queue for storing stream SID
  let streamSid = null;
  let streamSidPromise = new Promise(resolve => {
    streamSidResolve = resolve;
  });
  let callData = {};

  // Initialize Deepgram client
  const deepgram = createClient(DEEPGRAM_API_KEY);
  const agent = deepgram.agent();

  // Set up Deepgram agent event handlers
  agent.on(AgentEvents.Open, () => {
    console.log("Connection to Deepgram agent opened");

    // Configure the agent once connection is established
    agent.configure({
      audio: {
        input: {
          encoding: "mulaw",
          sampleRate: 8000,
        },
        output: {
          encoding: "mulaw",
          container: "none",
          sampleRate: 8000,
        },
      },
      agent: {
        listen: {
          model: "nova-2",
        },
        speak: {
          model: "aura-asteria-en",
        },
        think: {
          provider: {
            type: "anthropic",
          },
          model: "claude-3-haiku-20240307",
          instructions: `You are a Parcel Tracking Assistant. Your role is to help users track their parcels and provide delivery information.
          
            When users ask about tracking, status, or delivery information, provide clear and concise responses based on this data.
            If users ask about topics not related to parcel tracking, politely inform them that you can only assist with parcel tracking queries.
            
            If the user mentions the parcel number (it is 3 digits) return the parcel status: {status: "on the way", address: "19 Queen St, Melbourne VIC", delivered_date: "2025-04-11 10:20", arrival_date: "2025-04-11 10:20", attemp: 1, name: "Noah Brown"}
            If no parcel number is mentioned, reply normally.`,
        },
      },
    });
  });

  // Handle agent responses
  agent.on(AgentEvents.AgentStartedSpeaking, (data) => {
    console.log("Agent started speaking:", data["total_latency"]);
  });

  agent.on(AgentEvents.UserStartedSpeaking, async () => {
    console.log("User started speaking - handling barge-in");
    try {
      // Wait for streamSid if not already available
      const sid = streamSid || await streamSidPromise;
      
      // Send clear message to Twilio to implement barge-in
      const clearMessage = {
        "event": "clear",
        "streamSid": sid
      };
      
      if (twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(JSON.stringify(clearMessage));
      }
    } catch (error) {
      console.error("Error handling barge-in:", error);
    }
  });

  agent.on(AgentEvents.ConversationText, async (message) => {
    console.log(`${message.role} said: ${message.content}`);
    if(callData?.CallSid) saveCall(callData, callData?.CallSid, message.role, message.content);
  });

  agent.on(AgentEvents.Audio, async (audio) => {
    try {
      // Wait for streamSid if not already available
      const sid = streamSid || await streamSidPromise;
      
      // Construct a Twilio media message with the audio data
      const mediaMessage = {
        "event": "media",
        "streamSid": sid,
        "media": {"payload": Buffer.from(audio).toString('base64')}
      };
      
      // Send the TTS audio to the attached phone call
      if (twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(JSON.stringify(mediaMessage));
      }
    } catch (error) {
      console.error("Error sending audio to Twilio:", error);
    }
  });

    // Handle agent responses
    // agent.on(AgentEvents.ListenResults, async (transcription) => {
    //     console.log("Transcription received:", transcription.text);
        
    //     // Check for 3-digit order number
    //     const orderNumberMatch = transcription.text.match(/\b\d{3}\b/);
    //     if (orderNumberMatch) {
    //         const orderNumber = orderNumberMatch[0],
    //             order = ;
            
    //         console.log("Order number found:", orderNumber);
        
    //         // Add the order number to the context
    //         agent.addContext({
    //             role: "system",
    //             content: `Customer mentioned order number: ${JSON.stringify(order)}`
    //         });
    //         console.log("Added external context to influence agent response");
    //     }
    // });

  agent.on(AgentEvents.Error, (error) => {
    console.error("Deepgram agent error:", error);
    if (error.toString().includes('401')) {
      console.log("Authentication error. Please check your Deepgram API key.");
    }
  });

  agent.on(AgentEvents.Close, () => {
    console.log("Deepgram agent connection closed");
    if (twilioWs.readyState === WebSocket.OPEN) {
      twilioWs.close();
    }
  });

  // Set up keep-alive for the agent connection
  const keepAliveInterval = setInterval(() => {
    if (agent) {
      agent.keepAlive();
    }
  }, 8000);

  // Handle Twilio WebSocket messages
  twilioWs.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.event === "start") {
        console.log("Got start event from Twilio:", data.start);
        console.log("Custom Parameters:", data.start.customParameters);
        streamSid = data.start.streamSid;
        streamSidResolve(streamSid);
        callData = data.start.customParameters;
      }
      
      if (data.event === "media" && data.media.track === "inbound") {
        const chunk = Buffer.from(data.media.payload, 'base64');
        
        // Append to our buffer
        inbuffer = Buffer.concat([inbuffer, chunk]);
        
        // Check if our buffer is ready to send to Deepgram
        while (inbuffer.length >= BUFFER_SIZE) {
          const audioChunk = inbuffer.slice(0, BUFFER_SIZE);
          agent.send(audioChunk);
          inbuffer = inbuffer.slice(BUFFER_SIZE);
        }
      }
      
      if (data.event === "stop") {
        console.log("Twilio call ended");
        clearInterval(keepAliveInterval);
        agent.disconnect();
        twilioWs.close();
      }
    } catch (error) {
      console.error("Error processing Twilio message:", error);
    }
  });

  // Handle Twilio WebSocket closure
  twilioWs.on('close', () => {
    console.log("Twilio connection closed");
    clearInterval(keepAliveInterval);
    if (agent) {
      agent.disconnect();
    }
  });

  twilioWs.on('error', (error) => {
    console.error("Twilio WebSocket error:", error);
  });
}

// Set up the WebSocket server
function main() {
  // Create HTTP server to handle WebSocket connections
  const server = http.createServer();
  const wss = new WebSocket.Server({ server });
  
  // For SSL, uncomment and configure these lines:
  /*
  const sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };
  const server = https.createServer(sslOptions);
  const wss = new WebSocket.Server({ server });
  */
  
  // Handle incoming WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log(`Incoming connection on path: ${req.url}`);
    
    if (req.url === '/twilio') {
      console.log("Starting Twilio handler");
      twilioHandler(ws, req);
    } else {
      console.log(`Unknown path: ${req.url}`);
      ws.close();
    }
  });
  
  // Start the server
  const PORT = 3000;
  server.listen(PORT, 'localhost', () => {
    console.log(`Server starting on ws://localhost:${PORT}`);
  });
}



const folder = path.join(__dirname, "logs")
if (!fs.existsSync(folder)) fs.mkdirSync(folder);

const saveCall = ({data = {}, callSid, role, content, execution}) => {
    const CallSid = callSid ? callSid : data?.CallSid,
        filePath = path.join(folder, `${CallSid}.json`),
        timestamp = new Date().toISOString();

    let call = {};
  
    // Check if the file exists
    if (fs.existsSync(filePath)){
        const existingData = fs.readFileSync(filePath, "utf-8");
        try {
            call = JSON.parse(existingData);
            call.transcription = call?.transcription || [];
            call.execution = call?.execution || [];
        } catch (err) {
            console.error("Error parsing JSON file:", err);
        }
    }else{
        call = {...data};
        call.transcription = [];
        call.execution = [];
    }

    if(role && content) call.transcription.push({ role, content, timestamp });
    if(execution) call.execution.push({ timestamp, execution});
    fs.writeFileSync(filePath, JSON.stringify(call, null, 2), "utf-8");
};

// Start the application
main();