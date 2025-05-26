import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import SettingsIcon from '@mui/icons-material/Settings';
import { HTTPRequest, CurlCommandOptions } from '../types/httpClient';
import { generateFormattedCurlCommand, getCurlExamples } from '../utils/curlGenerator';

interface CurlCommandDisplayProps {
  curlCommand: string;
  request: HTTPRequest;
}

export const CurlCommandDisplay: React.FC<CurlCommandDisplayProps> = ({
  curlCommand,
  request
}) => {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<CurlCommandOptions>({
    includeHeaders: true,
    includeVerbose: false,
    includeTiming: false,
    includeInsecure: false
  });

  const handleCopy = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleOptionChange = (option: keyof CurlCommandOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const customCurlCommand = generateFormattedCurlCommand(request, options);
  const examples = getCurlExamples();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          cURL Command
        </Typography>
        <Box>
          <Tooltip title="Customize options">
            <IconButton
              size="small"
              onClick={() => setShowOptions(!showOptions)}
              color={showOptions ? 'primary' : 'default'}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Options Panel */}
      {showOptions && (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Command Options
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeHeaders}
                    onChange={() => handleOptionChange('includeHeaders')}
                    size="small"
                  />
                }
                label="Include Headers"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeVerbose}
                    onChange={() => handleOptionChange('includeVerbose')}
                    size="small"
                  />
                }
                label="Verbose Output"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeTiming}
                    onChange={() => handleOptionChange('includeTiming')}
                    size="small"
                  />
                }
                label="Show Timing"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeInsecure}
                    onChange={() => handleOptionChange('includeInsecure')}
                    size="small"
                  />
                }
                label="Allow Insecure"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Generated Command */}
      <Paper 
        elevation={1} 
        sx={{ 
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="subtitle2">
            Generated Command
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(showOptions ? customCurlCommand : curlCommand)}
              variant="outlined"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Box
            component="pre"
            sx={{
              backgroundColor: 'grey.900',
              color: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {showOptions ? customCurlCommand : curlCommand}
          </Box>
        </Box>
      </Paper>

      {/* Usage Instructions */}
      <Alert severity="info" sx={{ mb: 2, backgroundColor: 'background.default' }}>
        <Typography variant="body2">
          Copy this command and run it in your terminal to execute the same request outside of this extension.
        </Typography>
      </Alert>

      {/* Examples */}
      <Paper 
        elevation={1} 
        sx={{ 
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle2">
            Common cURL Examples
          </Typography>
        </Box>
        
        <Box sx={{ p: 2 }}>
          {Object.entries(examples).map(([key, example], index) => (
            <Box key={key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {example.title}
                </Typography>
                <Tooltip title="Copy example">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(example.command)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box
                component="pre"
                sx={{
                  backgroundColor: 'grey.900',
                  color: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  margin: 0,
                  mb: index < Object.keys(examples).length - 1 ? 2 : 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {example.command}
              </Box>
              {index < Object.keys(examples).length - 1 && (
                <Divider sx={{ my: 2 }} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Tips */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Tips:</strong> Use -v for verbose output, -i to include response headers, 
          -w for timing information, and -k to allow insecure HTTPS connections.
        </Typography>
      </Box>
    </Box>
  );
};
