import React from 'react';
import { Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ChatView from './components/ChatView';
import VoiceView from './components/VoiceView';
import SideDrawer from './components/SideDrawer';
import Header from './components/Header';
import { useAppContext, AppProvider } from './context/AppContext';

function AppContent() {
  const {
    drawerOpen,
    setDrawerOpen,
    anchorEl,
    selectedView,
    handleViewClick,
    handleViewClose,
    handleSelectView,
    conversations,
    currentConversationId,
    handleNewConversation,
    handleConversationClick
  } = useAppContext();

  const navigate = useNavigate();

  const handleViewSelection = (view) => {
    handleSelectView(view);
    navigate(`/${view}`);
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
        selectedView={selectedView}
        currentConversationId={currentConversationId}
        handleNewConversation={handleNewConversation}
        handleConversationClick={handleConversationClick}
      />
      
      <Header
        setDrawerOpen={setDrawerOpen}
        anchorEl={anchorEl}
        selectedView={selectedView}
        handleViewClick={handleViewClick}
        handleViewClose={handleViewClose}
        handleSelectView={handleViewSelection}
      />

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Routes>
          <Route path="/chat" element={<ChatView />} />
          <Route path="/voice" element={<VoiceView />} />
          <Route path="*" element={<ChatView />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}

export default App; 