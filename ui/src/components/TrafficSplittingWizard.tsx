import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  CallSplit as SplitIcon
} from '@mui/icons-material';
import { createDockerDesktopClient } from "@docker/extension-api-client";

const ddClient = createDockerDesktopClient();

interface Service {
  name: string;
  version: string;
  weight: number;
  replicas: number;
  image: string;
}

interface TrafficSplittingConfig {
  routeName: string;
  gatewayName: string;
  namespace: string;
  pathPrefix: string;
  services: Service[];
}

const DEPLOYMENT_PATTERNS = [
  {
    name: 'Canary Deployment',
    description: 'Gradually shift traffic from old version to new version',
    icon: '🐤',
    defaultWeights: { v1: 90, v2: 10 },
    scenarios: [
      { stage: 'Initial', v1: 90, v2: 10, description: 'Start with 10% traffic to new version' },
      { stage: 'Testing', v1: 70, v2: 30, description: 'Increase to 30% after initial validation' },
      { stage: 'Confidence', v1: 50, v2: 50, description: 'Equal split for broader testing' },
      { stage: 'Migration', v1: 20, v2: 80, description: 'Majority traffic to new version' },
      { stage: 'Complete', v1: 0, v2: 100, description: 'Full migration complete' }
    ]
  },
  {
    name: 'Blue-Green Deployment',
    description: 'Instant switch between two complete environments',
    icon: '🔄',
    defaultWeights: { v1: 100, v2: 0 },
    scenarios: [
      { stage: 'Blue Active', v1: 100, v2: 0, description: 'Current version (Blue) serves all traffic' },
      { stage: 'Green Ready', v1: 100, v2: 0, description: 'New version (Green) deployed but not serving traffic' },
      { stage: 'Switch', v1: 0, v2: 100, description: 'Instant switch to new version (Green)' },
      { stage: 'Rollback', v1: 100, v2: 0, description: 'Quick rollback if issues detected' }
    ]
  },
  {
    name: 'A/B Testing',
    description: 'Split traffic evenly to compare two versions',
    icon: '⚖️',
    defaultWeights: { v1: 50, v2: 50 },
    scenarios: [
      { stage: 'Equal Split', v1: 50, v2: 50, description: 'Equal traffic for statistical significance' },
      { stage: 'Weighted', v1: 70, v2: 30, description: 'Adjust based on performance metrics' },
      { stage: 'Winner', v1: 0, v2: 100, description: 'Route all traffic to better performing version' }
    ]
  }
];

