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

      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        overflow: 'hidden'
      }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#fff' }}>Welcome to Voice AI</Typography>
              <Typography variant="body1" sx={{ color: '#999' }}>Call to the number to be attended for an agent</Typography>
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
        </Paper>
      </Box>
    </Container>
  );
}

export default VoiceView; 