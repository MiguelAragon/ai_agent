import React, { useState } from 'react';
import { 
  Box, 
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Stack,
  Avatar,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatView from './components/ChatView';
import VoiceView from './components/VoiceView';
import SideDrawer from './components/SideDrawer';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedView, setSelectedView] = useState('voiceai');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  const handleViewClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleViewClose = () => {
    setAnchorEl(null);
  };

  const handleSelectView = (view) => {
    setSelectedView(view);
    handleViewClose();
  };

  const handleNewConversation = () => {
    const newConversationId = Date.now().toString();
    setConversations([...conversations, newConversationId]);
    setCurrentConversationId(newConversationId);
  };

  const handleConversationClick = (conversationId) => {
    setCurrentConversationId(conversationId);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#212121',
      color: 'white',
      overflow: 'hidden',
    }}>
      <SideDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        conversations={conversations}
        currentConversationId={currentConversationId}
        handleNewConversation={handleNewConversation}
        handleConversationClick={handleConversationClick}
      />
      
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: '#1a1a1a',
          borderBottom: '1px solid #2a2a2a',
          flexShrink: 0
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Button
            onClick={handleViewClick}
            sx={{
              color: 'white',
              textTransform: 'none',
              fontSize: '1.1rem',
            }}
            startIcon={ selectedView === 'chatai' ? <AutoAwesomeIcon /> : <PhoneIcon /> }
            endIcon={<KeyboardArrowDownIcon />}
          >
            {selectedView === 'chatai' ? 'Chat AI' : 'Voice AI'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleViewClose}
            sx={{
              '& .MuiPaper-root': {
                backgroundColor: '#1a1a1a',
                color: 'white',
                '& .MuiMenuItem-root': {
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={() => handleSelectView('chatai')}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                <Avatar sx={{ bgcolor: '#3a3a3a' }}>
                  <AutoAwesomeIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography>Chat AI</Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Our smartest model & more
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
            <MenuItem onClick={() => handleSelectView('voice')}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                <Avatar sx={{ bgcolor: '#3a3a3a' }}>
                  <PhoneIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography>Voice AI</Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Great for analyzing calls
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {selectedView === 'chatai' ? <ChatView /> : <VoiceView />}
      </Box>
    </Box>
  );
}

export default App; 