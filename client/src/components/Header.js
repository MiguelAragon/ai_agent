import React from 'react';
import { 
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Stack,
  Avatar,
  Typography,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PhoneIcon from '@mui/icons-material/Phone';

const Header = ({ 
  setDrawerOpen, 
  anchorEl, 
  selectedView, 
  handleViewClick, 
  handleViewClose, 
  handleSelectView 
}) => {
  return (
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
          startIcon={ selectedView === 'chat' ? <AutoAwesomeIcon /> : <PhoneIcon /> }
          endIcon={<KeyboardArrowDownIcon />}
        >
          {selectedView === 'chat' ? 'Chat AI' : 'Voice AI'}
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
          <MenuItem onClick={() => handleSelectView('chat')}>
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
  );
};

export default Header; 