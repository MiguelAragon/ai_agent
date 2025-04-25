import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import SendIcon from '@mui/icons-material/Send';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import api from '../services/api';

function ChatView() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchConversation = async (conversationId) => {
    try {
      const response = await api.get(`/api/conversations/${conversationId}`);
      setMessages(response.data.map(msg => ({
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'bot'
      })));
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleNewConversation = () => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    setMessages([]);
    setDrawerOpen(false);
  };

  const handleConversationClick = async (conversationId) => {
    setCurrentConversationId(conversationId);
    await fetchConversation(conversationId);
    setDrawerOpen(false);
  };

  const handleSend = async (label = null) => {
    if (!label && !input.trim()) return;
    let text = label || input.trim();

    const userMessage = { content: text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/conversations', {
        message: text,
        conversationId: currentConversationId
      });

      const botMessage = { content: response.data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      
      // If this was a new conversation, update the current conversation ID
      if (!currentConversationId && response.data.conversationId) {
        setCurrentConversationId(response.data.conversationId);
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  return (

      <Container 
        maxWidth="md" 
        sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          py: 2,
          px: { xs: 1, sm: 2 },
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: "0px 10px",
            gap: 2,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#1a1a1a',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#3a3a3a',
              borderRadius: '4px',
            },
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#666',
              textAlign: 'center'
            }}>
              <LocalShippingIcon sx={{ fontSize: 48, mb: 2, color: '#3a3a3a' }} />
              <Typography variant="h6" gutterBottom>
                Welcome to Parcel Tracking Assistant
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                I can help you track your parcels and answer delivery-related questions.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip 
                  label="Track my parcel" 
                  onClick={() => {
                    handleSend("Track my parcel");
                  }}
                  sx={{ bgcolor: '#3a3a3a', color: 'white' }}
                />
                <Chip 
                  label="Delivery status" 
                  onClick={() => {
                      handleSend("What's my delivery status?");
                  }}
                  sx={{ bgcolor: '#3a3a3a', color: 'white' }}
                />
                <Chip 
                  label="Estimated delivery"
                  onClick={() => {
                      handleSend("When will my package arrive?");
                  }}
                  sx={{ bgcolor: '#3a3a3a', color: 'white' }}
                />
              </Box>
            </Box>
          )}
          
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
                alignItems: 'flex-start'
              }}
            >
              {message.sender === 'bot' && (
                <Avatar sx={{ bgcolor: '#3a3a3a', width: 32, height: 32 }}>
                  <LocalShippingIcon fontSize="small" />
                </Avatar>
              )}
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.sender === 'user' ? '#3a3a3a' : '#1a1a1a',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: 'none',
                  border: '1px solid #2a2a2a'
                }}
              >
                <Typography sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: '0.95rem'
                }}>
                  {message.content}
                </Typography>
              </Paper>
              {message.sender === 'user' && (
                  <Avatar sx={{ bgcolor: '#3a3a3a', width: 32, height: 32 }}>
                   <PersonIcon fontSize="small" />
                 </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-start',
              gap: 1,
              alignItems: 'center'
            }}>
              <Avatar sx={{ bgcolor: '#3a3a3a', width: 32, height: 32 }}>
                <LocalShippingIcon fontSize="small" />
              </Avatar>
              <CircularProgress size={24} sx={{ color: '#3a3a3a' }} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          bgcolor: '#1a1a1a',
          p: 2,
          borderRadius: '12px',
          border: '1px solid #2a2a2a',
          mt: 2,
          flexShrink: 0
        }}>
          <TextField
            fullWidth
            variant="outlined"
            autoComplete='off'
            placeholder="Ask about your parcel or delivery..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: '#2a2a2a',
                },
                '&:hover fieldset': {
                  borderColor: '#3a3a3a',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3a3a3a',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#666',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#666',
                opacity: 1,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading}
            sx={{
              bgcolor: '#3a3a3a',
              color: 'white',
              '&:hover': {
                bgcolor: '#4a4a4a',
              },
              minWidth: '48px',
              height: '48px',
              borderRadius: '12px'
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Container>
  );
}

export default ChatView; 