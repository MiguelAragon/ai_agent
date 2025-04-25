import React from 'react';
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

const SideDrawer = ({ 
  drawerOpen, 
  setDrawerOpen, 
  conversations, 
  currentConversationId, 
  handleNewConversation, 
  handleConversationClick 
}) => {
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
          startIcon={<AddIcon />}
          onClick={handleNewConversation}
          sx={{
            bgcolor: '#3a3a3a',
            color: 'white',
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