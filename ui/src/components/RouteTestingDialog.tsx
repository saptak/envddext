import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TestIcon from '@mui/icons-material/BugReport';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { HTTPClient } from './HTTPClient';
import { RouteTestingContext, TestResult, HTTPMethod } from '../types/httpClient';
import { getHTTPRouteStatus } from '../helper/kubernetes';
import { HTTPRouteStatusInfo } from '../types/httproute';

const ddClient = createDockerDesktopClient();

interface RouteTestingDialogProps {
  open: boolean;
  onClose: () => void;
  routeContext: RouteTestingContext;
}

export const RouteTestingDialog: React.FC<RouteTestingDialogProps> = ({
  open,
  onClose,
  routeContext
}) => {
  const [routeStatus, setRouteStatus] = useState<HTTPRouteStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (open && routeContext.routeName && routeContext.namespace) {
      fetchRouteStatus();
    }
  }, [open, routeContext]);

  const fetchRouteStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const status = await getHTTPRouteStatus(
        ddClient,
        routeContext.namespace,
        routeContext.routeName
      );

      setRouteStatus(status);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to fetch route status');
    } finally {
      setLoading(false);
    }
  };

  const generateTestUrl = (path?: string): string => {
    // Try to construct URL from route status or context
    // Use gateway information if available
    if (routeStatus?.parentGateways && routeStatus.parentGateways.length > 0) {
      const gateway = routeStatus.parentGateways[0];
      const port = gateway.name.includes('https') ? '8443' : '8080';
      return `http://localhost:${port}${path || '/'}`;
    }

    // Fallback to localhost with common ports
    const port = routeContext.gatewayName?.includes('https') ? '8443' : '8080';
    const host = 'localhost';
    return `http://${host}:${port}${path || '/'}`;
  };

  const getCommonTestPaths = (): Array<{ path: string; method: HTTPMethod; description: string }> => {
    // Since HTTPRouteStatusInfo doesn't have rules, use common paths
    const basePath = '/';

    return [
      { path: basePath, method: 'GET', description: 'Health check' },
      { path: `${basePath}health`, method: 'GET', description: 'Health endpoint' },
      { path: `${basePath}status`, method: 'GET', description: 'Status endpoint' },
      { path: basePath, method: 'POST', description: 'POST request' },
    ];
  };

  const handleTestComplete = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const handleQuickTest = (path: string, method: HTTPMethod) => {
    // This would trigger the HTTP client with pre-filled values
    // Implementation depends on how HTTPClient component is structured
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <TestIcon />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">
            Test HTTPRoute: {routeContext.routeName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Namespace: {routeContext.namespace}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Route Status Overview */}
          {loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading route information...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {routeStatus && (
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
              <Typography variant="subtitle1" gutterBottom>
                Route Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={routeStatus.status}
                    color={routeStatus.status === 'ready' ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>

                {routeStatus.parentGateways && routeStatus.parentGateways.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Gateway
                    </Typography>
                    <Typography variant="body2">
                      {routeStatus.parentGateways[0].name}
                    </Typography>
                  </Grid>
                )}

                {routeStatus.backendServices && routeStatus.backendServices.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Backend Services
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {routeStatus.backendServices.map((service, index) => (
                        <Chip
                          key={index}
                          label={`${service.name} (${service.status})`}
                          variant="outlined"
                          size="small"
                          color={service.status === 'available' ? 'success' : 'warning'}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Quick Test Actions */}
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
            <Typography variant="subtitle1" gutterBottom>
              Quick Tests
            </Typography>
            <Grid container spacing={1}>
              {getCommonTestPaths().map((test, index) => (
                <Grid item key={index}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickTest(test.path, test.method)}
                    sx={{ textTransform: 'none' }}
                  >
                    {test.method} {test.path}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Divider sx={{ my: 2 }} />

          {/* HTTP Client */}
          <HTTPClient
            initialUrl={generateTestUrl()}
            initialMethod="GET"
            onRequestComplete={handleTestComplete}
            compact={false}
          />

          {/* Recent Test Results Summary */}
          {testResults.length > 0 && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mt: 3,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Recent Test Results
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {testResults.slice(0, 5).map((result, index) => (
                  <Chip
                    key={result.id}
                    label={`${result.request.method} ${result.response?.status || 'ERROR'}`}
                    color={
                      result.error ? 'error' :
                      result.response?.status && result.response.status < 300 ? 'success' :
                      result.response?.status && result.response.status < 400 ? 'warning' : 'error'
                    }
                    size="small"
                    variant="filled"
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: 'background.default', p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button onClick={fetchRouteStatus} variant="contained" disabled={loading}>
          Refresh Route Info
        </Button>
      </DialogActions>
    </Dialog>
  );
};
