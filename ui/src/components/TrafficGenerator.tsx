import React, { useState, useEffect, useCallback } from 'react';
import { useInterval } from '../utils/performanceUtils';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { TrafficVisualization } from './TrafficVisualization';

const ddClient = createDockerDesktopClient();

interface TrafficConfig {
  targetUrl: string;
  rps: number;
  duration: number;
  headers: { [key: string]: string };
  method: string;
  body: string;
  timeout: number;
  connections: number;
}

interface TrafficMetrics {
  startTime: string;
  elapsedTime: string;
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  errorRate: number;
  statusCodes: { [key: string]: number };
  errors: string[];
  rps: number;
  isRunning: boolean;
}

export const TrafficGenerator: React.FC = () => {
  const [config, setConfig] = useState<TrafficConfig>({
    targetUrl: '',
    rps: 10,
    duration: 60,
    headers: {},
    method: 'GET',
    body: '',
    timeout: 30,
    connections: 10
  });

  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // Optimized metrics fetching with memoization
  const fetchMetrics = useCallback(async () => {
    try {
      const result: any = await ddClient.extension?.vm?.service?.get('/traffic-metrics');
      if (result?.data?.success) {
        const fetchedMetrics = result.data.data;
        setMetrics(fetchedMetrics);
        setIsRunning(fetchedMetrics.isRunning);
      }
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
    }
  }, [ddClient]);

  // Use optimized interval hook for auto-refresh
  useInterval(fetchMetrics, isRunning ? 2000 : null, [isRunning]);

  const startTrafficTest = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!config.targetUrl) {
        throw new Error('Target URL is required');
      }

      const result: any = await ddClient.extension?.vm?.service?.post('/start-traffic-test', config);
      
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to start traffic test');
      }

      setIsRunning(true);
      // Start fetching metrics immediately
      setTimeout(fetchMetrics, 1000);

    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to start traffic test');
    } finally {
      setLoading(false);
    }
  };

  const stopTrafficTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const result: any = await ddClient.extension?.vm?.service?.post('/stop-traffic-test', {});
      
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to stop traffic test');
      }

      setIsRunning(false);
      // Fetch final metrics
      setTimeout(fetchMetrics, 500);

    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to stop traffic test');
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setConfig(prev => ({
        ...prev,
        headers: { ...prev.headers, [headerKey]: headerValue }
      }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    setConfig(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (statusCode: string) => {
    const code = parseInt(statusCode);
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'info';
    if (code >= 400 && code < 500) return 'warning';
    return 'error';
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Traffic Generator
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate synthetic traffic to test traffic splitting and performance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Advanced Settings">
            <IconButton onClick={() => setShowAdvanced(!showAdvanced)} disabled={currentTab !== 0}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Detailed Metrics">
            <IconButton onClick={() => setShowMetricsDialog(true)} disabled={!metrics}>
              <TimelineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="traffic generator tabs">
          <Tab label="Configuration" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Live Visualization" icon={<ChartIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Configuration Tab */}
      <Box
        role="tabpanel"
        hidden={currentTab !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {/* Configuration Panel */}
            <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target URL"
                  value={config.targetUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetUrl: e.target.value }))}
                  placeholder="http://localhost:8080/"
                  disabled={isRunning}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Requests per Second"
                  type="number"
                  value={config.rps}
                  onChange={(e) => setConfig(prev => ({ ...prev, rps: parseInt(e.target.value) || 1 }))}
                  disabled={isRunning}
                  inputProps={{ min: 1, max: 1000 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duration (seconds)"
                  type="number"
                  value={config.duration}
                  onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                  disabled={isRunning}
                  inputProps={{ min: 1, max: 3600 }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={isRunning}>
                  <InputLabel>HTTP Method</InputLabel>
                  <Select
                    value={config.method}
                    onChange={(e) => setConfig(prev => ({ ...prev, method: e.target.value }))}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                    <MenuItem value="PATCH">PATCH</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {showAdvanced && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Advanced Settings
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Timeout (seconds)"
                      type="number"
                      value={config.timeout}
                      onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                      disabled={isRunning}
                      inputProps={{ min: 1, max: 300 }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Concurrent Connections"
                      type="number"
                      value={config.connections}
                      onChange={(e) => setConfig(prev => ({ ...prev, connections: parseInt(e.target.value) || 1 }))}
                      disabled={isRunning}
                      inputProps={{ min: 1, max: 100 }}
                    />
                  </Grid>

                  {config.method !== 'GET' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Request Body"
                        multiline
                        rows={3}
                        value={config.body}
                        onChange={(e) => setConfig(prev => ({ ...prev, body: e.target.value }))}
                        disabled={isRunning}
                        placeholder='{"key": "value"}'
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Headers
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        label="Header Name"
                        value={headerKey}
                        onChange={(e) => setHeaderKey(e.target.value)}
                        disabled={isRunning}
                      />
                      <TextField
                        size="small"
                        label="Header Value"
                        value={headerValue}
                        onChange={(e) => setHeaderValue(e.target.value)}
                        disabled={isRunning}
                      />
                      <Button onClick={addHeader} disabled={!headerKey || !headerValue || isRunning}>
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(config.headers).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          onDelete={() => removeHeader(key)}
                          disabled={isRunning}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              {!isRunning ? (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
                  onClick={startTrafficTest}
                  disabled={loading || !config.targetUrl}
                  color="primary"
                >
                  Start Traffic Test
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={20} /> : <StopIcon />}
                  onClick={stopTrafficTest}
                  disabled={loading}
                  color="error"
                >
                  Stop Test
                </Button>
              )}
              
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchMetrics}
                disabled={!metrics || loading}
              >
                Refresh Metrics
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Metrics Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Metrics
            </Typography>
            
            {!metrics ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Start a traffic test to see metrics
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary">
                        {metrics.totalRequests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Requests
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {metrics.successRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Success Rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4">
                        {metrics.avgResponseTime.toFixed(0)}ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Response Time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4">
                        {metrics.rps.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current RPS
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Test Progress
                    </Typography>
                    <LinearProgress
                      variant={isRunning ? "indeterminate" : "determinate"}
                      value={isRunning ? undefined : 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption">
                        Elapsed: {metrics.elapsedTime}
                      </Typography>
                      <Typography variant="caption">
                        {isRunning ? 'Running...' : 'Completed'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {Object.keys(metrics.statusCodes).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Status Codes
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(metrics.statusCodes).map(([code, count]) => (
                        <Chip
                          key={code}
                          label={`${code}: ${count}`}
                          color={getStatusColor(code)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        </Grid>
          </Grid>
        )}
      </Box>

      {/* Visualization Tab */}
      <Box
        role="tabpanel"
        hidden={currentTab !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {currentTab === 1 && (
          <TrafficVisualization metrics={metrics} />
        )}
      </Box>

      {/* Detailed Metrics Dialog */}
      <Dialog
        open={showMetricsDialog}
        onClose={() => setShowMetricsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detailed Traffic Metrics</DialogTitle>
        <DialogContent>
          {metrics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Response Times
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Average</TableCell>
                        <TableCell>{metrics.avgResponseTime.toFixed(2)}ms</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Minimum</TableCell>
                        <TableCell>{metrics.minResponseTime.toFixed(2)}ms</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maximum</TableCell>
                        <TableCell>{metrics.maxResponseTime.toFixed(2)}ms</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Request Summary
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Requests</TableCell>
                        <TableCell>{metrics.totalRequests}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Successful</TableCell>
                        <TableCell>{metrics.successRequests}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Failed</TableCell>
                        <TableCell>{metrics.failedRequests}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Error Rate</TableCell>
                        <TableCell>{metrics.errorRate.toFixed(2)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {metrics.errors.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Errors ({metrics.errors.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {metrics.errors.slice(0, 10).map((error, index) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        {error}
                      </Alert>
                    ))}
                    {metrics.errors.length > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {metrics.errors.length - 10} more errors
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMetricsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};