import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ai-agent-br43.onrender.com',
});

export default api; 