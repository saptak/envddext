import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  HTTPClientState,
  HTTPMethod,
  HTTP_METHODS,
  DEFAULT_HTTP_CLIENT_STATE,
  HeaderPair,
  TestResult
} from '../types/httpClient';
import { HTTPClientService } from '../services/httpClientService';
import { HTTPResponseDisplay } from './HTTPResponseDisplay';
import { HTTPRequestHistory } from './HTTPRequestHistory';
import { CurlCommandDisplay } from './CurlCommandDisplay';
import { generateFormattedCurlCommand } from '../utils/curlGenerator';

const ddClient = createDockerDesktopClient();

interface HTTPClientProps {
  initialUrl?: string;
  initialMethod?: HTTPMethod;
  onRequestComplete?: (result: TestResult) => void;
  compact?: boolean;
  proxyUrl?: string; // URL from proxy manager
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

export const HTTPClient: React.FC<HTTPClientProps> = ({
  initialUrl = '',
  initialMethod = 'GET',
  onRequestComplete,
  compact = false,
  proxyUrl
}) => {
  const [state, setState] = useState<HTTPClientState>({
    ...DEFAULT_HTTP_CLIENT_STATE,
    url: initialUrl,
    method: initialMethod
  });
  const [activeTab, setActiveTab] = useState(0);
  const [httpService] = useState(() => new HTTPClientService(ddClient));

  useEffect(() => {
    if (initialUrl) {
      setState(prev => ({ ...prev, url: initialUrl }));
    }
  }, [initialUrl]);

  // Handle proxy URL updates
  useEffect(() => {
    if (proxyUrl) {
      setState(prev => ({ ...prev, url: proxyUrl }));
    }
  }, [proxyUrl]);

  const handleMethodChange = (method: HTTPMethod) => {
    setState(prev => ({ ...prev, method }));
  };

  const handleUrlChange = (url: string) => {
    setState(prev => ({ ...prev, url }));
  };

  const handleBodyChange = (body: string) => {
    setState(prev => ({ ...prev, body }));
  };

  const handleHeaderChange = (index: number, field: keyof HeaderPair, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) =>
        i === index ? { ...header, [field]: value } : header
      )
    }));
  };

  const addHeader = () => {
    setState(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '', enabled: true }]
    }));
  };

  const removeHeader = (index: number) => {
    setState(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const handleSendRequest = async () => {
    if (!state.url.trim()) {
      setState(prev => ({ ...prev, error: 'URL is required' }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      response: null
    }));

    try {
      const headers = HTTPClientService.headerPairsToObject(state.headers);

      const request = {
        method: state.method,
        url: state.url.trim(),
        headers,
        body: state.body || undefined
      };

      const result = await httpService.makeRequest(request);

      setState(prev => ({
        ...prev,
        loading: false,
        response: result.response || null,
        error: result.error || null,
        history: [result, ...prev.history.slice(0, 49)] // Keep last 50 requests
      }));

      // Switch to response tab if request was successful
      if (result.response && !result.error) {
        setActiveTab(1);
      }

      // Notify parent component
      onRequestComplete?.(result);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: typeof error === 'string' ? error : error.message || 'Request failed'
      }));
    }
  };

  const handleClearForm = () => {
    setState({
      ...DEFAULT_HTTP_CLIENT_STATE,
      url: initialUrl,
      method: initialMethod
    });
    setActiveTab(0);
  };

  const handleCopyAsCurl = async () => {
    const headers = HTTPClientService.headerPairsToObject(state.headers);
    const request = {
      method: state.method,
      url: state.url,
      headers,
      body: state.body || undefined
    };

    const curlCommand = generateFormattedCurlCommand(request);

    try {
      await navigator.clipboard.writeText(curlCommand);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleReplayRequest = (result: TestResult) => {
    setState(prev => ({
      ...prev,
      method: result.request.method,
      url: result.request.url,
      headers: Object.entries(result.request.headers).map(([key, value]) => ({
        key,
        value,
        enabled: true
      })),
      body: result.request.body || ''
    }));
    setActiveTab(0);
  };

  const currentCurlCommand = (() => {
    const headers = HTTPClientService.headerPairsToObject(state.headers);
    return generateFormattedCurlCommand({
      method: state.method,
      url: state.url,
      headers,
      body: state.body || undefined
    });
  })();

  return (
    <Paper
      elevation={compact ? 1 : 2}
      sx={{
        p: compact ? 2 : 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant={compact ? "h6" : "h5"} component="h2">
          HTTP Client
        </Typography>
        <Box>
          <Tooltip title="Copy as cURL">
            <IconButton onClick={handleCopyAsCurl} size="small">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear form">
            <IconButton onClick={handleClearForm} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Request" />
        <Tab label="Response" />
        <Tab label="History" />
        <Tab label="cURL" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={2}>
          {/* Method and URL */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Method</InputLabel>
              <Select
                value={state.method}
                label="Method"
                onChange={(e) => handleMethodChange(e.target.value as HTTPMethod)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
              >
                {HTTP_METHODS.map(method => (
                  <MenuItem key={method} value={method}>{method}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              size="small"
              label="URL"
              value={state.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main'
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendRequest}
              disabled={state.loading || !state.url.trim()}
              startIcon={state.loading ? <CircularProgress size={16} /> : <SendIcon />}
              sx={{ height: '40px' }}
            >
              {state.loading ? 'Sending...' : 'Send'}
            </Button>
          </Grid>
        </Grid>

        {state.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {state.error}
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {state.response ? (
          <HTTPResponseDisplay response={state.response} />
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No response yet. Send a request to see the response here.
          </Typography>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <HTTPRequestHistory
          history={state.history}
          onReplay={handleReplayRequest}
          onClear={() => setState(prev => ({ ...prev, history: [] }))}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <CurlCommandDisplay
          curlCommand={currentCurlCommand}
          request={{
            method: state.method,
            url: state.url,
            headers: HTTPClientService.headerPairsToObject(state.headers),
            body: state.body || undefined
          }}
        />
      </TabPanel>
    </Paper>
  );
};
