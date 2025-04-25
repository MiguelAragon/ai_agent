const ws = require('ws');
const { saveCall } = require("./data/orders");

class Socket {
  	constructor() {
		if (!Socket.instance) {
			this.wss = null;
			this.clients = new Map(); // Store client connections
			this.calls = new Map(); // Store call connections
			Socket.instance = this;
		}
		return Socket.instance;
  	}

  	init(server) {
    	if (!this.wss) this.wss = new ws.Server({ noServer: true });

		server.on('upgrade', (req, socket, head) => {
			this.wss.handleUpgrade(req, socket, head, (ws) => {
				this.wss.emit('connection', ws, req);
			});
      	});

      	// Handle WebSocket connections
      	this.wss.on('connection', (socket, req) => {
			// const urlParts = req.url.split('/'),
			// 	type = urlParts[1], // 'call' or 'client'
			// 	connectionId = urlParts[2]; // callSid or clientId

			if (req.url === '/call') {
				twilioHandler(socket);
			} else if (req.url === "/chat") {
				chatHandler(socket);
			} else {
				console.log(`Unknown path: ${req.url}`);
				socket.close();
			}
		

			// if(type == "client"){
			// 	this.clients.set(connectionId, socket);
			// 	this.log("connection", `New connection established for type: ${type}, connectionId: ${connectionId}`);
			// }else if(type == "call"){
			// 	this.calls.set(connectionId, {socket});
			// 	this.log("connection", `New connection established for type: ${type}, connectionId: ${connectionId}`);
			// }else{
			// 	this.log("connection", `Invalid WebSocket connection URL format ${req.url}`);
			// 	socket.close();
			// 	return;
			// }

			// Handle incoming messages
			socket.on('message', (message) => {
				try {
					const data = JSON.parse(message);  

					if(type == "call") {
						if (data.event === 'media') {
							// Extract audio data from Twilio's message
							const audioBuffer = Buffer.from(data.media.payload, 'base64');
							
							if (audioBuffer.length === 0) {
								console.warn('Empty audio buffer received, skipping');
								return;
							}

							if (!dg) {
								console.error('DeepGram connection object is null or undefined');
								return;
							}

							// Send audio to DeepGram for live transcription
							if (dg && dg.getReadyState() === 1) {
								try {
									dg.send(audioBuffer);
								} catch (error) {
									console.error("Error sending audio to Deepgram:", error);
								}
							} else {
								console.warn("Deepgram connection not ready, state:", dg?.getReadyState());
							}
						} else if (data.event === 'stop') {
							console.log('Twilio Media Stream stopped');
							dg.close();
						} else {
							this.onCallMessage(connectionId, data);
						}
					}else{
						this.onClientMessage(connectionId, data);
					}
				} catch (err) {
					this.log("message", `Failed to decode message: ${err?.message || err}`);
				}
			});

			// Handle client disconnection
			socket.on('close', () => {
				if (type === 'call') {
					this.log("close", `Call ${connectionId} disconnected`);
					this.calls.delete(connectionId);
				} else {
					this.log("close", `Client ${connectionId} disconnected`);
					this.clients.delete(connectionId);
				}
			});
      	});
    }

	onCallMessage(callSid, data){
		this.log("onCallMessage", `Message received callSid: ${callSid}`, data);
		// saveCall(data, "system", "Call iniciated");

		switch(data.event){
			case "connected": 
				saveCall({callSid, execution: `Event connected received: ${JSON.stringify(data)}`});
				break;
			case "start":
				saveCall({callSid, execution: `Event start received: ${JSON.stringify(data)}`});
				break;
			// case "media":
			// 	let { streamSid, payload } = data;
				
			// 	break;
			default: 
				this.log("onClientMessage", `Event type ${data.event} not valid`);
		}
	}

	onClientMessage(connectionId, data){
		this.log("onClientMessage", `Message received connectionId: ${connectionId}, data: ${JSON.stringify(data)}`);
		
		switch(data.event){
			case "fetch_current_calls":
				let calls = [];
				this.sendMessageToClient(connectionId, {event: "current_calls", calls});
				break;
			case "pause":
				this.sendMessageToCall(data.callSid, {"event": "pause"});
				break;
			case "resume":
				this.sendMessageToCall(data.callSid, {"event": "resume"});
				break;
			case "stop":
				this.sendMessageToCall(data.callSid, {"event": "stop"});
				break;
			case "mark":
				this.sendMessageToCall(data.callSid, {"event": "mark", "name": "test-label"});
				break;
			case "clear-mark":
				this.sendMessageToCall(data.callSid, {"event": "clear-mark", "name": "test-label" });
				break;
			case "send-tts":
				// const xml = `
				// 	<Response>
				// 		<Say>Please wait while we connect you to our AI assistant.</Say>
				// 		<Connect>
				// 			<Stream url="wss://${host}/call/${req.body.CallSid}" track="inbound_track">
				// 				<Parameter name="callSid" value="${req.body.CallSid}"/>
				// 			</Stream>
				// 		</Connect>
				// 		<Pause length="300"/>
				// 	</Response>`;
				// twilio.calls(connectionId)
				// 	.update({
				// 		method: 'POST', // or 'GET' depending on your webhook
				// 		url: 'https://your-server.com/new-twiml-endpoint'
				// 	})
				// .then(call => console.log(`Updated call: ${call.sid}`));
				// this.sendMessageToCall(data.callSid, {"event": "clear-mark", "name": "test-label" });
				// let json = JSON.stringify(data.message);
				break;
			default: 
				this.log("onClientMessage", `Event type ${data.event} not valid`);
		}
		
	}

	// Send message to a specific client
	sendMessageToClient(clientId, message) {
		const clientSocket = this.clients.get(clientId);
		if (clientSocket && clientSocket.readyState === ws.OPEN) {
			clientSocket.send(JSON.stringify(message));
			this.log("sendMessageToClient", `Message sent to client ${clientId}:`, message);
		}else{
			this.log("sendMessageToClient", `Error sending message to client ${clientId} socket close or dosn't exist`, message);
		}
	}

	// Send message to a specific call
	sendMessageToCall(callSid, message) {
		const callSocket = this.calls.get(callSid);
		if (callSocket && callSocket.readyState === ws.OPEN) {
			callSocket.send(JSON.stringify(message));
			this.log("sendMessageToCall", `Message sent to call ${callSid}:`, message);
		}else{
			this.log("sendMessageToCall", `Error sending message to call ${callSid} socket close or dosn't exist`, message);
		}
	}

	log(name, text, data = ''){
		console.log(`[${name}] ${text} ${data ? JSON.stringify(data) : ""}`);
	}
}

const instance = new Socket();
module.exports = instance;

