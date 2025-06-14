import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

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

interface MetricsHistory {
  timestamp: number;
  totalRequests: number;
  avgResponseTime: number;
  rps: number;
  successRate: number;
}

interface TrafficVisualizationProps {
  metrics: TrafficMetrics | null;
  className?: string;
}

export const TrafficVisualization: React.FC<TrafficVisualizationProps> = ({ 
  metrics, 
  className 
}) => {
  const theme = useTheme();
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);

  // Store metrics history for trend visualization
  useEffect(() => {
    if (metrics) {
      const newPoint: MetricsHistory = {
        timestamp: Date.now(),
        totalRequests: metrics.totalRequests,
        avgResponseTime: metrics.avgResponseTime,
        rps: metrics.rps,
        successRate: metrics.successRate
      };

      setMetricsHistory(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 50 data points
        return updated.slice(-50);
      });
    }
  }, [metrics]);

  // Reset history when test stops
  useEffect(() => {
    if (metrics && !metrics.isRunning && metricsHistory.length > 0) {
      // Keep final state but mark as complete
      const finalPoint = metricsHistory[metricsHistory.length - 1];
      if (finalPoint) {
        finalPoint.timestamp = Date.now();
      }
    }
  }, [metrics?.isRunning]);

  if (!metrics) {
    return (
      <Box className={className}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No Traffic Data Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start a traffic test to see visualizations
          </Typography>
        </Paper>
      </Box>
    );
  }

  const getStatusColor = (statusCode: string) => {
    const code = parseInt(statusCode);
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'info';
    if (code >= 400 && code < 500) return 'warning';
    return 'error';
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time.toFixed(0)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  // Simple SVG bar chart for response times
  const ResponseTimeChart = () => {
    const { minResponseTime, avgResponseTime, maxResponseTime } = metrics;
    const maxTime = Math.max(maxResponseTime, avgResponseTime * 1.5);
    
    return (
      <Box sx={{ height: 120, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 300 100">
          {/* Min Response Time */}
          <rect
            x="20"
            y={80 - (minResponseTime / maxTime) * 60}
            width="60"
            height={(minResponseTime / maxTime) * 60}
            fill={theme.palette.primary.main}
            opacity={0.7}
          />
          <text x="50" y="95" textAnchor="middle" fontSize="10" fill={theme.palette.text.secondary}>
            Min
          </text>
          
          {/* Avg Response Time */}
          <rect
            x="120"
            y={80 - (avgResponseTime / maxTime) * 60}
            width="60"
            height={(avgResponseTime / maxTime) * 60}
            fill={theme.palette.success.main}
            opacity={0.7}
          />
          <text x="150" y="95" textAnchor="middle" fontSize="10" fill={theme.palette.text.secondary}>
            Avg
          </text>
          
          {/* Max Response Time */}
          <rect
            x="220"
            y={80 - (maxResponseTime / maxTime) * 60}
            width="60"
            height={(maxResponseTime / maxTime) * 60}
            fill={theme.palette.warning.main}
            opacity={0.7}
          />
          <text x="250" y="95" textAnchor="middle" fontSize="10" fill={theme.palette.text.secondary}>
            Max
          </text>
          
          {/* Values */}
          <text x="50" y={75 - (minResponseTime / maxTime) * 60} textAnchor="middle" fontSize="9" fill={theme.palette.text.primary}>
            {formatResponseTime(minResponseTime)}
          </text>
          <text x="150" y={75 - (avgResponseTime / maxTime) * 60} textAnchor="middle" fontSize="9" fill={theme.palette.text.primary}>
            {formatResponseTime(avgResponseTime)}
          </text>
          <text x="250" y={75 - (maxResponseTime / maxTime) * 60} textAnchor="middle" fontSize="9" fill={theme.palette.text.primary}>
            {formatResponseTime(maxResponseTime)}
          </text>
        </svg>
      </Box>
    );
  };

  // Simple trend line for RPS
  const RPSTrendChart = () => {
    if (metricsHistory.length < 2) {
      return (
        <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Collecting data...
          </Typography>
        </Box>
      );
    }

    const maxRPS = Math.max(...metricsHistory.map(m => m.rps));
    const width = 280;
    const height = 50;
    
    const points = metricsHistory.map((point, index) => {
      const x = (index / (metricsHistory.length - 1)) * width;
      const y = height - (point.rps / maxRPS) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Box sx={{ height: 60, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <polyline
            points={points}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
          />
          {/* Data points */}
          {metricsHistory.map((point, index) => {
            const x = (index / (metricsHistory.length - 1)) * width;
            const y = height - (point.rps / maxRPS) * height;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={theme.palette.primary.main}
              />
            );
          })}
        </svg>
      </Box>
    );
  };

  return (
    <Box className={className}>
      <Grid container spacing={3}>
        {/* Key Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {metrics.rps.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requests/sec
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SuccessIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {metrics.successRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimelineIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {formatResponseTime(metrics.avgResponseTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Response
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {metrics.failedRequests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Response Time Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Time Distribution
            </Typography>
            <ResponseTimeChart />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Min</Typography>
                <Typography variant="body2">{formatResponseTime(metrics.minResponseTime)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Avg</Typography>
                <Typography variant="body2">{formatResponseTime(metrics.avgResponseTime)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Max</Typography>
                <Typography variant="body2">{formatResponseTime(metrics.maxResponseTime)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* RPS Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Requests Per Second Trend
            </Typography>
            <RPSTrendChart />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Current: {metrics.rps.toFixed(1)} RPS
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.isRunning ? 'Running' : 'Completed'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Status Codes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              HTTP Status Codes
            </Typography>
            {Object.keys(metrics.statusCodes).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No requests completed yet
              </Typography>
            ) : (
              <Box>
                {Object.entries(metrics.statusCodes).map(([code, count]) => {
                  const percentage = (count / metrics.totalRequests) * 100;
                  return (
                    <Box key={code} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={code}
                          color={getStatusColor(code)}
                          size="small"
                        />
                        <Typography variant="body2">
                          {count} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        color={getStatusColor(code)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Request Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Summary
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total Requests</TableCell>
                    <TableCell align="right">{metrics.totalRequests}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Successful</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      {metrics.successRequests}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Failed</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      {metrics.failedRequests}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Error Rate</TableCell>
                    <TableCell align="right">
                      {metrics.errorRate.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Test Duration</TableCell>
                    <TableCell align="right">{metrics.elapsedTime}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Errors */}
        {metrics.errors.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Errors ({metrics.errors.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {metrics.errors.slice(-5).map((error, index) => (
                  <Alert
                    key={index}
                    severity="error"
                    sx={{ mb: 1 }}
                    variant="outlined"
                  >
                    {error}
                  </Alert>
                ))}
                {metrics.errors.length > 5 && (
                  <Typography variant="caption" color="text.secondary">
                    ... and {metrics.errors.length - 5} more errors
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};