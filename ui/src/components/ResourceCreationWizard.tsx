import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Chip,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Router as GatewayIcon,
  Route as RouteIcon,
  Security as SecurityIcon,
  VpnKey as AuthIcon,
  Public as CorsIcon,
  Block as IPFilterIcon,
  VerifiedUser as MTLSIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

interface ResourceCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type ResourceType = "gateway" | "httproute" | "security-policy";
type SecurityPolicyType = "basic-auth" | "cors" | "ip-filter" | "mtls";

interface WizardState {
  activeStep: number;
  resourceType: ResourceType | null;
  securityPolicyType: SecurityPolicyType | null;
  resourceName: string;
  namespace: string;
  configuration: Record<string, any>;
}

export const ResourceCreationWizard: React.FC<ResourceCreationWizardProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const [state, setState] = React.useState<WizardState>({
    activeStep: 0,
    resourceType: null,
    securityPolicyType: null,
    resourceName: "",
    namespace: "default",
    configuration: {}
  });

  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const steps = [
    "Choose Resource Type",
    "Configure Resource",
    "Review & Create"
  ];

  const resourceTypes = [
    {
      id: "gateway" as ResourceType,
      name: "Gateway",
      description: "Create a new Gateway to handle incoming traffic",
      icon: <GatewayIcon sx={{ color: "#2196f3" }} />,
      complexity: "Medium",
      estimatedTime: "2-5 minutes"
    },
    {
      id: "httproute" as ResourceType,
      name: "HTTPRoute", 
      description: "Create routing rules for HTTP traffic",
      icon: <RouteIcon sx={{ color: "#4caf50" }} />,
      complexity: "Easy",
      estimatedTime: "1-3 minutes"
    },
    {
      id: "security-policy" as ResourceType,
      name: "Security Policy",
      description: "Add security policies to protect your routes",
      icon: <SecurityIcon sx={{ color: "#ff9800" }} />,
      complexity: "Medium",
      estimatedTime: "3-7 minutes"
    }
  ];

  const securityPolicyTypes = [
    {
      id: "basic-auth" as SecurityPolicyType,
      name: "Basic Authentication",
      description: "Username and password protection",
      icon: <AuthIcon sx={{ color: "#2196f3" }} />,
      difficulty: "Easy",
      prerequisites: ["Gateway", "HTTPRoute"]
    },
    {
      id: "cors" as SecurityPolicyType,
      name: "CORS Policy",
      description: "Cross-Origin Resource Sharing configuration",
      icon: <CorsIcon sx={{ color: "#4caf50" }} />,
      difficulty: "Medium",
      prerequisites: ["Gateway", "HTTPRoute"]
    },
    {
      id: "ip-filter" as SecurityPolicyType,
      name: "IP Filtering",
      description: "Allow or deny specific IP addresses",
      icon: <IPFilterIcon sx={{ color: "#ff9800" }} />,
      difficulty: "Medium",
      prerequisites: ["Gateway"]
    },
    {
      id: "mtls" as SecurityPolicyType,
      name: "Mutual TLS",
      description: "Client certificate authentication",
      icon: <MTLSIcon sx={{ color: "#9c27b0" }} />,
      difficulty: "Advanced",
      prerequisites: ["Gateway", "TLS Certificate"]
    }
  ];

  const handleNext = () => {
    setState(prev => ({ ...prev, activeStep: prev.activeStep + 1 }));
    setError(null);
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, activeStep: prev.activeStep - 1 }));
    setError(null);
  };

  const handleResourceTypeSelect = (resourceType: ResourceType) => {
    setState(prev => ({ 
      ...prev, 
      resourceType,
      securityPolicyType: null,
      configuration: {}
    }));
  };

  const handleSecurityPolicyTypeSelect = (securityPolicyType: SecurityPolicyType) => {
    setState(prev => ({ 
      ...prev, 
      securityPolicyType,
      configuration: {}
    }));
  };

  const handleConfigurationChange = (key: string, value: any) => {
    setState(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Simulate resource creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call the appropriate API
      console.log("Creating resource:", state);
      
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to create resource");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setState({
      activeStep: 0,
      resourceType: null,
      securityPolicyType: null,
      resourceName: "",
      namespace: "default",
      configuration: {}
    });
    setError(null);
    onClose();
  };

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return state.resourceType !== null;
      case 1:
        if (state.resourceType === "security-policy") {
          return state.securityPolicyType !== null && state.resourceName.length > 0;
        }
        return state.resourceName.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(state.activeStep);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              What type of resource would you like to create? Choose the option that best fits your needs.
            </Typography>
            
            <Grid container spacing={2}>
              {resourceTypes.map((resource) => (
                <Grid item xs={12} key={resource.id}>
                  <Card 
                    variant={state.resourceType === resource.id ? "elevation" : "outlined"}
                    sx={{ 
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      border: state.resourceType === resource.id ? 2 : 1,
                      borderColor: state.resourceType === resource.id ? "primary.main" : "divider",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleResourceTypeSelect(resource.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        {resource.icon}
                        <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                          {resource.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={resource.complexity} 
                          color={resource.complexity === "Easy" ? "success" : "warning"}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {resource.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Estimated time: {resource.estimatedTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            {state.resourceType === "security-policy" && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" paragraph>
                  Select the type of security policy you want to configure:
                </Typography>
                
                <Grid container spacing={2}>
                  {securityPolicyTypes.map((policy) => (
                    <Grid item xs={12} md={6} key={policy.id}>
                      <Card 
                        variant={state.securityPolicyType === policy.id ? "elevation" : "outlined"}
                        sx={{ 
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          border: state.securityPolicyType === policy.id ? 2 : 1,
                          borderColor: state.securityPolicyType === policy.id ? "primary.main" : "divider",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: 2
                          }
                        }}
                        onClick={() => handleSecurityPolicyTypeSelect(policy.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            {policy.icon}
                            <Typography variant="subtitle1" sx={{ ml: 1, flexGrow: 1 }}>
                              {policy.name}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={policy.difficulty} 
                              color={
                                policy.difficulty === "Easy" ? "success" :
                                policy.difficulty === "Medium" ? "warning" : "error"
                              }
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {policy.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Prerequisites: {policy.prerequisites.join(", ")}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Basic Configuration */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Basic Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Resource Name"
                    value={state.resourceName}
                    onChange={(e) => setState(prev => ({ ...prev, resourceName: e.target.value }))}
                    placeholder={`my-${state.resourceType || "resource"}`}
                    helperText="Choose a descriptive name for your resource"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Namespace"
                    value={state.namespace}
                    onChange={(e) => setState(prev => ({ ...prev, namespace: e.target.value }))}
                    helperText="Kubernetes namespace for the resource"
                  />
                </Grid>
              </Grid>

              {/* Advanced Configuration Accordion */}
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Advanced Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Advanced settings will be pre-configured with sensible defaults. 
                    You can modify these after creation through the management interface.
                  </Alert>
                  
                  {state.resourceType === "gateway" && (
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="HTTP Listener on port 80"
                          secondary="Default HTTP listener configuration"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="LoadBalancer service type"
                          secondary="Automatically configured for Docker Desktop"
                        />
                      </ListItem>
                    </List>
                  )}

                  {state.resourceType === "httproute" && (
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Path prefix matching"
                          secondary="Route traffic based on URL paths"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Backend service references"
                          secondary="Automatically detect available services"
                        />
                      </ListItem>
                    </List>
                  )}

                  {state.resourceType === "security-policy" && state.securityPolicyType && (
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Target resource selection"
                          secondary="Apply policy to specific Gateways or HTTPRoutes"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Security best practices"
                          secondary="Pre-configured with recommended security settings"
                        />
                      </ListItem>
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Configuration
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Resource Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Type:</Typography>
                    <Typography variant="body1">{state.resourceType}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Name:</Typography>
                    <Typography variant="body1">{state.resourceName || "Not specified"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Namespace:</Typography>
                    <Typography variant="body1">{state.namespace}</Typography>
                  </Grid>
                  {state.securityPolicyType && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Policy Type:</Typography>
                      <Typography variant="body1">{state.securityPolicyType}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="subtitle2" fontWeight="bold">
                Ready to Create
              </Typography>
              <Typography variant="body2">
                Your {state.resourceType} will be created with the configuration above. 
                You can modify advanced settings after creation through the management interface.
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Creation Failed
                </Typography>
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "600px" }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">Resource Creation Wizard</Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={state.activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                optional={
                  index === 2 ? (
                    <Typography variant="caption">Last step</Typography>
                  ) : null
                }
              >
                {label}
              </StepLabel>
              <StepContent>
                {renderStepContent(index)}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleCreate : handleNext}
                    disabled={!canProceed || isCreating}
                    sx={{ mr: 1 }}
                  >
                    {index === steps.length - 1 ? 
                      (isCreating ? "Creating..." : "Create Resource") : 
                      "Continue"
                    }
                  </Button>
                  <Button
                    disabled={index === 0 || isCreating}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};