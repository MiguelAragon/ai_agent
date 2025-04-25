const path = require('path'),
    fs = require('fs'),
    folder = path.join(process.env.PATH_LOGS, 'calls');

if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

const getCalls = () => {
    if (!fs.existsSync(folder)) return [];
  
    const files = fs.readdirSync(folder)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(folder, file);
        const stats = fs.statSync(filePath);
        return { file, time: stats.birthtime }; // use ctime if birthtime isn't supported
      })
      .sort((a, b) => b.time - a.time)
      .map(entry => entry.file); // return just the filenames
  
    return files;
};

// Function to get conversation history
const getCall = (uuid) => {
    const filePath = path.join(folder, `${uuid}.json`);
    if (fs.existsSync(filePath)) {
        try{
            let jsonString = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(jsonString);
        }catch(err){
            return {};
        }
    }
    return {};
};

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


module.exports = { saveCall, getCalls, getCall }