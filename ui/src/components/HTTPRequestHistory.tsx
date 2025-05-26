import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TestResult } from '../types/httpClient';
import { HTTPResponseDisplay } from './HTTPResponseDisplay';

interface HTTPRequestHistoryProps {
  history: TestResult[];
  onReplay: (result: TestResult) => void;
  onClear: () => void;
}

export const HTTPRequestHistory: React.FC<HTTPRequestHistoryProps> = ({
  history,
  onReplay,
  onClear
}) => {
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getStatusColor = (status?: number): 'success' | 'warning' | 'error' | 'default' => {
    if (!status) return 'default';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400) return 'error';
    return 'default';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleViewDetails = (result: TestResult) => {
    setSelectedResult(result);
    setDetailsOpen(true);
  };

  const handleCopyCurl = async (curlCommand: string) => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const truncateUrl = (url: string, maxLength: number = 50): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  if (history.length === 0) {
    return (
      <Alert severity="info" sx={{ backgroundColor: 'background.default' }}>
        No requests in history yet. Send a request to see it appear here.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Request History ({history.length})
        </Typography>
        <Button
          startIcon={<ClearAllIcon />}
          onClick={onClear}
          variant="outlined"
          size="small"
          disabled={history.length === 0}
        >
          Clear All
        </Button>
      </Box>

      <Paper 
        elevation={1} 
        sx={{ 
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 500,
          overflow: 'auto'
        }}
      >
        <List sx={{ p: 0 }}>
          {history.map((result, index) => (
            <React.Fragment key={result.id}>
              <ListItem
                sx={{
                  py: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={result.request.method}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {result.response && (
                        <Chip
                          label={result.response.status}
                          size="small"
                          color={getStatusColor(result.response.status)}
                          variant="filled"
                        />
                      )}
                      {result.error && (
                        <Chip
                          label="ERROR"
                          size="small"
                          color="error"
                          variant="filled"
                        />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(result.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          color: 'text.primary',
                          mb: 0.5
                        }}
                      >
                        {truncateUrl(result.request.url)}
                      </Typography>
                      {result.response && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDuration(result.response.responseTime)} • 
                          {result.response.size} bytes
                        </Typography>
                      )}
                      {result.error && (
                        <Typography variant="caption" color="error.main">
                          {result.error}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Replay request">
                      <IconButton
                        size="small"
                        onClick={() => onReplay(result)}
                      >
                        <ReplayIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {result.response && (
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(result)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Copy as cURL">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyCurl(result.curlCommand)}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < history.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'background.default' }}>
          Request Details
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedResult && (
            <Box sx={{ p: 3 }}>
              {/* Request Info */}
              <Typography variant="h6" gutterBottom>
                Request
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  <strong>{selectedResult.request.method}</strong> {selectedResult.request.url}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedResult.timestamp.toLocaleString()}
                </Typography>
              </Paper>

              {/* Response */}
              {selectedResult.response ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Response
                  </Typography>
                  <HTTPResponseDisplay response={selectedResult.response} />
                </Box>
              ) : selectedResult.error ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Error
                  </Typography>
                  <Alert severity="error">
                    {selectedResult.error}
                  </Alert>
                </Box>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'background.default' }}>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          {selectedResult && (
            <Button
              onClick={() => {
                onReplay(selectedResult);
                setDetailsOpen(false);
              }}
              variant="contained"
              startIcon={<ReplayIcon />}
            >
              Replay
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
