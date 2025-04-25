import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedView, setSelectedView] = useState('chat');
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
    setCurrentConversationId(newConversationId);
    setDrawerOpen(false);
  };

  const handleConversationClick = (conversationId) => {
    setCurrentConversationId(conversationId);
    setDrawerOpen(false);
  };

  const value = {
    drawerOpen,
    setDrawerOpen,
    anchorEl,
    setAnchorEl,
    selectedView,
    setSelectedView,
    currentConversationId,
    setCurrentConversationId,
    handleViewClick,
    handleViewClose,
    handleSelectView,
    handleNewConversation,
    handleConversationClick
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}; 