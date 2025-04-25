import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment'
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import KeyIcon from '@mui/icons-material/VpnKey';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CloudIcon from '@mui/icons-material/Cloud';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CallIcon from '@mui/icons-material/Call';
import api from '../services/api';

const CallInfoDisplay = ({ icon, label, value, iconCopy }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, width: '100%', minWidth: 0}}>
      {icon}
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 2, minWidth: 0}}>
        <Typography variant="body1" noWrap sx={{color: '#999', flexShrink: 0}}>
          {label}: 
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1}}>
          <Typography variant="body1" noWrap sx={{ color: 'white', fontWeight: 500, flex: 1}}>
            {value}
          </Typography>
          {iconCopy && (
            <IconButton 
              onClick={handleCopy}
              size="small"
              sx={{  color: '#666', flexShrink: 0, '&:hover': {
                  color: '#999'
                }
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

function VoiceView() {
  const [clientId, setClientId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCalls, setCurrentCalls] = useState([]);
  const [selectedCall, setSelectedCall] = useState('');
  const [ws, setWs] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventMessage, setEventMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const messagesEndRef = useRef(null);
  const durationIntervalRef = useRef(null);

  	const templates = [
	  	{ id: 'pause', label: 'Pause', value: `{"event": "pause"}`},
	  	{ id: 'resume', label: 'Resume', value: `{"event": "resume"}`},
	  	{ id: 'stop', label: 'Stop', value: `{"event": "stop"}` },
    	{ id: 'mark', label: 'Mark', value: `{"event": "mark", "name": "test-label" }` },
    	{ id: 'clear-mark', label: 'Clear Mark', value: `{"event": "clear-mark", "name": "test-label" }` },
    	{ id: 'send-tts', label: 'Send TTS', value: `{"event": "send-tts", "text": "write your text here..." }` }
  	];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  	useEffect(() => {
    	if (selectedCall && getSelectedCallData()) {
			// Get seconds from call created
			if(getSelectedCallData().CallFinished) return setCallDuration(prev => moment(getSelectedCallData().CallFinished, "YYYY-MM-DD HH:mm:ss").diff(moment(getSelectedCallData().CallStarted, "YYYY-MM-DD HH:mm:ss"), 'seconds'));
			else setCallDuration(prev => moment().diff(moment(getSelectedCallData().CallStarted, "YYYY-MM-DD HH:mm:ss"), 'seconds'));

      		// Start timer
      		durationIntervalRef.current = setInterval(() => {
        		setCallDuration(prev => prev + 1);
      		}, 1000);

      		return () => {
        		if (durationIntervalRef.current) {
          			clearInterval(durationIntervalRef.current);
        		}
      	};
    }
  }, [selectedCall]);

  	useEffect(() => {
    	setClientId(uuidv4());
  	}, []);

  	const formatDuration = (seconds) => {
		const formatted = moment.utc(seconds * 1000).format('mm:ss');
    	return `${formatted}`;
  	};

  	const formatDate = (date_string) => {
		let d = moment(date_string, "YYYY-MM-DD HH:mm:ss");
		return d.isValid() ? d.format("DD/MM/YYYY HH:mm:ss") : "";
  	};

  const connectToServer = () => {
    const socket = new WebSocket(`ws://localhost:3000/client/${clientId}}`);

    socket.onopen = () => {
    	console.log('Connected to WebSocket server');
      	setIsConnected(true);
      	socket.send(JSON.stringify({ event: 'fetch_current_calls' }));
    };

    socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		console.log("onmessage", data);
      	if (data.event === 'current_calls') {
	        setCurrentCalls(data.calls);
      	}
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
      setCurrentCalls([]);
      setSelectedCall('');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(socket);
  };

  const disconnectFromServer = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      setCurrentCalls([]);
      setSelectedCall('');
      setMessages([]);
    }
  };

  const handleCallSelect = (event) => {
    const callId = event.target.value;
    setSelectedCall(callId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'select_call', callId }));
    }
  };

  	const handleTemplateSelect = (event) => {
    	const templateId = event.target.value;
    	const template = templates.find(t => t.id === templateId);
    	if (template) {
			try {
				const parsedJson = JSON.parse(template.value);
				setEventMessage(JSON.stringify(parsedJson, null, 2));
			} catch (e) {
				setEventMessage(template.value);
			}
		}
		setSelectedTemplate('');
		return false;
  	};

  const handleSend = async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'send_twiml', callSid: selectedCall, message: eventMessage.toString() }));
        setEventMessage('');
        setEventDialogOpen(false);
    }
  };

  const handleEventSend = () => {
    if (ws && ws.readyState === WebSocket.OPEN && eventMessage.trim()) {
      ws.send(JSON.stringify({ type: 'event', message: eventMessage.trim() }));
      setEventMessage('');
      setSelectedTemplate('');
      setEventDialogOpen(false);
    }
  };

  const getSelectedCallData = () => {
    return currentCalls.find(call => call.CallSid === selectedCall);
  };

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column', 
        py: 2,
        px: { xs: 1, sm: 2 },
        maxWidth: '900px !important',
        margin: '0 auto',
        color: 'white',
        overflow: 'hidden'
      }}
    >
      {/* Top Bar */}
      <Box gap={2} sx={{ 
        width: '100%',
        display: 'flex', 
        justifyContent: 'flex-end',
        mb: 2,
        flexWrap: 'wrap',
        flexShrink: 0
      }}>

		{isConnected && 
        <FormControl 
          size='small'
          sx={{
            minWidth: '200px',
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              padding: "0px",
              border: '1px solid #2a2a2a',
              color: 'white',
              bgcolor: '#3a3a3a',
              '&:hover': {
                bgcolor: '#4a4a4a',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3a3a3a',
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2a2a2a',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3a3a3a',
                },
               '&.MuiList-root.MuiMenu-list': {
                bgcolor: "#3a3a3a"
               }
            }
          }}
        >
          <Select
            value={selectedCall}
            onChange={handleCallSelect}
            displayEmpty
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: 0.5,
                  borderRadius: '10px',
                  bgcolor: '#3a3a3a',
                  '& .MuiMenuItem-root': {
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#4a4a4a',
                    },
                    '&.Mui-selected': {
                      bgcolor: '#4a4a4a',
                    }
                  }
                }
              }
            }}
            renderValue={(selected) => {
              if (!selected) {
                return <Typography sx={{ color: 'white' }}>Select a call</Typography>;
              }
              const call = currentCalls.find(c => c.CallSid === selected);
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ color: 'white' }} />
                  <Typography sx={{ color: 'white' }}>{call?.From} ({call?.FromCountry})</Typography>
                </Box>
              );
            }}
          >
            {currentCalls.map((call) => (
              <MenuItem 
                key={call.CallSid} 
                value={call.CallSid}
                sx={{
                  bgcolor: '#3a3a3a',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#4a4a4a',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#4a4a4a',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ color: 'white' }} />
                  <Typography sx={{ color: 'white' }}>{call.From} ({call.FromCountry})</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>}

        <Button
          variant="contained"
          onClick={isConnected ? disconnectFromServer : connectToServer}
          sx={{
            bgcolor:  '#3a3a3a',
            color: 'white',
            '&:hover': {
              bgcolor:'#4a4a4a',
            },
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: '0.9rem',
            px: 3,
          }}
          startIcon={isConnected ? <LinkOffIcon /> : <CloudIcon />}
        >
          {isConnected ? 'Disconnect' : 'Connect to Server'}
        </Button>
      </Box>

      <Divider sx={{ mb: 2, borderColor: '#2a2a2a' }} />

      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        overflow: 'hidden'
      }}>

        {/* Call Information */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2,
            bgcolor: '#1a1a1a',
            borderRadius: '10px',
            border: '1px solid #2a2a2a',
            color: 'white'
          }}
        >
          {selectedCall && getSelectedCallData() ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon sx={{ color: '#666' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Call Details</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size='small'
                    onClick={() => setEventDialogOpen(true)}
                    sx={{
                      bgcolor: '#3a3a3a',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#4a4a4a',
                      },
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      px: 2,
                    }}
                    startIcon={<SendIcon />}
                  >
                    Send Event
                  </Button>
                </Box>
              </Box>

              	<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }}}>
                	<CallInfoDisplay
                  		icon={<PhoneIcon sx={{ color: '#666', fontSize: '1.2rem' }} />}
                  		label="From"
                  		value={`${getSelectedCallData().From} (${getSelectedCallData().FromCountry})`}
                	/>
				  	<CallInfoDisplay
						icon={<PhoneIcon sx={{ color: '#666', fontSize: '1.2rem' }} />}
						label="To"
						value={`${getSelectedCallData().To} (${getSelectedCallData().ToCountry})`}
				  	/>
					<CallInfoDisplay
						icon={<CallReceivedIcon sx={{ color: '#666', fontSize: '1.2rem' }} />}
						label="Direction"
						value={getSelectedCallData().Direction}
					/>
					<CallInfoDisplay
                  		icon={<KeyIcon sx={{ color: '#666', fontSize: '1.2rem' }} />}
                  		label="CallSid"
                  		value={`${getSelectedCallData().CallSid}`}
                  		iconCopy={true}
                	/>
					<CallInfoDisplay
						icon={<FiberManualRecordIcon  sx={{ color: '#666', fontSize: '1.2rem' }} />}
						label="Status"
						value={<Chip  label={getSelectedCallData().CallStatus} size="small"  sx={{ bgcolor: '#3a3a3a', color: 'white', px: 2}}/>}
					/>
					<CallInfoDisplay
                  		icon={<AccessTimeIcon sx={{ color: '#666', fontSize: '1.2rem' }} />}
                  		label="Duration"
                  		value={`${formatDate(getSelectedCallData().CallStarted)} (${formatDuration(callDuration)})`}
                	/>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>Welcome to Voice AI</Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>Call to the number to be attended for an agent</Typography>
              <Button
                variant="outlined"
                startIcon={<PhoneIcon />}
                sx={{
                  color: '#fff',
                  borderColor: '#3a3a3a',
                  '&:hover': {
                    borderColor: '#4a4a4a',
                    bgcolor: '#2a2a2a'
                  }
                }}
              >
                +61 3 4328 2333
              </Button>
            </Box>
          )}
        </Paper>

        {/* Chat Section */}
        <Paper 
          elevation={0}
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1a1a1a',
            borderRadius: '10px',
            border: '1px solid #2a2a2a',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          <Box sx={{ 
            flex: 1,
            p: 3,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
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
          }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1,
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar sx={{ bgcolor: '#3a3a3a', width: 32, height: 32 }}>
                    <CallIcon fontSize="small" />
                  </Avatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.sender === 'user' ? '#3a3a3a' : '#1a1a1a',
                    color: 'white',
                    borderRadius: '10px',
                    border: '1px solid #2a2a2a'
                  }}
                >
                  <Typography>
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
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#3a3a3a', width: 32, height: 32 }}>
                  <CallIcon fontSize="small" />
                </Avatar>
                <CircularProgress size={24} sx={{ color: '#3a3a3a' }} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </Paper>
      </Box>

      {/* Event Dialog */}
      <Dialog
        open={eventDialogOpen}
        onClose={() => {
          setEventDialogOpen(false);
          setSelectedTemplate('');
          setEventMessage('');
        }}
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            borderRadius: '10px',
            border: '1px solid #2a2a2a',
          }
        }}
      >
        <DialogTitle>Send Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={eventMessage}
              onChange={(e) => setEventMessage(e.target.value)}
              placeholder="Type your event message..."
              sx={{
                minWidth: "400px",
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#2a2a2a',
                  color: 'white',
                  '& fieldset': {
                    borderColor: '#3a3a3a',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4a4a4a',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4a4a4a',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#666',
                  opacity: 1,
                },
              }}
            />
            <FormControl 
              size='small'
              sx={{
                minWidth: '200px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  padding: "0px",
                  border: '1px solid #2a2a2a',
                  color: 'white',
                  bgcolor: '#3a3a3a',
                  '&:hover': {
                    bgcolor: '#4a4a4a',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3a3a3a',
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2a2a2a',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a3a3a',
                  },
                  '&.MuiList-root.MuiMenu-list': {
                    bgcolor: "#3a3a3a"
                  }
                }
              }}
            >
              <Select
                value={selectedTemplate}
                onChange={handleTemplateSelect}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: '10px',
                      bgcolor: '#3a3a3a',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#4a4a4a',
                        },
                        '&.Mui-selected': {
                          bgcolor: '#4a4a4a',
                        }
                      }
                    }
                  }
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography sx={{ color: 'white' }}>Select an event...</Typography>;
                  }
                  const template = templates.find(t => t.id === selected);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: 'white' }}>{template?.label}</Typography>
                    </Box>
                  );
                }}
              >
                {templates.map((template) => (
                  <MenuItem 
                    key={template.id} 
                    value={template.id}
                    sx={{
                      bgcolor: '#3a3a3a',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#4a4a4a',
                      },
                      '&.Mui-selected': {
                        bgcolor: '#4a4a4a',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: 'white' }}>{template.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

			<Button
            onClick={handleEventSend}
            variant="contained"
            fullWidth
            disabled={!eventMessage.trim()}
            sx={{
              bgcolor: '#3a3a3a',
              color: 'white',
              '&:hover': {
                bgcolor: '#4a4a4a',
              },
              '&.Mui-disabled': {
                bgcolor: '#2a2a2a',
                color: '#666',
              },
            }}
          >
            Send
          </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default VoiceView; 