export const TrafficSplittingWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(DEPLOYMENT_PATTERNS[0]);
  const [config, setConfig] = useState<TrafficSplittingConfig>({
    routeName: 'traffic-split-route',
    gatewayName: 'demo-gateway',
    namespace: 'demo',
    pathPrefix: '/',
    services: [
      { name: 'echo-service-v1', version: 'v1', weight: 90, replicas: 1, image: 'ealen/echo-server:latest' },
      { name: 'echo-service-v2', version: 'v2', weight: 10, replicas: 1, image: 'ealen/echo-server:latest' }
    ]
  });
  const [deploymentProgress, setDeploymentProgress] = useState<{
    [key: string]: { status: 'pending' | 'deploying' | 'ready' | 'failed'; message?: string }
  }>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(0);

  const steps = [
    'Choose Deployment Pattern',
    'Configure Services',
    'Deploy Infrastructure',
    'Manage Traffic Distribution'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePatternSelect = (pattern: typeof DEPLOYMENT_PATTERNS[0]) => {
    setSelectedPattern(pattern);
    setConfig(prev => ({
      ...prev,
      services: prev.services.map((service, index) => ({
        ...service,
        weight: index === 0 ? pattern.defaultWeights.v1 : pattern.defaultWeights.v2
      }))
    }));
  };

  const handleWeightChange = (_: Event, newValue: number | number[]) => {
    const v1Weight = newValue as number;
    setConfig(prev => ({
      ...prev,
      services: prev.services.map((service, index) => ({
        ...service,
        weight: index === 0 ? v1Weight : 100 - v1Weight
      }))
    }));
  };

  const applyScenario = (scenario: typeof selectedPattern.scenarios[0]) => {
    setConfig(prev => ({
      ...prev,
      services: prev.services.map((service, index) => ({
        ...service,
        weight: index === 0 ? scenario.v1 : scenario.v2
      }))
    }));
  };

  const deployInfrastructure = async () => {
    setIsDeploying(true);
    setDeploymentProgress({});

    try {
      // Step 1: Deploy namespace
      setDeploymentProgress(prev => ({ ...prev, namespace: { status: 'deploying' } }));
      
      // Step 2: Deploy services
      setDeploymentProgress(prev => ({ 
        ...prev, 
        namespace: { status: 'ready' },
        services: { status: 'deploying' }
      }));

      // Step 3: Deploy gateway
      setDeploymentProgress(prev => ({ 
        ...prev, 
        services: { status: 'ready' },
        gateway: { status: 'deploying' }
      }));

      // Step 4: Deploy HTTPRoute with traffic splitting
      setDeploymentProgress(prev => ({ 
        ...prev, 
        gateway: { status: 'ready' },
        httproute: { status: 'deploying' }
      }));

      // Apply the traffic splitting template
      const result: any = await ddClient.extension?.vm?.service?.post('/apply-template', {
        templateUrl: 'https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/traffic-splitting/traffic-splitting.yaml'
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to deploy infrastructure');
      }

      setDeploymentProgress(prev => ({ 
        ...prev, 
        httproute: { status: 'ready' }
      }));

      // Auto-advance to next step
      setTimeout(() => {
        handleNext();
      }, 2000);

    } catch (error: any) {
      setDeploymentProgress(prev => ({ 
        ...prev, 
        error: { status: 'failed', message: error.message }
      }));
    } finally {
      setIsDeploying(false);
    }
  };

  const updateTrafficWeights = async () => {
    try {
      const httpRouteYaml = `
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ${config.routeName}
  namespace: ${config.namespace}
spec:
  parentRefs:
  - name: ${config.gatewayName}
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: ${config.pathPrefix}
    backendRefs:
    ${config.services.map(service => `    - name: ${service.name}
      port: 80
      weight: ${service.weight}`).join('\n')}
      `;

      const result: any = await ddClient.extension?.vm?.service?.post('/apply-yaml', {
        yaml: httpRouteYaml
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to update traffic weights');
      }

    } catch (error: any) {
      console.error('Error updating traffic weights:', error);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Your Deployment Strategy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select the traffic splitting pattern that best fits your deployment goals
            </Typography>
            
            <Grid container spacing={2}>
              {DEPLOYMENT_PATTERNS.map((pattern) => (
                <Grid item xs={12} md={4} key={pattern.name}>
                  <Card 
                    variant={selectedPattern.name === pattern.name ? "outlined" : "elevation"}
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedPattern.name === pattern.name ? 2 : 1,
                      borderColor: selectedPattern.name === pattern.name ? 'primary.main' : 'divider'
                    }}
                    onClick={() => handlePatternSelect(pattern)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h4" sx={{ mr: 1 }}>
                          {pattern.icon}
                        </Typography>
                        <Typography variant="h6">
                          {pattern.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {pattern.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedPattern && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {selectedPattern.name} Stages:
                  </Typography>
                  {selectedPattern.scenarios.map((scenario, index) => (
                    <Typography key={index} variant="body2">
                      {index + 1}. {scenario.stage}: {scenario.description} ({scenario.v1}% / {scenario.v2}%)
                    </Typography>
                  ))}
                </Alert>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Services
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Set up the services that will participate in traffic splitting
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Route Name"
                  value={config.routeName}
                  onChange={(e) => setConfig(prev => ({ ...prev, routeName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Namespace"
                  value={config.namespace}
                  onChange={(e) => setConfig(prev => ({ ...prev, namespace: e.target.value }))}
                />
              </Grid>
              
              {config.services.map((service, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Service {service.version.toUpperCase()}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Service Name"
                          value={service.name}
                          onChange={(e) => {
                            const newServices = [...config.services];
                            newServices[index] = { ...service, name: e.target.value };
                            setConfig(prev => ({ ...prev, services: newServices }));
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Version"
                          value={service.version}
                          onChange={(e) => {
                            const newServices = [...config.services];
                            newServices[index] = { ...service, version: e.target.value };
                            setConfig(prev => ({ ...prev, services: newServices }));
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Weight"
                          type="number"
                          value={service.weight}
                          onChange={(e) => {
                            const newWeight = parseInt(e.target.value) || 0;
                            const newServices = [...config.services];
                            newServices[index] = { ...service, weight: newWeight };
                            setConfig(prev => ({ ...prev, services: newServices }));
                          }}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Replicas"
                          type="number"
                          value={service.replicas}
                          onChange={(e) => {
                            const newReplicas = parseInt(e.target.value) || 1;
                            const newServices = [...config.services];
                            newServices[index] = { ...service, replicas: newReplicas };
                            setConfig(prev => ({ ...prev, services: newServices }));
                          }}
                          inputProps={{ min: 1, max: 10 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Weight: {config.services.reduce((sum, service) => sum + service.weight, 0)}%
                {config.services.reduce((sum, service) => sum + service.weight, 0) !== 100 && (
                  <Chip label="Should total 100%" color="warning" size="small" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Deploy Infrastructure
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Deploy the necessary Kubernetes resources for traffic splitting
            </Typography>

            <List>
              {Object.entries({
                namespace: 'Create namespace',
                services: 'Deploy services and deployments',
                gateway: 'Configure Envoy Gateway',
                httproute: 'Set up HTTPRoute with traffic splitting'
              }).map(([key, description]) => (
                <ListItem key={key}>
                  <ListItemIcon>
                    {deploymentProgress[key]?.status === 'ready' ? (
                      <CheckCircleIcon color="success" />
                    ) : deploymentProgress[key]?.status === 'deploying' ? (
                      <CircularProgress size={24} />
                    ) : deploymentProgress[key]?.status === 'failed' ? (
                      <WarningIcon color="error" />
                    ) : (
                      <CircleIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={description}
                    secondary={deploymentProgress[key]?.message}
                  />
                </ListItem>
              ))}
            </List>

            {deploymentProgress.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deploymentProgress.error.message}
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={deployInfrastructure}
                disabled={isDeploying}
                startIcon={isDeploying ? <CircularProgress size={20} /> : undefined}
              >
                {isDeploying ? 'Deploying...' : 'Deploy Infrastructure'}
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Manage Traffic Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control how traffic is distributed between your service versions
            </Typography>

            {/* Current Distribution */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Distribution
              </Typography>
              <Grid container spacing={2} alignItems="center">
                {config.services.map((service, index) => (
                  <Grid item xs={6} key={index}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color={index === 0 ? 'primary.main' : 'secondary.main'}>
                        {service.weight}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.name}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={service.weight} 
                        color={index === 0 ? 'primary' : 'secondary'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Traffic Control */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Adjust Traffic Distribution
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={config.services[0]?.weight || 50}
                  onChange={handleWeightChange}
                  min={0}
                  max={100}
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}% v1 / ${100 - value}% v2`}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={updateTrafficWeights}
                  size="small"
                >
                  Apply Changes
                </Button>
              </Box>
            </Paper>

            {/* Deployment Pattern Scenarios */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {selectedPattern.name} Scenarios
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {selectedPattern.scenarios.map((scenario, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => {
                          applyScenario(scenario);
                          setCurrentScenario(index);
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {scenario.stage}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {scenario.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={`${scenario.v1}% v1`} 
                              color="primary" 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${scenario.v2}% v2`} 
                              color="secondary" 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SplitIcon sx={{ mr: 1, fontSize: 32 }} />
        <Box>
          <Typography variant="h5">
            Traffic Splitting Wizard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step-by-step setup for advanced traffic management
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="h6">{label}</Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(index)}
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                    disabled={
                      (index === 0 && !selectedPattern) ||
                      (index === 1 && config.services.reduce((sum, service) => sum + service.weight, 0) !== 100) ||
                      (index === 2 && deploymentProgress.httproute?.status !== 'ready')
                    }
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};