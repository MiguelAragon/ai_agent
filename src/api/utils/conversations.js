const path = require('path'),
    fs = require('fs'),
    folder = path.join(process.env.PATH_LOGS, 'conversations');

if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

const getConversations = () => {
    const files = fs.readdirSync(folder)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(folder, file),
            stats = fs.statSync(filePath);
        return { file, time: stats.birthtime }; // use ctime if birthtime isn't supported
      })
      .sort((a, b) => b.time - a.time)
      .map(entry => entry.file); // return just the filenames
  
    return files;
};

// Function to get conversation history
const getConversation = (uuid) => {
    const filePath = path.join(folder, `${uuid}.json`);
    if (fs.existsSync(filePath)) {
        try{
            let jsonString = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(jsonString);
        }catch(err){
            return [];
        }
    }
    return [];
};

const saveConversation = (uuid, role, content) => {
    const filePath = path.join(folder, `${uuid}.json`),
        timestamp = new Date().toISOString(),
        conversationEntry = { role, content, timestamp };
  
    let conversation = [];
  
    // Check if the file exists
    if (fs.existsSync(filePath)) {
        const existingData = fs.readFileSync(filePath, "utf-8");
        try {
            conversation = JSON.parse(existingData);
        } catch (err) {
            console.error("Error parsing JSON file:", err);
        }
    }
  
    // Add the new entry
    conversation.push(conversationEntry);

    // Save the updated conversation back to the file
    fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2), "utf-8");
};


module.exports = { getConversation, getConversations, saveConversation }