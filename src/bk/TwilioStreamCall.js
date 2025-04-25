const {twilio, deepgram } = require("./utils");

class TwilioStreamHelper {
  constructor({ deepgramKey, ttsMode = 'say' }) {
    this.dg = new Deepgram(deepgramKey);
    this.ttsMode = ttsMode; // 'say' or 'play'
    this.lastSpeechTimestamp = Date.now();
  }

  startStream(ws, callSid) {
    this.callSid = callSid;
    this.ws = ws;

    this.dgStream = this.dg.transcription.live({
      punctuate: true,
      encoding: 'mulaw',
      sample_rate: 8000,
    });

    this.dgStream.on('transcriptReceived', (msg) => this.onTranscript(msg));
  }

  handleMedia(payload) {
    const audio = Buffer.from(payload, 'base64');
    this.dgStream.send(audio);
  }

  async onTranscript(transcript) {
    const alt = transcript.channel?.alternatives?.[0];
    const text = alt?.transcript?.trim();
    if (text && transcript.is_final) {
      console.log('[User said]', text);
      this.lastSpeechTimestamp = Date.now();

      const aiReply = await this.askChatGPT(text);
      await this.stopStream();

      await this.respondToUser(aiReply);
    }
  }

  async stopStream() {
    try {
      if (this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({ event: 'stop' }));
      }
    } catch (e) {
      console.log('Error stopping stream', e);
    }
  }

  async respondToUser(text) {
    if (this.ttsMode === 'say') {
      await this.updateCallWithTwiML(`
        <Response>
          <Say voice="Polly.Joanna">${text}</Say>
          <Redirect>https://your-server.com/twiml/resume</Redirect>
        </Response>
      `);
    } else if (this.ttsMode === 'play') {
      const url = await this.generateAndUploadTTS(text);
      await this.updateCallWithTwiML(`
        <Response>
          <Play>${url}</Play>
          <Redirect>https://your-server.com/twiml/resume</Redirect>
        </Response>
      `);
    }
  }

  async generateAndUploadTTS(text) {
    // TODO: Generate TTS audio (e.g. with ElevenLabs or Deepgram)
    // Simulate upload
    const fakeUrl = 'https://your-audio-server.com/generated.mp3';
    return fakeUrl;
  }

  async updateCallWithTwiML(twimlXml) {
    // Upload XML to a temp endpoint or use dynamic endpoint
    const responseUrl = `https://your-server.com/dynamic-twiml?text=${encodeURIComponent(twimlXml)}`;
    await twilio.calls(this.callSid).update({ url: responseUrl, method: 'POST' });
  }

  async askChatGPT(userText) {
    // Call OpenAI API
    return `You said: ${userText}, and I'm responding from GPT!`;
  }
}

module.exports = TwilioStreamHelper;