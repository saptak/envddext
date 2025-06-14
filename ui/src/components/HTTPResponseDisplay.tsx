import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SpeedIcon from '@mui/icons-material/Speed';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { HTTPResponse } from '../types/httpClient';
import { HTTPClientService } from '../services/httpClientService';

interface HTTPResponseDisplayProps {
  response: HTTPResponse;
}

export const HTTPResponseDisplay: React.FC<HTTPResponseDisplayProps> = ({ response }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const httpService = new HTTPClientService(null as any); // Only using for formatting
  const formatting = httpService.formatResponse(response);

  const getStatusColor = (status: number): 'success' | 'warning' | 'error' | 'info' => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400) return 'error';
    return 'info';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircleIcon />;
    if (status >= 300 && status < 400) return <WarningIcon />;
    if (status >= 400) return <ErrorIcon />;
    return <InfoIcon />;
  };

  const handleCopy = async (content: string, section: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Extract rate limiting headers
  const getRateLimitHeaders = () => {
    const rateLimitHeaders: Record<string, string> = {};
    const rateLimitKeys = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining', 
      'x-ratelimit-reset',
      'retry-after',
      'x-rate-limit-limit',
      'x-rate-limit-remaining',
      'x-rate-limit-reset'
    ];

    Object.entries(response.headers).forEach(([key, value]) => {
      if (rateLimitKeys.includes(key.toLowerCase())) {
        rateLimitHeaders[key] = value;
      }
    });

    return rateLimitHeaders;
  };

  const rateLimitHeaders = getRateLimitHeaders();
  const hasRateLimitHeaders = Object.keys(rateLimitHeaders).length > 0;
  const isRateLimited = response.status === 429;

  return (
    <Box>
      {/* Status Overview */}
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
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Chip
              icon={getStatusIcon(response.status)}
              label={`${response.status} ${response.statusText}`}
              color={getStatusColor(response.status)}
              variant="filled"
            />
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Time: {formatTime(response.responseTime)}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Size: {formatBytes(response.size)}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Type: {response.contentType || 'Unknown'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Rate Limiting Alert */}
      {isRateLimited && (
        <Alert 
          severity="warning" 
          icon={<BlockIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Rate Limited (HTTP 429)
          </Typography>
          <Typography variant="body2">
            Your request was rate limited. Check the rate limit headers below for details about limits and retry timing.
          </Typography>
        </Alert>
      )}

      {/* Rate Limit Headers (if present) */}
      {hasRateLimitHeaders && (
        <Paper 
          elevation={1} 
          sx={{ 
            mb: 2,
            backgroundColor: isRateLimited ? 'warning.50' : 'info.50',
            border: '1px solid',
            borderColor: isRateLimited ? 'warning.200' : 'info.200'
          }}
        >
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: isRateLimited ? 'warning.100' : 'info.100',
              borderBottom: '1px solid',
              borderColor: isRateLimited ? 'warning.200' : 'info.200',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SpeedIcon color={isRateLimited ? 'warning' : 'info'} />
            <Typography variant="subtitle2" fontWeight="bold">
              Rate Limit Information
            </Typography>
            {isRateLimited && (
              <Chip 
                label="RATE LIMITED" 
                size="small" 
                color="warning" 
                icon={<BlockIcon />}
              />
            )}
          </Box>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {Object.entries(rateLimitHeaders).map(([key, value]) => {
                const isResetHeader = key.toLowerCase().includes('reset');
                const isRetryHeader = key.toLowerCase().includes('retry');
                
                return (
                  <Grid item xs={12} md={6} key={key}>
                    <Box sx={{ 
                      p: 1.5, 
                      backgroundColor: 'background.paper',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {key}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {(isResetHeader || isRetryHeader) && <AccessTimeIcon fontSize="small" />}
                        <Typography variant="body2" fontWeight="medium">
                          {isResetHeader && !isNaN(Number(value)) ? 
                            new Date(Number(value) * 1000).toLocaleString() : 
                            value
                          }
                          {isRetryHeader && (
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              seconds
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
            
            {isRateLimited && rateLimitHeaders['retry-after'] && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Retry After:</strong> Wait {rateLimitHeaders['retry-after']} seconds before making another request.
                </Typography>
              </Alert>
            )}
          </Box>
        </Paper>
      )}

      {/* Response Headers */}
      <Accordion 
        sx={{ 
          mb: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2">
              Response Headers ({Object.keys(response.headers).length})
            </Typography>
            <Tooltip title="Copy headers">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  const headersText = Object.entries(response.headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
                  handleCopy(headersText, 'headers');
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {copiedSection === 'headers' && (
              <Typography variant="caption" color="success.main">
                Copied!
              </Typography>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {Object.entries(response.headers).map(([key, value]) => (
              <Box 
                key={key} 
                sx={{ 
                  p: 1, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        color: 'text.primary',
                        wordBreak: 'break-word'
                      }}
                    >
                      {key}:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        wordBreak: 'break-word'
                      }}
                    >
                      {value}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Response Body */}
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
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="subtitle2">
            Response Body
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {formatting.isJson && (
              <Chip label="JSON" size="small" color="primary" variant="outlined" />
            )}
            {formatting.isXml && (
              <Chip label="XML" size="small" color="secondary" variant="outlined" />
            )}
            {formatting.isHtml && (
              <Chip label="HTML" size="small" color="info" variant="outlined" />
            )}
            <Tooltip title="Copy response body">
              <IconButton
                size="small"
                onClick={() => handleCopy(response.body, 'body')}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {copiedSection === 'body' && (
              <Typography variant="caption" color="success.main">
                Copied!
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box sx={{ p: 2 }}>
          {response.body ? (
            <Box
              component="pre"
              sx={{
                backgroundColor: 'grey.900',
                color: 'common.white',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 400,
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                ...(theme => theme.palette.mode === 'light' && {
                  backgroundColor: 'grey.100',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider'
                })
              }}
            >
              {formatting.formatted}
            </Box>
          ) : (
            <Alert severity="info" sx={{ backgroundColor: 'background.default' }}>
              No response body
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Response Summary */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Response received in {formatTime(response.responseTime)} • 
          {formatBytes(response.size)} • 
          {response.contentType}
        </Typography>
      </Box>
    </Box>
  );
};
