const FormData = require('form-data'),
    axios = require('axios'),
    OpenAI = require('openai'),
    twilio = require('twilio'),
    path = require('path'),
    moment = require('moment'),
    fs = require('fs'),
    // ElevenLabs = require("elevenlabs-node"),
    TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN,
    DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY,
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
    OPENAI_API_KEY = process.env.OPENAI_API_KEY,
    // elevenLabs = new ElevenLabs({
    //     apiKey:  process.env.ELEVENLABS_API_KEY,
    //     voiceId: process.env.ELEVENLABS_VOICE_ID
    // }),
    openai = new OpenAI({ apiKey: OPENAI_API_KEY}),
    { createClient, LiveTranscriptionEvents  } = require("@deepgram/sdk"),
    deepgram = createClient(DEEPGRAM_API_KEY);


const transcribe = async (recordingUrl) => {
    log("inbound", "Recording url", recordingUrl);
    
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds
    let retryCount = 0;
    let audioResponse = "";
    
    while (retryCount < maxRetries) {
        try {
            audioResponse = await axios.get(recordingUrl, {
                responseType: 'arraybuffer',
                auth: {
                    username: TWILIO_ACCOUNT_SID,
                    password: TWILIO_AUTH_TOKEN
                }
            });
        } catch (error) {
            console.log("Error", error?.message || error);
            if (error.response && error.response.status === 404 && retryCount < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, retryCount);
                log("inbound", `Recording not available yet. Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retryCount++;
            } else {
                log("inbound", "Error retrieving recording", error);
                throw error;
            }
        }
    }

    const audioBuffer = Buffer.from(audioResponse.data);

    // Step 3: Send to OpenAI's Whisper
    const formData = new FormData();
    formData.append('file', audioBuffer, { filename: 'audio.mp3' });
    formData.append('model', 'whisper-1');

    const whisperResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData,
        {
            headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            ...formData.getHeaders()
            }
        }
    );

    return whisperResponse.data.text;
}

const log = (file_name = "logs", text = "", object = "") => {
    const logs_dir = path.join(__dirname, 'logs'),
        filePath = path.join(logs_dir, `${file_name}.txt`),
        log_text = `[${new Date().toISOString()}] ${text || ""} ${object ? (typeof(object) == "object" ? JSON.stringify(object) : object) : "" }\n`;
    if (!fs.existsSync(logs_dir)) fs.mkdirSync(logs_dir, { recursive: true });
    fs.appendFileSync(filePath, log_text);
    
    // Also log to console for immediate visibility
    console.log(`[${moment().format("HH:mm:ss DD/MM/YYY")}] ${text}`, object ? (typeof(object) === "object" ? JSON.stringify(object, null, 2) : object) : "");
    return;
}

module.exports = { twilio, twilioClient, openai, transcribe, log , deepgram, LiveTranscriptionEvents }