const WebSocket = require('ws');
const { Readable } = require('stream');
const { Deepgram } = require('@deepgram/sdk');

class BidirectionalTwilioStream {
  constructor(options = {}) {
    this.options = {
      port: 8080,
      deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
      useSpeechRecognition: true,
      ...options
    };
    
    this.wss = null;
    this.activeConnections = new Map();
    this.deepgram = this.options.useSpeechRecognition ? new Deepgram(this.options.deepgramApiKey) : null;
    
    this.onTranscription = this.options.onTranscription || ((streamSid, transcript) => {
      console.log(`[${streamSid}] Transcription: ${transcript}`);
    });
    
    this.onConnect = this.options.onConnect || ((streamSid) => {
      console.log(`[${streamSid}] Connected`);
    });
    
    this.onDisconnect = this.options.onDisconnect || ((streamSid) => {
      console.log(`[${streamSid}] Disconnected`);
    });
    
    this.onMediaReceived = this.options.onMediaReceived || ((streamSid, mediaPayload) => {
      // Default is to do nothing with received media except pass to DeepGram if enabled
    });
  }
  
  /**
   * Start the WebSocket server
   */
  start() {
    this.wss = new WebSocket.Server({ port: this.options.port });
    
    this.wss.on('connection', (ws) => {
      let streamSid = null;
      let dgConnection = null;
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          // Handle stream start event
          if (data.event === 'start') {
            streamSid = data.start.streamSid;
            this.activeConnections.set(streamSid, {
              ws,
              dgConnection: null,
              streamSid,
              callSid: data.start.callSid
            });
            
            // Set up DeepGram if speech recognition is enabled
            if (this.options.useSpeechRecognition && this.deepgram) {
              const dgConfig = {
                punctuate: true,
                interim_results: false,
                encoding: 'mulaw',
                sample_rate: 8000,
                language: 'en-US',
                model: 'nova'
              };
              
              dgConnection = this.deepgram.listen.live(dgConfig);
              
              dgConnection.addListener('open', () => {
                console.log(`[${streamSid}] DeepGram connection established`);
                this.activeConnections.get(streamSid).dgConnection = dgConnection;
              });
              
              dgConnection.addListener('transcriptReceived', (transcription) => {
                if (transcription && 
                    transcription.channel && 
                    transcription.channel.alternatives && 
                    transcription.channel.alternatives.length > 0) {
                  
                  const transcript = transcription.channel.alternatives[0].transcript;
                  
                  if (transcript && transcript.trim() !== '') {
                    this.onTranscription(streamSid, transcript);
                  }
                }
              });
              
              dgConnection.addListener('close', () => {
                console.log(`[${streamSid}] DeepGram connection closed`);
              });
              
              dgConnection.addListener('error', (error) => {
                console.error(`[${streamSid}] DeepGram error:`, error);
              });
            }
            
            this.onConnect(streamSid, data.start);
          }
          
          // Handle media events
          else if (data.event === 'media' && data.media && data.media.payload) {
            const payload = data.media.payload;
            const audioBuffer = Buffer.from(payload, 'base64');
            
            // Pass received media to the callback
            this.onMediaReceived(streamSid, audioBuffer);
            
            // If DeepGram is enabled, send audio for transcription
            const connection = this.activeConnections.get(streamSid);
            if (connection && connection.dgConnection && connection.dgConnection.getReadyState() === 1) {
              connection.dgConnection.send(audioBuffer);
            }
          }
          
          // Handle stop event
          else if (data.event === 'stop') {
            const connection = this.activeConnections.get(streamSid);
            if (connection && connection.dgConnection) {
              connection.dgConnection.finish();
            }
            
            this.onDisconnect(streamSid, data.stop);
            this.activeConnections.delete(streamSid);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        if (streamSid) {
          const connection = this.activeConnections.get(streamSid);
          if (connection && connection.dgConnection) {
            connection.dgConnection.finish();
          }
          
          this.onDisconnect(streamSid);
          this.activeConnections.delete(streamSid);
        }
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (streamSid) {
          const connection = this.activeConnections.get(streamSid);
          if (connection && connection.dgConnection) {
            connection.dgConnection.finish();
          }
          
          this.activeConnections.delete(streamSid);
        }
      });
    });
    
