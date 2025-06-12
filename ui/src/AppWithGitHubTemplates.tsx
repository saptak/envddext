import React from "react";
import {
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardActions,
  Grid,
  Snackbar,
  Alert,
  Tab,
  Tabs,
} from "@mui/material";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  listEnvoyGateways,
  listEnvoyHTTPRoutes,
  checkEnvoyGatewayCRDs,
  installEnvoyGateway,
} from "./helper/kubernetes";
import {
  fetchTemplatesMetadata,
  loadTemplate,
  applyTemplateFromUrl,
  Template,
  TemplateMetadata,
  checkDeploymentStatus,
} from "./services/githubTemplateService";
import { DeploymentStatusMonitor } from "./components/DeploymentStatusMonitor";
import { GatewayManagement } from "./components/GatewayManagement";
import { HTTPRouteManagement } from "./components/HTTPRouteManagement";
import { HTTPClient } from "./components/HTTPClient";
import { ProxyManager } from "./components/ProxyManager";
import { ResourceCard } from "./components/ResourceCard";
import { ResourceActionDialog } from "./components/ResourceActionDialog";
import { ResourceVisualization } from "./components/ResourceVisualization";
import { extractGatewayCardData, extractHTTPRouteCardData } from "./utils/resourceCardHelpers";
import { CertificateManager } from "./components/CertificateManager";

const ddClient = createDockerDesktopClient();

