import React from "react";
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Security as SecurityIcon,
  VpnKey as AuthIcon,
  Public as CorsIcon,
  Block as IPFilterIcon,
  VerifiedUser as MTLSIcon,
  Speed as RateLimitIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from "@mui/icons-material";
import { ContextualHelp } from "./ContextualHelp";
import { BasicAuthManager } from "./security/BasicAuthManager";
import { CorsManager } from "./security/CorsManager";
import { IPFilterManager } from "./security/IPFilterManager";
import { MTLSManager } from "./security/MTLSManager";
import { RateLimitManager } from "./security/RateLimitManager";
import { ResourceCreationWizard } from "./ResourceCreationWizard";

interface SecurityPolicyManagerProps {
  onPolicyCreated?: () => void;
}

export const SecurityPolicyManager: React.FC<SecurityPolicyManagerProps> = ({
  onPolicyCreated
}) => {
  const [currentTab, setCurrentTab] = React.useState<number>(0);
  const [wizardOpen, setWizardOpen] = React.useState<boolean>(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const securityPolicies = [
    {
      id: "basic-auth",
      name: "Basic Authentication",
      description: "Protect routes with username and password authentication",
      icon: <AuthIcon sx={{ color: "#2196f3" }} />,
      difficulty: "Easy",
      useCases: ["API Protection", "Admin Panels", "Testing Environments"]
    },
    {
      id: "cors",
      name: "CORS Policy",
      description: "Configure Cross-Origin Resource Sharing for web applications",
      icon: <CorsIcon sx={{ color: "#4caf50" }} />,
      difficulty: "Medium", 
      useCases: ["Web APIs", "Single Page Apps", "Microservices"]
    },
    {
      id: "ip-filter",
      name: "IP Allow/Deny Lists",
      description: "Restrict access based on client IP addresses or CIDR ranges",
      icon: <IPFilterIcon sx={{ color: "#ff9800" }} />,
      difficulty: "Medium",
      useCases: ["Admin Access", "Geo-blocking", "Corporate Networks"]
    },
    {
      id: "rate-limiting",
      name: "Rate Limiting",
      description: "Control request rates to protect against abuse and overload",
      icon: <RateLimitIcon sx={{ color: "#f44336" }} />,
      difficulty: "Medium",
      useCases: ["API Protection", "DDoS Prevention", "Resource Management"]
    },
    {
      id: "mtls",
      name: "Mutual TLS (mTLS)",
      description: "Require client certificates for enhanced security",
      icon: <MTLSIcon sx={{ color: "#9c27b0" }} />,
      difficulty: "Advanced",
      useCases: ["Service-to-Service", "Zero Trust", "High Security"]
    }
  ];

  const handleCreatePolicy = () => {
    setWizardOpen(true);
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
  };

  const handleWizardComplete = () => {
    setWizardOpen(false);
    if (onPolicyCreated) {
      onPolicyCreated();
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon />
            Security Policy Management
            <ContextualHelp topic="jwt" variant="tooltip" />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure security policies to protect your Envoy Gateway routes with authentication, 
            access control, and encryption.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Create new security policy with guided wizard">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePolicy}
              sx={{ borderRadius: 2 }}
            >
              Create Policy
            </Button>
          </Tooltip>
          <Tooltip title="View security best practices">
            <IconButton color="primary">
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Section */}
      {currentTab === 0 && (
        <Box sx={{ mb: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Security Policy Overview
            </Typography>
            <Typography variant="body2">
              Security policies provide layered protection for your Gateway and HTTPRoute resources. 
              Use multiple policies together for defense-in-depth security.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {securityPolicies.map((policy) => (
              <Grid item xs={12} md={6} key={policy.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: "100%",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: "transparent" }}>
                        {policy.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {policy.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={policy.difficulty}
                          color={
                            policy.difficulty === "Easy" ? "success" :
                            policy.difficulty === "Medium" ? "warning" : "error"
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {policy.description}
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom>
                      Common Use Cases:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {policy.useCases.map((useCase, index) => (
                        <ListItem key={index} sx={{ py: 0, pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Box 
                              sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: "50%", 
                                bgcolor: "primary.main" 
                              }} 
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={useCase} 
                            primaryTypographyProps={{ variant: "body2" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<SettingsIcon />}
                      onClick={() => {
                        const tabIndex = securityPolicies.findIndex(p => p.id === policy.id) + 1;
                        setCurrentTab(tabIndex);
                      }}
                    >
                      Configure
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={handleCreatePolicy}
                    >
                      Quick Setup
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Policy Configuration Tabs */}
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="Overview" />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AuthIcon fontSize="small" />
                  Basic Auth
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CorsIcon fontSize="small" />
                  CORS
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IPFilterIcon fontSize="small" />
                  IP Filtering
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <RateLimitIcon fontSize="small" />
                  Rate Limiting
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MTLSIcon fontSize="small" />
                  mTLS
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {currentTab === 1 && (
            <BasicAuthManager onPolicyCreated={onPolicyCreated} />
          )}
          {currentTab === 2 && (
            <CorsManager onPolicyCreated={onPolicyCreated} />
          )}
          {currentTab === 3 && (
            <IPFilterManager onPolicyCreated={onPolicyCreated} />
          )}
          {currentTab === 4 && (
            <RateLimitManager onPolicyCreated={onPolicyCreated} />
          )}
          {currentTab === 5 && (
            <MTLSManager onPolicyCreated={onPolicyCreated} />
          )}
        </Box>
      </Paper>

      {/* Resource Creation Wizard Dialog */}
      <ResourceCreationWizard
        open={wizardOpen}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
      />
    </Box>
  );
};