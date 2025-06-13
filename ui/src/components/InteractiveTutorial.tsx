import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Chip,
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Fab,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

// Tutorial step interface
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  validation?: () => Promise<boolean>;
  actionRequired?: {
    description: string;
    component?: string; // Which component to highlight
    action?: string; // Specific action to take
  };
  tips?: string[];
  timeEstimate?: string;
}

// Tutorial definition interface
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites?: string[];
  steps: TutorialStep[];
  category: 'gateway' | 'security' | 'traffic' | 'monitoring';
}

// Predefined tutorials
export const TUTORIALS: Tutorial[] = [
  {
    id: 'basic-gateway-setup',
    title: 'Your First Gateway',
    description: 'Learn how to create your first API Gateway and route traffic to a service',
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    category: 'gateway',
    steps: [
      {
        id: 'setup-loadbalancer',
        title: 'Configure LoadBalancer',
        description: 'First, we need to set up a LoadBalancer to assign external IPs to our Gateway',
        timeEstimate: '2 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              The LoadBalancer provides external IP addresses for your Gateways. Without it, your Gateway won't be accessible from outside the cluster.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> Navigate to the Gateway Management tab and click "Configure LoadBalancer" if it shows "NOT CONFIGURED".
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              The extension will automatically detect your Docker Desktop network and configure MetalLB with appropriate IP ranges.
            </Typography>
          </Box>
        ),
        actionRequired: {
          description: 'Configure LoadBalancer in Gateway Management tab',
          component: 'GatewayManagement',
          action: 'configure-loadbalancer'
        }
      },
      {
        id: 'deploy-sample-app',
        title: 'Deploy Sample Application',
        description: 'Deploy a simple echo service that we\'ll route traffic to',
        timeEstimate: '1 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We'll use a simple echo service that returns information about incoming requests. This helps us verify that routing is working correctly.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> Go to the Templates tab and apply the "Echo Service - Basic HTTP" template.
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              The echo service will be deployed to the 'demo' namespace and will be ready to receive traffic through our Gateway.
            </Typography>
          </Box>
        ),
        actionRequired: {
          description: 'Apply Echo Service template from Templates tab',
          component: 'Templates',
          action: 'apply-echo-template'
        }
      },
      {
        id: 'create-gateway',
        title: 'Create Your Gateway',
        description: 'Create a Gateway that will serve as the entry point for external traffic',
        timeEstimate: '3 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              A Gateway defines how external traffic enters your cluster. It specifies which ports to listen on and what protocols to accept.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> In Gateway Management, click "Create Gateway" and configure:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="Gateway Name: my-first-gateway" 
                  secondary="Choose a descriptive name"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Namespace: demo" 
                  secondary="Same namespace as our echo service"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Port: 80, Protocol: HTTP" 
                  secondary="Standard HTTP configuration"
                />
              </ListItem>
            </List>
          </Box>
        ),
        actionRequired: {
          description: 'Create Gateway with specified configuration',
          component: 'GatewayManagement',
          action: 'create-gateway'
        }
      },
      {
        id: 'create-httproute',
        title: 'Configure HTTP Routing',
        description: 'Create an HTTPRoute to direct traffic from the Gateway to your service',
        timeEstimate: '3 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              HTTPRoutes define how incoming requests are matched and forwarded to backend services. They connect your Gateway to your applications.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> In HTTPRoute Management, click "Create HTTPRoute" and configure:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="Route Name: echo-route" 
                  secondary="Descriptive name for the routing rule"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Parent Gateway: my-first-gateway" 
                  secondary="Connect to the gateway we just created"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Hostname: echo.local" 
                  secondary="The hostname clients will use"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Path: / (PathPrefix)" 
                  secondary="Match all paths starting with /"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Backend Service: echo-service" 
                  secondary="Route traffic to our echo service"
                />
              </ListItem>
            </List>
          </Box>
        ),
        actionRequired: {
          description: 'Create HTTPRoute with specified configuration',
          component: 'HTTPRouteManagement',
          action: 'create-httproute'
        }
      },
      {
        id: 'test-gateway',
        title: 'Test Your Gateway',
        description: 'Verify that your Gateway is working by sending test requests',
        timeEstimate: '1 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Now let's test our Gateway configuration by sending HTTP requests through it.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> In Testing & Proxy tab:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="1. Start kubectl proxy if needed" 
                  secondary="Click 'Start Proxy' in Proxy Manager"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Send test request" 
                  secondary="Use the HTTP client with URL from Gateway IP and Host: echo.local header"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Verify response" 
                  secondary="You should see JSON response with request details"
                />
              </ListItem>
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Success! If you see a JSON response with headers and request information, your Gateway is working correctly.
            </Typography>
          </Box>
        ),
        actionRequired: {
          description: 'Test Gateway with HTTP client',
          component: 'HTTPClient',
          action: 'send-test-request'
        }
      }
    ]
  },
  {
    id: 'jwt-authentication-setup',
    title: 'JWT Authentication Setup',
    description: 'Learn how to secure your APIs with JWT token-based authentication',
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    category: 'security',
    prerequisites: ['basic-gateway-setup'],
    steps: [
      {
        id: 'understand-jwt',
        title: 'Understanding JWT Authentication',
        description: 'Learn what JWT authentication is and why it\'s useful for API security',
        timeEstimate: '2 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              JWT (JSON Web Token) authentication provides stateless, token-based authentication perfect for modern applications and microservices.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Key Benefits:</strong>
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="Stateless Authentication" 
                  secondary="No server-side session storage required"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Claim-based Authorization" 
                  secondary="Tokens contain user information and permissions"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Cross-Service Communication" 
                  secondary="Same token works across multiple services"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Standards-Based" 
                  secondary="Industry standard with broad ecosystem support"
                />
              </ListItem>
            </List>
          </Box>
        )
      },
      {
        id: 'create-jwt-policy',
        title: 'Configure JWT Authentication Policy',
        description: 'Set up a JWT authentication policy for your HTTPRoute',
        timeEstimate: '5 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              JWT policies define how tokens should be validated and what information should be extracted from them.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> In Security Policies tab, JWT Authentication section:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="1. Click 'Add JWT Policy'" 
                  secondary="Start the JWT policy wizard"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Policy Name: demo-jwt-auth" 
                  secondary="Target: HTTPRoute → echo-route"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Configure Provider" 
                  secondary="Set issuer, audience, and JWKS URI"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Set up Claim Mapping" 
                  secondary="Map JWT claims to HTTP headers"
                />
              </ListItem>
            </List>
          </Box>
        ),
        actionRequired: {
          description: 'Create JWT authentication policy',
          component: 'SecurityPolicyManager',
          action: 'create-jwt-policy'
        }
      },
      {
        id: 'test-jwt-tokens',
        title: 'Test JWT Authentication',
        description: 'Generate test tokens and verify authentication is working',
        timeEstimate: '8 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Let's test our JWT authentication by generating tokens and making authenticated requests.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> In Testing & Proxy tab, JWT Testing Tools:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="1. Generate Test Token" 
                  secondary="Use the JWT Token Generator with custom claims"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Analyze Token" 
                  secondary="Use JWT Tester to verify token structure"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Test Protected Endpoint" 
                  secondary="Send requests with and without JWT tokens"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Verify Claim Mapping" 
                  secondary="Check that claims are mapped to headers correctly"
                />
              </ListItem>
            </List>
          </Box>
        ),
        actionRequired: {
          description: 'Test JWT authentication with generated tokens',
          component: 'JWTTester',
          action: 'test-jwt-auth'
        }
      }
    ]
  },
  {
    id: 'traffic-splitting-tutorial',
    title: 'Canary Deployments with Traffic Splitting',
    description: 'Learn how to safely deploy new versions using traffic splitting patterns',
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    category: 'traffic',
    prerequisites: ['basic-gateway-setup'],
    steps: [
      {
        id: 'understand-canary',
        title: 'Understanding Canary Deployments',
        description: 'Learn about canary deployments and traffic splitting strategies',
        timeEstimate: '3 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Canary deployments allow you to gradually roll out new versions by directing a small percentage of traffic to the new version.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Benefits of Canary Deployments:</strong>
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="Risk Reduction" 
                  secondary="Limit exposure to potential issues in new versions"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Performance Validation" 
                  secondary="Monitor metrics before full rollout"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Quick Rollback" 
                  secondary="Instant rollback if issues are detected"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="User Feedback" 
                  secondary="Gather feedback from real users on new features"
                />
              </ListItem>
            </List>
          </Box>
        )
      },
      {
        id: 'setup-traffic-splitting',
        title: 'Configure Traffic Splitting',
        description: 'Set up traffic splitting between two service versions',
        timeEstimate: '10 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We'll deploy two versions of a service and configure weighted routing between them.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> In Traffic Splitting tab:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="1. Choose Quick Start Wizard" 
                  secondary="Select Canary Deployment pattern"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Deploy Service Versions" 
                  secondary="Deploy both v1 (stable) and v2 (canary) versions"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Configure Initial Weights" 
                  secondary="Start with 90% v1, 10% v2"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Monitor Deployment Status" 
                  secondary="Verify both services are running"
                />
              </ListItem>
            </List>
          </Box>
        ),
        actionRequired: {
          description: 'Set up canary deployment with traffic splitting',
          component: 'TrafficSplittingManager',
          action: 'setup-canary'
        }
      },
      {
        id: 'test-and-monitor',
        title: 'Test and Monitor Traffic Distribution',
        description: 'Validate traffic splitting and monitor performance',
        timeEstimate: '7 min',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Generate load and monitor how traffic is distributed between the two versions.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>What to do:</strong> Use Traffic Generator and monitoring:
              </Typography>
            </Alert>
            <List dense sx={{ pl: 2 }}>
              <ListItem>
                <ListItemText 
                  primary="1. Generate Synthetic Traffic" 
                  secondary="Use Traffic Generator with 100-200 RPS"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Monitor Distribution" 
                  secondary="Verify 90/10 split in real-time metrics"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Adjust Weights" 
                  secondary="Gradually increase v2 traffic (70/30, then 50/50)"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Performance Comparison" 
                  secondary="Compare response times between versions"
                />
              </ListItem>
            </List>
          </Box>
        ),
        actionRequired: {
          description: 'Test traffic distribution with monitoring',
          component: 'TrafficGenerator',
          action: 'monitor-traffic-split'
        }
      }
    ]
  }
];

