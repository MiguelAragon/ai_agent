const express = require('express');
const fs = require('fs');
const { Readable } = require('stream');
const BidirectionalTwilioStream = require('./BidirectionalTwilioStream');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize the bidirectional stream handler
const twilioStream = new BidirectionalTwilioStream({
  port: 3000,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  useSpeechRecognition: true,
  onTranscription: (streamSid, transcript) => {
    console.log(`[${streamSid}] Transcription: ${transcript}`);
    
    // Example: Respond with audio when certain phrases are detected
    if (transcript.toLowerCase().includes('hello')) {
      // Create a readable stream from a file
      const audioFile = fs.readFileSync('./audio/greeting.raw');
      twilioStream.sendAudio(streamSid, audioFile);
    }
  },
  onConnect: (streamSid, streamData) => {
    console.log(`New stream connected: ${streamSid}`);
    
    // Example: Send a welcome audio message when a new stream connects
    setTimeout(() => {
      const welcomeAudio = fs.readFileSync('./audio/welcome.raw');
      twilioStream.sendAudio(streamSid, welcomeAudio);
    }, 1000);
  }
});

// Start the streaming server
twilioStream.start();

// Twilio webhook for voice calls
app.post('/voice', (req, res) => {
  res.type('text/xml');
  res.send(`
    <Response>
      <Connect>
        <Stream url="wss://your-server-domain.com:8080" track="both_tracks" />
      </Connect>
      <Say>You are now connected to the bidirectional stream.</Say>
      <Pause length="60" />
    </Response>
  `);
});

// API endpoint to send audio to a specific stream
app.post('/send-audio', async (req, res) => {
  const { streamSid, audioUrl } = req.body;
  
  if (!streamSid || !audioUrl) {
    return res.status(400).json({ error: 'Missing streamSid or audioUrl' });
  }
  
  try {
    // Example: Download audio from a URL and send it
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    
    const success = twilioStream.sendAudio(streamSid, audioBuffer);
    
    if (success) {
      res.json({ success: true, message: 'Audio sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send audio' });
    }
  } catch (error) {
    console.error('Error sending audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to send a text-to-speech message
app.post('/say', async (req, res) => {
  const { streamSid, text } = req.body;
  
  if (!streamSid || !text) {
    return res.status(400).json({ error: 'Missing streamSid or text' });
  }
  
  try {
    // This is where you would integrate with a TTS service
    // For demonstration purposes, we'll just show the logic
    
    // Example: Generate audio from text using a TTS service
    // const ttsResponse = await textToSpeech(text);
    // const audioBuffer = Buffer.from(ttsResponse);
    
    // For this example, we'll just use a mock audio buffer
    const mockAudioBuffer = Buffer.from('This is where TTS audio would be');
    
    const success = twilioStream.sendAudio(streamSid, mockAudioBuffer);
    
    if (success) {
      res.json({ success: true, message: 'Message sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get active streams
app.get('/streams', (req, res) => {
  const activeStreams = twilioStream.getActiveStreams();
  
  const streamsInfo = activeStreams.map(streamSid => {
    return twilioStream.getStreamInfo(streamSid);
  });
  
  res.json({ streams: streamsInfo });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Handle application shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  twilioStream.stop();
  process.exit(0);
});