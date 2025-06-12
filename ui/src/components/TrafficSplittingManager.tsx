import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Timeline as TimelineIcon,
  CallSplit as SplitIcon
} from '@mui/icons-material';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { TrafficSplittingWizard } from './TrafficSplittingWizard';
import { TrafficGenerator } from './TrafficGenerator';

const ddClient = createDockerDesktopClient();

interface TrafficDistribution {
  v1: number;
  v2: number;
}

interface DeploymentStatus {
  v1: { ready: boolean; replicas: string; image: string };
  v2: { ready: boolean; replicas: string; image: string };
  gateway: { ready: boolean; address?: string };
  httpRoute: { ready: boolean; weights?: { v1: number; v2: number } };
}

interface TrafficSimulation {
  running: boolean;
  totalRequests: number;
  v1Responses: number;
  v2Responses: number;
  currentRps: number;
}

export const TrafficSplittingManager: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    v1: { ready: false, replicas: '0/0', image: 'ealen/echo-server:latest' },
    v2: { ready: false, replicas: '0/0', image: 'ealen/echo-server:latest' },
    gateway: { ready: false },
    httpRoute: { ready: false }
  });
  
  const [trafficDistribution, setTrafficDistribution] = useState<TrafficDistribution>({
    v1: 80,
    v2: 20
  });
  
  const [simulation, setSimulation] = useState<TrafficSimulation>({
    running: false,
    totalRequests: 0,
    v1Responses: 0,
    v2Responses: 0,
    currentRps: 5
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkDeploymentStatus();
    
    if (autoRefresh) {
      const interval = setInterval(checkDeploymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const checkDeploymentStatus = async () => {
    try {
      // Check if demo namespace exists and get deployment status
      const result = await ddClient.extension?.host?.cli?.exec("kubectl", [
        "get", "deployments,services,gateway,httproute", 
        "-n", "demo", 
        "-o", "json"
      ]);
      
      if (result && result.code === 0) {
        const resources = JSON.parse(result.stdout);
        updateDeploymentStatusFromResources(resources);
      } else {
        // Demo namespace doesn't exist or no resources
        setDeploymentStatus({
          v1: { ready: false, replicas: '0/0', image: 'ealen/echo-server:latest' },
          v2: { ready: false, replicas: '0/0', image: 'ealen/echo-server:latest' },
          gateway: { ready: false },
          httpRoute: { ready: false }
        });
      }
    } catch (err: any) {
      console.error('Error checking deployment status:', err);
    }
  };

  const updateDeploymentStatusFromResources = (resources: any) => {
    const items = resources.items || [];
    
    const v1Deployment = items.find((item: any) => 
      item.kind === 'Deployment' && item.metadata.name === 'echo-service-v1'
    );
    const v2Deployment = items.find((item: any) => 
      item.kind === 'Deployment' && item.metadata.name === 'echo-service-v2'
    );
    const gateway = items.find((item: any) => 
      item.kind === 'Gateway' && item.metadata.name === 'demo-gateway'
    );
    const httpRoute = items.find((item: any) => 
      item.kind === 'HTTPRoute' && item.metadata.name === 'echo-route'
    );

    setDeploymentStatus({
      v1: {
        ready: v1Deployment ? (v1Deployment.status?.readyReplicas || 0) > 0 : false,
        replicas: v1Deployment ? `${v1Deployment.status?.readyReplicas || 0}/${v1Deployment.spec?.replicas || 1}` : '0/0',
        image: 'ealen/echo-server:latest'
      },
      v2: {
        ready: v2Deployment ? (v2Deployment.status?.readyReplicas || 0) > 0 : false,
        replicas: v2Deployment ? `${v2Deployment.status?.readyReplicas || 0}/${v2Deployment.spec?.replicas || 1}` : '0/0',
        image: 'ealen/echo-server:latest'
      },
      gateway: {
        ready: gateway ? gateway.status?.conditions?.some((c: any) => c.type === 'Accepted' && c.status === 'True') : false,
        address: gateway?.status?.addresses?.[0]?.value
      },
      httpRoute: {
        ready: httpRoute ? httpRoute.status?.parents?.[0]?.conditions?.some((c: any) => c.type === 'Accepted' && c.status === 'True') : false,
        weights: httpRoute ? extractWeightsFromHTTPRoute(httpRoute) : undefined
      }
    });
  };

  const extractWeightsFromHTTPRoute = (httpRoute: any) => {
    const backendRefs = httpRoute.spec?.rules?.[0]?.backendRefs || [];
    const v1Backend = backendRefs.find((ref: any) => ref.name === 'echo-service-v1');
    const v2Backend = backendRefs.find((ref: any) => ref.name === 'echo-service-v2');
    
    return {
      v1: v1Backend?.weight || 0,
      v2: v2Backend?.weight || 0
    };
  };

  const deployTrafficSplittingDemo = async () => {
    try {
      setLoading(true);
      setError(null);

      const result: any = await ddClient.extension?.vm?.service?.post('/apply-template', {
        templateUrl: 'https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/traffic-splitting/traffic-splitting.yaml'
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to deploy traffic splitting demo');
      }

      // Wait a moment for resources to be created
      setTimeout(() => {
        checkDeploymentStatus();
      }, 2000);

    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to deploy traffic splitting demo');
    } finally {
      setLoading(false);
    }
  };

  const updateTrafficWeights = async () => {
    try {
      setLoading(true);
      setError(null);

      const httpRouteYaml = `
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: echo-route
  namespace: demo
spec:
  parentRefs:
  - name: demo-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: echo-service-v1
      port: 80
      weight: ${trafficDistribution.v1}
    - name: echo-service-v2
      port: 80
      weight: ${trafficDistribution.v2}
      `;

      const result: any = await ddClient.extension?.vm?.service?.post('/apply-yaml', {
        yaml: httpRouteYaml
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to update traffic weights');
      }

      setTimeout(() => {
        checkDeploymentStatus();
      }, 1000);

    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to update traffic weights');
    } finally {
      setLoading(false);
    }
  };

  const startTrafficSimulation = async () => {
    try {
      if (!deploymentStatus.gateway.address) {
        throw new Error('Gateway address not available');
      }

      setSimulation(prev => ({
        ...prev,
        running: true,
        totalRequests: 0,
        v1Responses: 0,
        v2Responses: 0
      }));

      // Simulate traffic by making requests (this is a simplified simulation)
      const interval = setInterval(async () => {
        try {
          for (let i = 0; i < simulation.currentRps; i++) {
            // Simulate request to gateway
            const mockResponse = Math.random() < (trafficDistribution.v1 / 100) ? 'v1' : 'v2';
            
            setSimulation(prev => ({
              ...prev,
              totalRequests: prev.totalRequests + 1,
              v1Responses: prev.v1Responses + (mockResponse === 'v1' ? 1 : 0),
              v2Responses: prev.v2Responses + (mockResponse === 'v2' ? 1 : 0)
            }));
          }
        } catch (err) {
          console.error('Simulation error:', err);
        }
      }, 1000);

      // Store interval ID for cleanup
      (window as any).trafficSimulationInterval = interval;

    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to start traffic simulation');
      setSimulation(prev => ({ ...prev, running: false }));
    }
  };

  const stopTrafficSimulation = () => {
    if ((window as any).trafficSimulationInterval) {
      clearInterval((window as any).trafficSimulationInterval);
      (window as any).trafficSimulationInterval = null;
    }
    setSimulation(prev => ({ ...prev, running: false }));
  };

  const resetDemo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Delete demo namespace
      await ddClient.extension?.host?.cli?.exec("kubectl", ["delete", "namespace", "demo", "--ignore-not-found"]);
      
      // Reset state
      setDeploymentStatus({
        v1: { ready: false, replicas: '0/0', image: 'ealen/echo-server:latest' },
        v2: { ready: false, replicas: '0/0', image: 'ealen/echo-server:latest' },
        gateway: { ready: false },
        httpRoute: { ready: false }
      });
      
      setTrafficDistribution({ v1: 80, v2: 20 });
      stopTrafficSimulation();
      setSimulation({
        running: false,
        totalRequests: 0,
        v1Responses: 0,
        v2Responses: 0,
        currentRps: 5
      });

    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to reset demo');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const v1Weight = newValue as number;
    setTrafficDistribution({
      v1: v1Weight,
      v2: 100 - v1Weight
    });
  };

  const isDeploymentReady = deploymentStatus.v1.ready && deploymentStatus.v2.ready && 
                           deploymentStatus.gateway.ready && deploymentStatus.httpRoute.ready;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Traffic Splitting & Canary Deployments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Demonstrate traffic splitting between multiple versions of an application using weighted routing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto-refresh"
          />
          <IconButton onClick={checkDeploymentStatus} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="traffic splitting tabs">
          <Tab label="Quick Start Wizard" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Advanced Management" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="Traffic Testing" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>
      </Box>

      {/* Wizard Tab */}
      <Box
        role="tabpanel"
        hidden={currentTab !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {currentTab === 0 && <TrafficSplittingWizard />}
      </Box>

      {/* Advanced Management Tab */}
      <Box
        role="tabpanel"
        hidden={currentTab !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {currentTab === 1 && (
          <>
            {/* Deployment Status */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SplitIcon />
                Deployment Status
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Echo Service v1
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip 
                          label={deploymentStatus.v1.ready ? 'Ready' : 'Not Ready'} 
                          color={deploymentStatus.v1.ready ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {deploymentStatus.v1.replicas}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Echo Service v2
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip 
                          label={deploymentStatus.v2.ready ? 'Ready' : 'Not Ready'} 
                          color={deploymentStatus.v2.ready ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {deploymentStatus.v2.replicas}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gateway
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip 
                          label={deploymentStatus.gateway.ready ? 'Ready' : 'Not Ready'} 
                          color={deploymentStatus.gateway.ready ? 'success' : 'default'}
                          size="small"
                        />
                        {deploymentStatus.gateway.address && (
                          <Typography variant="body2" color="text.secondary">
                            {deploymentStatus.gateway.address}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        HTTPRoute
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip 
                          label={deploymentStatus.httpRoute.ready ? 'Configured' : 'Not Ready'} 
                          color={deploymentStatus.httpRoute.ready ? 'success' : 'default'}
                          size="small"
                        />
                        {deploymentStatus.httpRoute.weights && (
                          <Typography variant="body2" color="text.secondary">
                            {deploymentStatus.httpRoute.weights.v1}:{deploymentStatus.httpRoute.weights.v2}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {!isDeploymentReady ? (
                  <Button
                    variant="contained"
                    onClick={deployTrafficSplittingDemo}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
                  >
                    {loading ? 'Deploying...' : 'Deploy Traffic Splitting Demo'}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={resetDemo}
                    disabled={loading}
                    color="warning"
                  >
                    Reset Demo
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Traffic Distribution Control */}
            {isDeploymentReady && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Traffic Distribution Control
                </Typography>
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Adjust traffic distribution between versions
                    </Typography>
                    <Box sx={{ px: 2 }}>
                      <Slider
                        value={trafficDistribution.v1}
                        onChange={handleSliderChange}
                        min={0}
                        max={100}
                        step={5}
                        marks={[
                          { value: 0, label: '0% v1' },
                          { value: 50, label: '50/50' },
                          { value: 100, label: '100% v1' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}% v1 / ${100 - value}% v2`}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={`v1: ${trafficDistribution.v1}%`} color="primary" variant="outlined" />
                        <Chip label={`v2: ${trafficDistribution.v2}%`} color="secondary" variant="outlined" />
                      </Box>
                      <Button
                        variant="contained"
                        onClick={updateTrafficWeights}
                        disabled={loading}
                        size="small"
                      >
                        Apply Changes
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* Traffic Testing Tab */}
      <Box
        role="tabpanel"
        hidden={currentTab !== 2}
        id="tabpanel-2"
        aria-labelledby="tab-2"
      >
        {currentTab === 2 && (
          <Box>
            {!isDeploymentReady ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Deploy Traffic Splitting Demo First
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Use the Quick Start Wizard or Advanced Management tab to deploy the demo infrastructure before testing traffic splitting.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentTab(0)}
                  startIcon={<LaunchIcon />}
                >
                  Go to Quick Start
                </Button>
              </Paper>
            ) : (
              <Box>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Traffic Testing Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Test your traffic splitting configuration by generating synthetic traffic and observing the distribution.
                  </Typography>
                  {deploymentStatus.gateway.address && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Target URL:</strong> http://{deploymentStatus.gateway.address}/
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Configure the Traffic Generator to use this URL to test your traffic splitting setup.
                      </Typography>
                    </Alert>
                  )}
                </Paper>
                <TrafficGenerator />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};