interface TutorialManagerProps {
  open: boolean;
  onClose: () => void;
  selectedTutorial?: string;
}

interface TutorialProgressState {
  currentStep: number;
  completedSteps: Set<string>;
  startTime: number;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ 
  open, 
  onClose, 
  selectedTutorial 
}) => {
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [progress, setProgress] = useState<TutorialProgressState>({
    currentStep: 0,
    completedSteps: new Set(),
    startTime: Date.now()
  });
  const [validatingStep, setValidatingStep] = useState(false);

  useEffect(() => {
    if (selectedTutorial) {
      const tutorial = TUTORIALS.find(t => t.id === selectedTutorial);
      if (tutorial) {
        setCurrentTutorial(tutorial);
        setProgress({
          currentStep: 0,
          completedSteps: new Set(),
          startTime: Date.now()
        });
      }
    }
  }, [selectedTutorial]);

  const handleStepComplete = async (stepId: string) => {
    const step = currentTutorial?.steps.find(s => s.id === stepId);
    
    if (step?.validation) {
      setValidatingStep(true);
      try {
        const isValid = await step.validation();
        if (!isValid) {
          // Show validation failed message
          setValidatingStep(false);
          return;
        }
      } catch (error) {
        console.error('Step validation failed:', error);
        setValidatingStep(false);
        return;
      }
      setValidatingStep(false);
    }

    setProgress(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, stepId]),
      currentStep: Math.min(prev.currentStep + 1, (currentTutorial?.steps.length || 1) - 1)
    }));
  };

  const getDifficultyColor = (difficulty: Tutorial['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: Tutorial['category']) => {
    switch (category) {
      case 'security': return '🔐';
      case 'traffic': return '🚦';
      case 'monitoring': return '📊';
      default: return '⚙️';
    }
  };

  if (!currentTutorial) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Interactive Tutorials</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Choose a tutorial to get started with hands-on learning:
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 2 }}>
            {TUTORIALS.map((tutorial) => (
              <Card 
                key={tutorial.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => setCurrentTutorial(tutorial)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Typography variant="h4" sx={{ minWidth: 40 }}>
                      {getCategoryIcon(tutorial.category)}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {tutorial.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tutorial.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={tutorial.difficulty} 
                          color={getDifficultyColor(tutorial.difficulty)}
                          size="small"
                        />
                        <Chip 
                          label={tutorial.estimatedTime} 
                          icon={<SpeedIcon />}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={`${tutorial.steps.length} steps`} 
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      {tutorial.prerequisites && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Prerequisites: {tutorial.prerequisites.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    startIcon={<PlayIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTutorial(tutorial);
                    }}
                  >
                    Start Tutorial
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const progressPercentage = (progress.completedSteps.size / currentTutorial.steps.length) * 100;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4">{getCategoryIcon(currentTutorial.category)}</Typography>
            <Box>
              <Typography variant="h6">{currentTutorial.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                Step {progress.currentStep + 1} of {currentTutorial.steps.length}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}% Complete
            </Typography>
            <IconButton onClick={() => setCurrentTutorial(null)} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ mt: 1, height: 6, borderRadius: 3 }}
        />
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', gap: 2, p: 0 }}>
        {/* Stepper sidebar */}
        <Box sx={{ width: 300, p: 2, bgcolor: 'background.default' }}>
          <Stepper orientation="vertical" activeStep={progress.currentStep}>
            {currentTutorial.steps.map((step, index) => (
              <Step key={step.id} completed={progress.completedSteps.has(step.id)}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.title}</Typography>
                  {step.timeEstimate && (
                    <Typography variant="caption" color="text.secondary">
                      {step.timeEstimate}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step content */}
        <Box sx={{ flex: 1, p: 3 }}>
          {currentTutorial.steps.map((step, index) => (
            <Box 
              key={step.id}
              sx={{ 
                display: index === progress.currentStep ? 'block' : 'none' 
              }}
            >
              <Typography variant="h5" gutterBottom>
                {step.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {step.description}
              </Typography>

              {step.content}

              {step.tips && step.tips.length > 0 && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    💡 Tips:
                  </Typography>
                  <List dense>
                    {step.tips.map((tip, tipIndex) => (
                      <ListItem key={tipIndex} sx={{ pl: 0 }}>
                        <ListItemText 
                          primary={tip}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  disabled={progress.currentStep === 0}
                  onClick={() => setProgress(prev => ({
                    ...prev,
                    currentStep: Math.max(0, prev.currentStep - 1)
                  }))}
                >
                  Previous
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {progress.completedSteps.has(step.id) ? (
                    <Chip 
                      icon={<CheckIcon />} 
                      label="Completed" 
                      color="success" 
                    />
                  ) : (
                    <Button
                      variant="contained"
                      disabled={validatingStep}
                      onClick={() => handleStepComplete(step.id)}
                      endIcon={validatingStep ? <CircularProgress size={16} /> : <ArrowForwardIcon />}
                    >
                      {validatingStep ? 'Validating...' : 'Mark Complete'}
                    </Button>
                  )}

                  {progress.currentStep < currentTutorial.steps.length - 1 && (
                    <Button
                      disabled={!progress.completedSteps.has(step.id)}
                      onClick={() => setProgress(prev => ({
                        ...prev,
                        currentStep: Math.min(currentTutorial.steps.length - 1, prev.currentStep + 1)
                      }))}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          ))}

          {/* Tutorial completion */}
          {progress.completedSteps.size === currentTutorial.steps.length && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CheckIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                🎉 Tutorial Completed!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Congratulations! You've successfully completed the {currentTutorial.title} tutorial.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained"
                  onClick={() => setCurrentTutorial(null)}
                >
                  Choose Another Tutorial
                </Button>
                <Button 
                  variant="outlined"
                  onClick={onClose}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Floating tutorial launcher
interface TutorialLauncherProps {
  onLaunchTutorial: (tutorialId?: string) => void;
}

export const TutorialLauncher: React.FC<TutorialLauncherProps> = ({ onLaunchTutorial }) => {
  return (
    <Tooltip title="Interactive Tutorials" placement="left">
      <Fab
        color="secondary"
        size="medium"
        onClick={() => onLaunchTutorial()}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <SchoolIcon />
      </Fab>
    </Tooltip>
  );
};

export default TutorialManager;