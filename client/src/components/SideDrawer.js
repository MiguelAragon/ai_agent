import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const SideDrawer = ({ 
  drawerOpen, 
  setDrawerOpen, 
  currentConversationId
}) => {
  const [conversations, setConversations] = useState([]);
  const { 
    setCurrentConversationId,
    selectedView,
    handleConversationClick
  } = useAppContext();
  
  const handleNewConversation = () => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    setDrawerOpen(false);
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (selectedView === 'chat') {
      fetchConversations();
    } else {
      setConversations([]);
    }
  }, [selectedView]);
  
  return (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          bgcolor: '#1a1a1a',
          color: 'white',
          width: 280,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          disabled={selectedView !== 'chat'}
          startIcon={<AddIcon />}
          onClick={handleNewConversation}
          sx={{
            bgcolor: '#3a3a3a',
            color: 'white',
            '&.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.5)'
            },
            '&:hover': {
              bgcolor: '#4a4a4a',
            },
            width: '100%',
            mb: 2
          }}
        >
          New Conversation
        </Button>
      </Box>
      <Divider sx={{ borderColor: '#2a2a2a' }} />
      <List>
        {conversations.map((conversation) => (
          <ListItem key={conversation} disablePadding>
            <ListItemButton
              selected={conversation === currentConversationId}
              onClick={() => handleConversationClick(conversation)}
            >
              <ListItemText primary={`Conversation ${conversation.slice(0, 8)}...`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default SideDrawer; 