export function App() {
  // State for Envoy Gateway resources
  const [gateways, setGateways] = React.useState<any[]>([]);
  const [routes, setRoutes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEnvoyGatewayInstalled, setIsEnvoyGatewayInstalled] =
    React.useState<boolean>(false);
  const [isInstalling, setIsInstalling] = React.useState<boolean>(false);
  const [installationError, setInstallationError] = React.useState<
    string | null
  >(null);
  const [quickStartDialogOpen, setQuickStartDialogOpen] =
    React.useState<boolean>(false);

  // Template related state
  const [templates, setTemplates] = React.useState<TemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<Template | null>(null);
  const [templateYaml, setTemplateYaml] = React.useState<string>("");
  const [isApplyingTemplate, setIsApplyingTemplate] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [templateSuccess, setTemplateSuccess] = React.useState<boolean>(false);
  const [isLoadingTemplates, setIsLoadingTemplates] =
    React.useState<boolean>(false);

  // Add new state variables
  const [deploymentStatus, setDeploymentStatus] = React.useState<{
    status: "pending" | "ready" | "failed";
    message?: string;
  } | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] =
    React.useState<NodeJS.Timeout | null>(null);

  // Add tab state and deployed services tracking
  const [currentTab, setCurrentTab] = React.useState<number>(0);
  const [deployedServices, setDeployedServices] = React.useState<
    {
      namespace: string;
      deploymentName: string;
      serviceName: string;
    }[]
  >([
    // Default echo service from basic-http template
    {
      namespace: "demo",
      deploymentName: "echo-service",
      serviceName: "echo-service",
    },
  ]);

  // Resource action dialog state
  const [actionDialog, setActionDialog] = React.useState<{
    open: boolean;
    action: "delete" | "viewYaml";
    resourceType: "Gateway" | "HTTPRoute";
    resourceName: string;
    resourceNamespace: string;
  }>({
    open: false,
    action: "delete",
    resourceType: "Gateway",
    resourceName: "",
    resourceNamespace: "",
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const installed = await checkEnvoyGatewayCRDs(ddClient);
    setIsEnvoyGatewayInstalled(installed);

    if (installed) {
      try {
        const gwResult = await listEnvoyGateways(ddClient);
        const rtResult = await listEnvoyHTTPRoutes(ddClient);
        if (gwResult.error) {
          console.error("Gateway error:", gwResult.error);
          setError(gwResult.error);
        }
        if (rtResult.error) {
          console.error("Route error:", rtResult.error);
          setError(rtResult.error);
        }
        setGateways(gwResult.items || []);
        setRoutes(rtResult.items || []);
      } catch (e: any) {
        console.error("Caught error:", e);
        setError(typeof e === "string" ? e : JSON.stringify(e, null, 2));
      }
    }
    setLoading(false);
  }, [ddClient]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    setInstallationError(null);
    setError(null); // Clear general error when starting installation
    try {
      // TODO: Allow user to specify version?
      const result = await installEnvoyGateway(ddClient, "latest"); // Using latest version
      if (result.error) {
        console.error("Installation error:", result.error);
        setInstallationError(result.error);
      } else {
        // Installation successful, re-check CRDs and fetch data
        await fetchData();
      }
    } catch (e: any) {
      console.error("Caught installation error:", e);
      setInstallationError(
        typeof e === "string" ? e : JSON.stringify(e, null, 2),
      );
    }
    setIsInstalling(false);
  };

  const handleQuickStartOpen = async () => {
    setIsLoadingTemplates(true);
    setTemplateError(null);
    setTemplateSuccess(false);
    setQuickStartDialogOpen(true);

    try {
      // Fetch templates metadata from GitHub
      const templatesMetadata = await fetchTemplatesMetadata();
      setTemplates(templatesMetadata);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      setTemplateError(
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
      );
    } finally {
      setIsLoadingTemplates(false);
    }

    setSelectedTemplate(null);
    setTemplateYaml("");
  };

  const handleQuickStartClose = () => {
    setQuickStartDialogOpen(false);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleTemplateSelect = async (templateId: string) => {
    setTemplateError(null);
    setTemplateSuccess(false);
    setIsLoadingTemplates(true);

    try {
      const template = await loadTemplate(templateId);
      setSelectedTemplate(template);

      if (template) {
        // Set the YAML content
        setTemplateYaml(template.yamlContent);
      } else {
        setTemplateError(`Failed to load template: ${templateId}`);
      }
    } catch (e: any) {
      console.error("Error loading template:", e);
      setTemplateError(typeof e === "string" ? e : JSON.stringify(e, null, 2));
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Add status checking function
  const checkTemplateDeploymentStatus = async () => {
    if (!selectedTemplate) return;

    try {
      const status = await checkDeploymentStatus(ddClient, selectedTemplate);
      setDeploymentStatus(status);

      if (status.status === "ready" || status.status === "failed") {
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
      }
    } catch (error) {
      console.error("Error checking deployment status:", error);
      setDeploymentStatus({
        status: "failed",
        message: "Failed to check deployment status",
      });
    }
  };

  // Update handleApplyTemplate
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    setIsApplyingTemplate(true);
    setTemplateError(null);
    setTemplateSuccess(false);
    setDeploymentStatus(null);

    try {
      // Apply the template using the GitHub template service
      const result = await applyTemplateFromUrl(
        ddClient,
        selectedTemplate.metadata.yamlUrl,
      );

      if (result.success) {
        setTemplateSuccess(true);
        // Start checking deployment status
        const interval = setInterval(checkTemplateDeploymentStatus, 2000);
        setStatusCheckInterval(interval);
        // Initial check
        await checkTemplateDeploymentStatus();

        // Refresh the UI with the latest gateways and routes
        await fetchData();

        // Track deployed services based on template ID
        if (selectedTemplate.metadata.id === "basic-http-echo") {
          // Check if service is already tracked
          const exists = deployedServices.some(
            (service) =>
              service.namespace === "demo" &&
              service.deploymentName === "echo-service",
          );

          if (!exists) {
            setDeployedServices((prev) => [
              ...prev,
              {
                namespace: "demo",
                deploymentName: "echo-service",
                serviceName: "echo-service",
              },
            ]);
          }

          // Switch to the Deployment Status tab
          setCurrentTab(2);
        }
      } else {
        setTemplateError(result.error || "Failed to apply template");
      }
    } catch (error: any) {
      setTemplateError(
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
      );
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Add function to apply template directly from URL
  const handleApplyTemplateFromUrl = async (url: string) => {
    setIsApplyingTemplate(true);
    setTemplateError(null);
    setTemplateSuccess(false);
    setDeploymentStatus(null);

    try {
      // Apply the template directly from the URL
      const result = await applyTemplateFromUrl(ddClient, url);

      if (result.success) {
        setTemplateSuccess(true);
        // Start checking deployment status
        const interval = setInterval(checkTemplateDeploymentStatus, 2000);
        setStatusCheckInterval(interval);
        // Initial check
        await checkTemplateDeploymentStatus();

        // Refresh the UI with the latest gateways and routes
        await fetchData();

        // Track deployed services based on URL
        // Check if it's a basic-http template
        if (url.includes("basic-http") || url.includes("echo-service")) {
          // Check if service is already tracked
          const exists = deployedServices.some(
            (service) =>
              service.namespace === "demo" &&
              service.deploymentName === "echo-service",
          );

          if (!exists) {
            setDeployedServices((prev) => [
              ...prev,
              {
                namespace: "demo",
                deploymentName: "echo-service",
                serviceName: "echo-service",
              },
            ]);
          }

          // Switch to the Deployment Status tab
          setCurrentTab(2);
        }
      } else {
        setTemplateError(result.error || "Failed to apply template from URL");
      }
    } catch (error: any) {
      setTemplateError(
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
      );
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Dialog helper functions
  const openActionDialog = (
    action: "delete" | "viewYaml",
    resourceType: "Gateway" | "HTTPRoute",
    resourceName: string,
    resourceNamespace: string,
  ) => {
    setActionDialog({
      open: true,
      action,
      resourceType,
      resourceName,
      resourceNamespace,
    });
  };

  const closeActionDialog = () => {
    setActionDialog(prev => ({ ...prev, open: false }));
  };

  const handleActionSuccess = () => {
    // Refresh data after successful action
    fetchData();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Envoy Gateway
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage and observe Envoy Gateway resources in your local Kubernetes
        cluster using Docker Desktop.
      </Typography>

      {/* Backend Status and Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1">
          Backend Status: <b>{error || installationError ? "error" : "ok"}</b>
        </Typography>
        <Typography variant="subtitle1">
          Kubernetes: <b>{loading || isInstalling ? "Loading..." : "Ready"}</b>
        </Typography>
        <Typography variant="subtitle1">
          Gateways: <b>{gateways.length}</b>
        </Typography>
        <Typography variant="subtitle1">
          Routes: <b>{routes.length}</b>
        </Typography>
      </Paper>

      {loading || isInstalling ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
          {isInstalling && (
            <Typography variant="body1" sx={{ ml: 2 }}>
              Installing Envoy Gateway...
            </Typography>
          )}
        </Box>
      ) : error || installationError ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography color="error" sx={{ whiteSpace: "pre-wrap" }}>
            Error:{" "}
            {typeof (error || installationError) === "string"
              ? error || installationError
              : JSON.stringify(error || installationError, null, 2)}
          </Typography>
        </Paper>
      ) : !isEnvoyGatewayInstalled ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Envoy Gateway Not Installed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Envoy Gateway Custom Resource Definitions (CRDs) were not found in
            your Kubernetes cluster. Please install Envoy Gateway to use this
            extension.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInstallClick}
            disabled={isInstalling}
            sx={(theme) =>
              theme.palette.mode === "light"
                ? {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: `1px solid ${theme.palette.primary.dark}`,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }
                : {}
            }
          >
            {isInstalling ? "Installing..." : "Install Envoy Gateway"}
          </Button>
          {installationError && (
            <Typography color="error" sx={{ whiteSpace: "pre-wrap", mt: 2 }}>
              Installation Error:{" "}
              {typeof installationError === "string"
                ? installationError
                : JSON.stringify(installationError, null, 2)}
            </Typography>
          )}
        </Paper>
      ) : (
        <>
          {/* Main Content */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleQuickStartOpen}
                sx={(theme) =>
                  theme.palette.mode === "light"
                    ? {
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        border: `1px solid ${theme.palette.primary.dark}`,
                        "&:hover": {
                          bgcolor: theme.palette.primary.dark,
                        },
                      }
                    : {}
                }
              >
                Quick Start
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Resources"}
              </Button>
            </Box>
          </Box>

          {/* Tabs for different views */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="envoy gateway tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label="Resources" id="tab-0" aria-controls="tabpanel-0" />
              <Tab
                label="Gateway Management"
                id="tab-1"
                aria-controls="tabpanel-1"
              />
              <Tab
                label="HTTPRoute Management"
                id="tab-2"
                aria-controls="tabpanel-2"
              />
              <Tab
                label="Deployment Status"
                id="tab-3"
                aria-controls="tabpanel-3"
              />
              <Tab label="Testing & Proxy" id="tab-4" aria-controls="tabpanel-4" />
              <Tab label="TLS Management" id="tab-5" aria-controls="tabpanel-5" />
            </Tabs>
          </Box>

          {/* Resources Tab */}
          <Box
            role="tabpanel"
            hidden={currentTab !== 0}
            id="tabpanel-0"
            aria-labelledby="tab-0"
          >
            {currentTab === 0 && (
              <>
                {/* Gateways Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Gateways ({gateways.length})
                  </Typography>
                  {gateways.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No gateways found. Create your first gateway in the Gateway Management tab.
                      </Typography>
                    </Paper>
                  ) : (
                    <Box>
                      {gateways.map((gw: any) => {
                        const cardData = extractGatewayCardData(gw);
                        return (
                          <ResourceCard
                            key={gw.metadata.uid}
                            {...cardData}
                            onRefresh={() => fetchData()}
                            onViewYaml={() => openActionDialog('viewYaml', 'Gateway', gw.metadata.name, gw.metadata.namespace)}
                            onDelete={() => openActionDialog('delete', 'Gateway', gw.metadata.name, gw.metadata.namespace)}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* HTTPRoutes Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    HTTP Routes ({routes.length})
                  </Typography>
                  {routes.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No HTTP routes found. Create your first route in the HTTPRoute Management tab.
                      </Typography>
                    </Paper>
                  ) : (
                    <Box>
                      {routes.map((rt: any) => {
                        const cardData = extractHTTPRouteCardData(rt);
                        return (
                          <ResourceCard
                            key={rt.metadata.uid}
                            {...cardData}
                            onRefresh={() => fetchData()}
                            onViewYaml={() => openActionDialog('viewYaml', 'HTTPRoute', rt.metadata.name, rt.metadata.namespace)}
                            onDelete={() => openActionDialog('delete', 'HTTPRoute', rt.metadata.name, rt.metadata.namespace)}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* Resource Visualization Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Visualization
                  </Typography>
                  <ResourceVisualization
                    gateways={gateways}
                    httpRoutes={routes}
                    onResourceClick={(type, name, namespace) => {
                      // Open view YAML dialog when clicking on a resource in visualization
                      openActionDialog('viewYaml', type, name, namespace);
                    }}
                  />
                </Box>
              </>
            )}
          </Box>

          {/* Gateway Management Tab */}
          <Box
            role="tabpanel"
            hidden={currentTab !== 1}
            id="tabpanel-1"
            aria-labelledby="tab-1"
          >
            {currentTab === 1 && (
              <GatewayManagement
                onGatewayCreated={(gateway) => {
                  // Refresh the gateways list when a new gateway is created
                  fetchData();
                }}
              />
            )}
          </Box>

          {/* HTTPRoute Management Tab */}
          <Box
            role="tabpanel"
            hidden={currentTab !== 2}
            id="tabpanel-2"
            aria-labelledby="tab-2"
          >
            {currentTab === 2 && (
              <HTTPRouteManagement
                onHTTPRouteCreated={(_httpRoute) => {
                  // Refresh the routes list when a new HTTPRoute is created
                  fetchData();
                }}
              />
            )}
          </Box>

          {/* Deployment Status Tab */}
          <Box
            role="tabpanel"
            hidden={currentTab !== 3}
            id="tabpanel-3"
            aria-labelledby="tab-3"
          >
            {currentTab === 3 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Deployment Status
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Monitor the status of your deployed services. This view
                  provides detailed information about pods, containers, and
                  troubleshooting guidance.
                </Typography>

                {deployedServices.map((service, index) => (
                  <DeploymentStatusMonitor
                    key={index}
                    ddClient={ddClient}
                    namespace={service.namespace}
                    deploymentName={service.deploymentName}
                    serviceName={service.serviceName}
                    autoRefresh={true}
                    refreshInterval={5000}
                  />
                ))}

                {deployedServices.length === 0 && (
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      No deployments found. Apply a template to create
                      deployments.
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </Box>

          {/* Testing & Proxy Tab */}
          <Box
            role="tabpanel"
            hidden={currentTab !== 4}
            id="tabpanel-4"
            aria-labelledby="tab-4"
          >
            {currentTab === 4 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Testing & Proxy
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Test your deployed Envoy Gateway services and manage kubectl proxy connections.
                  Use these tools to verify your routes and gateways are working correctly.
                </Typography>
                
                {/* Proxy Manager Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Proxy Manager
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Manage kubectl proxy connections to access Kubernetes services
                    directly. Enable proxy to test internal services and APIs.
                  </Typography>
                  <ProxyManager />
                </Box>

                {/* HTTP Testing Section */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    HTTP Testing
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Test your deployed Envoy Gateway services with HTTP requests.
                    Use this tool to verify your routes and gateways are working
                    correctly.
                  </Typography>
                  <HTTPClient />
                </Box>
              </>
            )}
          </Box>

          {/* TLS Management Tab */}
          <Box
            role="tabpanel"
            hidden={currentTab !== 5}
            id="tabpanel-5"
            aria-labelledby="tab-5"
          >
            {currentTab === 5 && (
              <>
                <Typography variant="h6" gutterBottom>
                  TLS Certificate Management
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Generate and manage TLS certificates for secure HTTPS connections.
                  Create self-signed certificates for testing or manage existing certificates.
                </Typography>
                
                <CertificateManager onCertificateCreated={() => {
                  // Refresh data when a certificate is created
                  fetchData();
                }} />
              </>
            )}
          </Box>
        </>
      )}

      {/* Quick Start Dialog */}
      <Dialog
        open={quickStartDialogOpen}
        onClose={handleQuickStartClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🚀 Envoy Gateway Quick Start</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Welcome to the Envoy Gateway Quick Start! This wizard will help you
            get started with common Envoy Gateway use cases. Choose one of the
            examples below to deploy a complete working configuration to your
            Kubernetes cluster.
          </DialogContentText>

          {isLoadingTemplates && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading templates...
              </Typography>
            </Box>
          )}

          {templateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Error:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {templateError}
              </Typography>
              {templateError.includes("Gateway API CRDs are not installed") && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Troubleshooting:</Typography>
                  <Typography variant="body2">
                    1. Make sure Envoy Gateway is installed by clicking the
                    "Install Envoy Gateway" button on the main page.
                  </Typography>
                  <Typography variant="body2">
                    2. If the issue persists, try restarting Docker Desktop and
                    Kubernetes.
                  </Typography>
                </Box>
              )}
              {templateError.includes("Failed to create GatewayClass") && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Troubleshooting:</Typography>
                  <Typography variant="body2">
                    1. Check if Kubernetes is running properly.
                  </Typography>
                  <Typography variant="body2">
                    2. Verify that Envoy Gateway is installed correctly.
                  </Typography>
                </Box>
              )}
            </Alert>
          )}

          {templateSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Template applied successfully!
            </Alert>
          )}

          {!selectedTemplate ? (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Available Examples:
              </Typography>
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} md={6} key={template.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1 }}
                        >
                          Difficulty: {template.difficulty}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleTemplateSelect(template.id)}
                          sx={
                            (theme) =>
                              theme.palette.mode === "light"
                                ? {
                                    // Ensure it looks like a contained button for better visibility
                                    bgcolor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                    border: `1px solid ${theme.palette.primary.dark}`, // Add a border for definition
                                    "&:hover": {
                                      bgcolor: theme.palette.primary.dark,
                                    },
                                  }
                                : {} // Apply no specific sx overrides for dark mode, rely on theme defaults
                          }
                        >
                          Select
                        </Button>
                        <Button
                          size="small"
                          color="secondary"
                          onClick={() =>
                            handleApplyTemplateFromUrl(template.yamlUrl)
                          }
                          sx={
                            (theme) =>
                              theme.palette.mode === "light"
                                ? {
                                    // Ensure it looks like an outlined button for better visibility
                                    borderColor: theme.palette.secondary.main,
                                    color: theme.palette.secondary.main,
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                    "&:hover": {
                                      // Standard hover for outlined secondary button
                                      backgroundColor:
                                        theme.palette.action.hover, // Or alpha(theme.palette.secondary.main, theme.palette.action.hoverOpacity) if alpha is imported
                                    },
                                  }
                                : {} // Apply no specific sx overrides for dark mode, rely on theme defaults
                          }
                        >
                          Apply Directly
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  {selectedTemplate.metadata.name}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedTemplate(null);
                    if (statusCheckInterval) {
                      clearInterval(statusCheckInterval);
                      setStatusCheckInterval(null);
                    }
                    setDeploymentStatus(null);
                  }}
                >
                  Back to Templates
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedTemplate.metadata.description}
              </Typography>

              {deploymentStatus && (
                <Alert
                  severity={
                    deploymentStatus.status === "ready"
                      ? "success"
                      : deploymentStatus.status === "failed"
                        ? "error"
                        : "info"
                  }
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {deploymentStatus.status === "ready"
                      ? "Deployment Status: Ready"
                      : deploymentStatus.status === "failed"
                        ? "Deployment Status: Failed"
                        : "Deployment Status: In Progress"}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {deploymentStatus.message}
                  </Typography>
                </Alert>
              )}

              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Template YAML:
              </Typography>

              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  mb: 2,
                  maxHeight: "300px",
                  overflow: "auto",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                }}
              >
                <Box
                  component="pre"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    p: 2,
                    m: 0,
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {templateYaml}
                </Box>
              </Paper>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApplyTemplate}
                  disabled={isApplyingTemplate}
                  sx={(theme) => ({
                    mt: 2,
                    ...(theme.palette.mode === "light"
                      ? {
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          border: `1px solid ${theme.palette.primary.dark}`,
                          "&:hover": {
                            bgcolor: theme.palette.primary.dark,
                          },
                        }
                      : {}),
                  })}
                >
                  {isApplyingTemplate ? "Applying..." : "Apply Template"}
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() =>
                    handleApplyTemplateFromUrl(
                      selectedTemplate.metadata.yamlUrl,
                    )
                  }
                  disabled={isApplyingTemplate}
                  sx={{ mt: 2 }}
                >
                  Apply Directly from GitHub
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleQuickStartClose}
            color="primary"
            sx={(theme) =>
              theme.palette.mode === "light"
                ? {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: `1px solid ${theme.palette.primary.dark}`,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }
                : {}
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={templateSuccess}
        autoHideDuration={6000}
        onClose={() => setTemplateSuccess(false)}
      >
        <Alert onClose={() => setTemplateSuccess(false)} severity="success">
          Template applied successfully!
        </Alert>
      </Snackbar>

      {/* Resource Action Dialog */}
      <ResourceActionDialog
        open={actionDialog.open}
        onClose={closeActionDialog}
        action={actionDialog.action}
        resourceType={actionDialog.resourceType}
        resourceName={actionDialog.resourceName}
        resourceNamespace={actionDialog.resourceNamespace}
        onSuccess={handleActionSuccess}
      />
    </Box>
  );
}
