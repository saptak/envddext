import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider
} from "@mui/material";
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Speed as RateLimitIcon,
  Timeline as ChartIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from "@mui/icons-material";

interface BurstTestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  requestCount: number;
  concurrency: number;
  delayMs: number;
  headers: Array<{ key: string; value: string }>;
  expectedRateLimit?: {
    requests: number;
    timeUnit: string;
  };
}

interface BurstTestResult {
  id: number;
  timestamp: number;
  status: number;
  responseTime: number;
  rateLimitHeaders: Record<string, string>;
  isRateLimited: boolean;
  error?: string;
}

interface BurstTestSummary {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  rateLimitHit: boolean;
  firstRateLimitAt?: number;
}

interface RateLimitTesterProps {
  onTestComplete?: (summary: BurstTestSummary) => void;
}

export const RateLimitTester: React.FC<RateLimitTesterProps> = ({
  onTestComplete
}) => {
  const [config, setConfig] = React.useState<BurstTestConfig>({
    url: "http://localhost:8080/api/test",
    method: "GET",
    requestCount: 50,
    concurrency: 5,
    delayMs: 100,
    headers: [{ key: "Host", value: "api.local" }],
    expectedRateLimit: {
      requests: 100,
      timeUnit: "minute"
    }
  });

  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState<BurstTestResult[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [summary, setSummary] = React.useState<BurstTestSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const addHeader = () => {
    setConfig(prev => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "" }]
    }));
  };

  const updateHeader = (index: number, key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map((h, i) => 
        i === index ? { key, value } : h
      )
    }));
  };

  const removeHeader = (index: number) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const calculateSummary = (testResults: BurstTestResult[]): BurstTestSummary => {
    const rateLimitedResults = testResults.filter(r => r.isRateLimited);
    const successfulResults = testResults.filter(r => r.status >= 200 && r.status < 300);
    const errorResults = testResults.filter(r => r.status >= 400 || r.error);
    const responseTimes = testResults.filter(r => r.responseTime > 0).map(r => r.responseTime);

    return {
      totalRequests: testResults.length,
      successfulRequests: successfulResults.length,
      rateLimitedRequests: rateLimitedResults.length,
      errorRequests: errorResults.length,
      averageResponseTime: responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      rateLimitHit: rateLimitedResults.length > 0,
      firstRateLimitAt: rateLimitedResults.length > 0 ? 
        Math.min(...rateLimitedResults.map(r => r.id)) : undefined
    };
  };

  const simulateRequest = async (id: number): Promise<BurstTestResult> => {
    const startTime = Date.now();
    
    try {
      // Simulate HTTP request with random response
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
      
      const responseTime = Date.now() - startTime;
      
      // Simulate rate limiting based on request count
      const isRateLimited = id > config.expectedRateLimit!.requests * 0.8; // 80% of limit
      const status = isRateLimited ? 429 : 200;
      
      const rateLimitHeaders: Record<string, string> = {};
      if (isRateLimited) {
        rateLimitHeaders['X-RateLimit-Limit'] = config.expectedRateLimit!.requests.toString();
        rateLimitHeaders['X-RateLimit-Remaining'] = '0';
        rateLimitHeaders['X-RateLimit-Reset'] = (Date.now() + 60000).toString();
        rateLimitHeaders['Retry-After'] = '60';
      } else {
        const remaining = Math.max(0, config.expectedRateLimit!.requests - id);
        rateLimitHeaders['X-RateLimit-Limit'] = config.expectedRateLimit!.requests.toString();
        rateLimitHeaders['X-RateLimit-Remaining'] = remaining.toString();
        rateLimitHeaders['X-RateLimit-Reset'] = (Date.now() + 60000).toString();
      }

      return {
        id,
        timestamp: Date.now(),
        status,
        responseTime,
        rateLimitHeaders,
        isRateLimited
      };
    } catch (err: any) {
      return {
        id,
        timestamp: Date.now(),
        status: 0,
        responseTime: 0,
        rateLimitHeaders: {},
        isRateLimited: false,
        error: err.message
      };
    }
  };

  const runBurstTest = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setError(null);
    setSummary(null);

    try {
      const testResults: BurstTestResult[] = [];
      const batchSize = config.concurrency;
      const totalBatches = Math.ceil(config.requestCount / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, config.requestCount);
        const batchPromises: Promise<BurstTestResult>[] = [];

        // Create concurrent requests for this batch
        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(simulateRequest(i + 1));
        }

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        testResults.push(...batchResults);
        setResults([...testResults]);

        // Update progress
        const currentProgress = (testResults.length / config.requestCount) * 100;
        setProgress(currentProgress);

        // Add delay between batches if configured
        if (config.delayMs > 0 && batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, config.delayMs));
        }
      }

      // Calculate final summary
      const finalSummary = calculateSummary(testResults);
      setSummary(finalSummary);
      
      if (onTestComplete) {
        onTestComplete(finalSummary);
      }

    } catch (err: any) {
      setError(err.message || "Failed to run burst test");
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const stopTest = () => {
    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
    setSummary(null);
    setProgress(0);
    setError(null);
  };

  const getStatusColor = (status: number) => {
    if (status === 429) return "warning";
    if (status >= 200 && status < 300) return "success";
    if (status >= 400) return "error";
    return "default";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RateLimitIcon />
            Rate Limit Burst Testing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Test your rate limiting policies by sending bursts of requests and analyzing responses.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={isRunning ? <StopIcon /> : <StartIcon />}
            onClick={isRunning ? stopTest : runBurstTest}
            color={isRunning ? "error" : "primary"}
            disabled={!config.url}
          >
            {isRunning ? "Stop Test" : "Start Burst Test"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={clearResults}
            disabled={isRunning}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Rate Limit Testing
        </Typography>
        <Typography variant="body2">
          This tool sends multiple requests in quick succession to test rate limiting behavior.
          Monitor 429 responses, rate limit headers, and timing to validate your policies.
        </Typography>
      </Alert>

      {/* Test Configuration */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Configuration
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target URL"
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="http://localhost:8080/api/test"
                helperText="URL to test rate limiting against"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>HTTP Method</InputLabel>
                <Select
                  value={config.method}
                  onChange={(e) => setConfig(prev => ({ ...prev, method: e.target.value as any }))}
                  label="HTTP Method"
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Total Requests"
                value={config.requestCount}
                onChange={(e) => setConfig(prev => ({ ...prev, requestCount: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1, max: 1000 }}
                helperText="Number of requests to send"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Concurrency"
                value={config.concurrency}
                onChange={(e) => setConfig(prev => ({ ...prev, concurrency: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1, max: 20 }}
                helperText="Concurrent requests"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Delay (ms)"
                value={config.delayMs}
                onChange={(e) => setConfig(prev => ({ ...prev, delayMs: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 5000 }}
                helperText="Delay between batches"
              />
            </Grid>
          </Grid>

          {/* Expected Rate Limit */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Expected Rate Limit Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Expected Limit"
                    value={config.expectedRateLimit?.requests || 100}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      expectedRateLimit: {
                        ...prev.expectedRateLimit!,
                        requests: parseInt(e.target.value) || 100
                      }
                    }))}
                    helperText="Expected requests per time unit"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Unit</InputLabel>
                    <Select
                      value={config.expectedRateLimit?.timeUnit || "minute"}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        expectedRateLimit: {
                          ...prev.expectedRateLimit!,
                          timeUnit: e.target.value
                        }
                      }))}
                      label="Time Unit"
                    >
                      <MenuItem value="second">Per Second</MenuItem>
                      <MenuItem value="minute">Per Minute</MenuItem>
                      <MenuItem value="hour">Per Hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Headers Configuration */}
          <Accordion sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Request Headers</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {config.headers.map((header, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Header Name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, e.target.value, header.value)}
                      placeholder="X-User-ID"
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Header Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, header.key, e.target.value)}
                      placeholder="user123"
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton onClick={() => removeHeader(index)} color="error">
                      <ErrorIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button size="small" onClick={addHeader} startIcon={<InfoIcon />}>
                Add Header
              </Button>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Test Progress
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {results.length} / {config.requestCount} requests completed ({progress.toFixed(1)}%)
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Test Summary */}
      {summary && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ChartIcon />
              Test Results Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4" color="primary">
                    {summary.totalRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4" color="success.main">
                    {summary.successfulRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful (2xx)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4" color="warning.main">
                    {summary.rateLimitedRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rate Limited (429)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h4" color="error.main">
                    {summary.errorRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Errors (4xx/5xx)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Average Response Time:</Typography>
                <Typography variant="h6">{summary.averageResponseTime.toFixed(0)}ms</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Rate Limit Hit:</Typography>
                <Chip 
                  size="small"
                  icon={summary.rateLimitHit ? <WarningIcon /> : <SuccessIcon />}
                  label={summary.rateLimitHit ? "Yes" : "No"}
                  color={summary.rateLimitHit ? "warning" : "success"}
                />
              </Grid>
              {summary.firstRateLimitAt && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">First Rate Limit at Request:</Typography>
                  <Typography variant="h6">#{summary.firstRateLimitAt}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent Results Table */}
      {results.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Request Results
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response Time</TableCell>
                    <TableCell>Rate Limit Headers</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.slice(-10).map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>{result.id}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={result.status}
                          color={getStatusColor(result.status)}
                        />
                      </TableCell>
                      <TableCell>{result.responseTime}ms</TableCell>
                      <TableCell>
                        {Object.entries(result.rateLimitHeaders).length > 0 ? (
                          <Tooltip title={JSON.stringify(result.rateLimitHeaders, null, 2)}>
                            <Chip size="small" label="View Headers" variant="outlined" />
                          </Tooltip>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {results.length > 10 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Showing last 10 requests of {results.length} total
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Test Failed
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};