    console.log(`WebSocket server started on port ${this.options.port}`);
    return this;
  }
  
  /**
   * Send audio data to a specific stream
   * @param {string} streamSid - The Stream SID to send audio to
   * @param {Buffer} audioData - The audio data buffer to send
   * @param {object} options - Optional parameters
   * @returns {boolean} - Whether the audio was sent successfully
   */
  sendAudio(streamSid, audioData, options = {}) {
    const connection = this.activeConnections.get(streamSid);
    if (!connection || !connection.ws) {
      console.warn(`Cannot send audio: No active connection for streamSid ${streamSid}`);
      return false;
    }
    
    // Ensure we have a Buffer object
    const buffer = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData);
    
    // Create the media message
    const mediaMessage = {
      event: 'media',
      streamSid: streamSid,
      media: {
        payload: buffer.toString('base64')
      }
    };
    
    // Add any additional properties from options
    if (options.track) {
      mediaMessage.media.track = options.track;
    }
    
    try {
      // Check if the connection is still open
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(mediaMessage));
        return true;
      } else {
        console.warn(`WebSocket for stream ${streamSid} is not open (state: ${connection.ws.readyState})`);
        return false;
      }
    } catch (error) {
      console.error(`Error sending audio to stream ${streamSid}:`, error);
      return false;
    }
  }
  
  /**
   * Stream audio from a readable source to a specific Twilio stream
   * @param {string} streamSid - The Stream SID to send audio to
   * @param {Readable} audioStream - A readable stream of audio data
   * @param {object} options - Optional parameters including chunkSize
   * @returns {Promise} - Resolves when streaming is complete
   */
  streamAudioFrom(streamSid, audioStream, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.activeConnections.has(streamSid)) {
        reject(new Error(`No active connection for streamSid ${streamSid}`));
        return;
      }
      
      const chunkSize = options.chunkSize || 640; // Default to 640 bytes (80ms of 8kHz mulaw)
      
      audioStream.on('data', (chunk) => {
        // Process the chunk into appropriate sized chunks for Twilio
        for (let i = 0; i < chunk.length; i += chunkSize) {
          const audioChunk = chunk.slice(i, i + chunkSize);
          this.sendAudio(streamSid, audioChunk, options);
        }
      });
      
      audioStream.on('end', () => {
        resolve();
      });
      
      audioStream.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Stop the WebSocket server
   */
  stop() {
    if (this.wss) {
      // Close all active DeepGram connections
      for (const [streamSid, connection] of this.activeConnections.entries()) {
        if (connection.dgConnection) {
          connection.dgConnection.finish();
        }
        
        if (connection.ws) {
          try {
            connection.ws.close();
          } catch (error) {
            console.error(`Error closing connection for ${streamSid}:`, error);
          }
        }
      }
      
      this.activeConnections.clear();
      
      // Close the WebSocket server
      this.wss.close(() => {
        console.log('WebSocket server stopped');
      });
      
      this.wss = null;
    }
  }
  
  /**
   * Get a list of active stream connections
   * @returns {Array} - Array of active stream SIDs
   */
  getActiveStreams() {
    return Array.from(this.activeConnections.keys());
  }
  
  /**
   * Get information about a specific stream
   * @param {string} streamSid - The Stream SID to get info for
   * @returns {object|null} - Stream info or null if not found
   */
  getStreamInfo(streamSid) {
    const connection = this.activeConnections.get(streamSid);
    if (!connection) return null;
    
    return {
      streamSid: connection.streamSid,
      callSid: connection.callSid,
      hasDeepgramConnection: connection.dgConnection !== null,
      isConnected: connection.ws.readyState === WebSocket.OPEN
    };
  }
}

module.exports = BidirectionalTwilioStream;