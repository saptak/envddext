import React, { useMemo, useCallback, memo } from "react";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Tab,
  Tabs,
  Chip,
  Stack,
} from "@mui/material";
import {
  Architecture as InfrastructureIcon,
  Security as SecurityIcon,
  Traffic as TrafficIcon,
  // Monitor as MonitoringIcon, // Commented out until Operations tab implemented
  RocketLaunch as RocketLaunchIcon,
} from "@mui/icons-material";
import { ApiCallManager } from "./utils/performanceUtils";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  listEnvoyGateways,
  listEnvoyHTTPRoutes,
  checkEnvoyGatewayCRDs,
  installEnvoyGateway,
} from "./helper/kubernetes";

// Import existing components
import { GatewayManagement } from "./components/GatewayManagement";
import { HTTPRouteManagement } from "./components/HTTPRouteManagement";
import { HTTPClient } from "./components/HTTPClient";
import { ProxyManager } from "./components/ProxyManager";
import { ResourceActionDialog } from "./components/ResourceActionDialog";
import { CertificateManager } from "./components/CertificateManager";
import { TrafficSplittingManager } from "./components/TrafficSplittingManager";
import { TrafficGenerator } from "./components/TrafficGenerator";
import { RateLimitTester } from "./components/RateLimitTester";
import { Dashboard } from "./components/Dashboard";
import { SecurityPolicyManager } from "./components/SecurityPolicyManager";
import { TemplateGallery } from "./components/TemplateGallery";
import ResiliencePolicyManager from "./components/ResiliencePolicyManager";
import { TutorialManager, TutorialLauncher } from "./components/InteractiveTutorial";
import { EnvoyLogo } from "./components/EnvoyLogo";

const ddClient = createDockerDesktopClient();

// New Tab Structure Constants
const TAB_IDS = {
  QUICK_START: 0,
  INFRASTRUCTURE: 1,
  SECURITY_POLICIES: 2,
  TRAFFIC_TESTING: 3,
  // OPERATIONS: 4, // Commented out until implemented
} as const;

const SUB_TAB_IDS = {
  // Quick Start sub-tabs
  OVERVIEW: 0,
  TEMPLATES: 1,
  // SETUP_WIZARD: 2, // Commented out until implemented
  
  // Infrastructure sub-tabs
  GATEWAYS: 0,
  ROUTES: 1,
  TLS_CERTS: 2,
  
  // Security & Policies sub-tabs
  SECURITY_POLICIES: 0,
  RESILIENCE_POLICIES: 1,
  
  // Traffic & Testing sub-tabs
  TRAFFIC_SPLITTING: 0,
  HTTP_TESTING: 1,
  PERFORMANCE_TESTING: 2,
  
  // Operations sub-tabs (commented out until implemented)
  // MONITORING: 0,
  // TROUBLESHOOTING: 1,
} as const;

// Enhanced Tab Component with Icons and Descriptions
const EnhancedTab = memo(({ 
  icon, 
  label, 
  description, 
  count, 
  ...tabProps 
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  count?: number;
} & Parameters<typeof Tab>[0]) => (
  <Tab
    {...tabProps}
    label={
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textAlign: 'left' }}>
        {icon}
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {label}
            {count !== undefined && (
              <Chip 
                size="small" 
                label={count} 
                sx={{ ml: 1, height: 16, fontSize: '0.75rem' }}
              />
            )}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" display="block">
              {description}
            </Typography>
          )}
        </Box>
      </Box>
    }
    sx={{ 
      minHeight: 72,
      textTransform: 'none',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    }}
  />
));

// Quick Start Tab Component
const QuickStartTab = memo(({ 
  currentSubTab, 
  onSubTabChange, 
  gateways, 
  routes, 
  deployedServices, 
  loading, 
  onRefresh, 
  onResourceAction, 
  ddClient,
  onTemplateApply,
}: {
  currentSubTab: number;
  onSubTabChange: (value: number) => void;
  gateways: any[];
  routes: any[];
  deployedServices: any[];
  loading: boolean;
  onRefresh: () => void;
  onResourceAction: (action: "delete" | "viewYaml", resourceType: "Gateway" | "HTTPRoute", resourceName: string, resourceNamespace: string) => void;
  ddClient: any;
  onTemplateApply: () => void;
}) => (
  <Box>
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentSubTab} 
        onChange={(_, value) => onSubTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Overview" />
        <Tab label="Template Gallery" />
        {/* <Tab label="Setup Wizard" /> Commented out until implemented */}
      </Tabs>
    </Box>

    {currentSubTab === SUB_TAB_IDS.OVERVIEW && (
      <Dashboard
        gateways={gateways}
        routes={routes}
        deployedServices={deployedServices}
        loading={loading}
        onRefresh={onRefresh}
        onResourceAction={onResourceAction}
        ddClient={ddClient}
      />
    )}

    {currentSubTab === SUB_TAB_IDS.TEMPLATES && (
      <TemplateGallery onTemplateApply={onTemplateApply} />
    )}

    {/* Setup Wizard commented out until implemented
    {currentSubTab === SUB_TAB_IDS.SETUP_WIZARD && (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Interactive Setup Wizard
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Coming soon: Step-by-step guided setup for common Envoy Gateway configurations.
        </Typography>
        <Button variant="outlined" disabled>
          Launch Setup Wizard
        </Button>
      </Paper>
    )}
    */}
  </Box>
));

// Infrastructure Tab Component
const InfrastructureTab = memo(({ 
  currentSubTab, 
  onSubTabChange, 
  onResourceAction,
}: {
  currentSubTab: number;
  onSubTabChange: (value: number) => void;
  onResourceAction: () => void;
}) => (
  <Box>
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentSubTab} 
        onChange={(_, value) => onSubTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Gateways" />
        <Tab label="HTTP Routes" />
        <Tab label="TLS Certificates" />
      </Tabs>
    </Box>

    {currentSubTab === SUB_TAB_IDS.GATEWAYS && (
      <GatewayManagement onGatewayCreated={onResourceAction} />
    )}

    {currentSubTab === SUB_TAB_IDS.ROUTES && (
      <HTTPRouteManagement onHTTPRouteCreated={onResourceAction} />
    )}

    {currentSubTab === SUB_TAB_IDS.TLS_CERTS && (
      <CertificateManager onCertificateCreated={onResourceAction} />
    )}
  </Box>
));

// Security & Policies Tab Component
const SecurityPoliciesTab = memo(({ 
  currentSubTab, 
  onSubTabChange, 
  onPolicyCreated,
}: {
  currentSubTab: number;
  onSubTabChange: (value: number) => void;
  onPolicyCreated: () => void;
}) => (
  <Box>
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentSubTab} 
        onChange={(_, value) => onSubTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Security Policies" />
        <Tab label="Resilience Policies" />
      </Tabs>
    </Box>

    {currentSubTab === SUB_TAB_IDS.SECURITY_POLICIES && (
      <SecurityPolicyManager onPolicyCreated={onPolicyCreated} />
    )}

    {currentSubTab === SUB_TAB_IDS.RESILIENCE_POLICIES && (
      <ResiliencePolicyManager />
    )}
  </Box>
));

// Traffic & Testing Tab Component
const TrafficTestingTab = memo(({ 
  currentSubTab, 
  onSubTabChange,
  proxyUrl,
  onProxyUrlChange,
}: {
  currentSubTab: number;
  onSubTabChange: (value: number) => void;
  proxyUrl: string;
  onProxyUrlChange: (url: string) => void;
}) => (
  <Box>
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentSubTab} 
        onChange={(_, value) => onSubTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Traffic Splitting" />
        <Tab label="HTTP Testing" />
        <Tab label="Performance Testing" />
      </Tabs>
    </Box>

    {currentSubTab === SUB_TAB_IDS.TRAFFIC_SPLITTING && (
      <TrafficSplittingManager />
    )}

    {currentSubTab === SUB_TAB_IDS.HTTP_TESTING && (
      <Box>
        {/* Proxy Manager Section */}
        <Box sx={{ mb: 4 }}>
          <ProxyManager onUrlGenerated={onProxyUrlChange} />
        </Box>

        {/* HTTP Testing Section */}
        <Box sx={{ mb: 4 }}>
          <HTTPClient proxyUrl={proxyUrl} />
        </Box>

        {/* Rate Limit Testing Section */}
        <Box>
          <RateLimitTester onTestComplete={(summary) => {
            console.log("Rate limit test completed:", summary);
          }} />
        </Box>
      </Box>
    )}

    {currentSubTab === SUB_TAB_IDS.PERFORMANCE_TESTING && (
      <TrafficGenerator />
    )}
  </Box>
));

// Operations Tab Component (commented out until implemented)
/*
const OperationsTab = memo(({ 
  currentSubTab, 
  onSubTabChange,
}: {
  currentSubTab: number;
  onSubTabChange: (value: number) => void;
}) => (
  <Box>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MonitoringIcon color="primary" />
        Operations
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Monitor system health, troubleshoot issues, and maintain your gateway
      </Typography>
    </Box>

    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentSubTab} 
        onChange={(_, value) => onSubTabChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Monitoring" />
        <Tab label="Troubleshooting" />
      </Tabs>
    </Box>

    {currentSubTab === SUB_TAB_IDS.MONITORING && (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Coming soon: Real-time metrics, health checks, and performance monitoring.
        </Typography>
        <Button variant="outlined" disabled>
          View Metrics Dashboard
        </Button>
      </Paper>
    )}

    {currentSubTab === SUB_TAB_IDS.TROUBLESHOOTING && (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Tools
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Coming soon: Diagnostic tools, log analysis, and automated issue detection.
        </Typography>
        <Button variant="outlined" disabled>
          Run Diagnostics
        </Button>
      </Paper>
    )}
  </Box>
));
*/

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

  // Updated tab state - now includes sub-tabs
  const [currentTab, setCurrentTab] = React.useState<number>(TAB_IDS.QUICK_START);
  const [currentSubTabs, setCurrentSubTabs] = React.useState<Record<number, number>>({
    [TAB_IDS.QUICK_START]: SUB_TAB_IDS.OVERVIEW,
    [TAB_IDS.INFRASTRUCTURE]: SUB_TAB_IDS.GATEWAYS,
    [TAB_IDS.SECURITY_POLICIES]: SUB_TAB_IDS.SECURITY_POLICIES,
    [TAB_IDS.TRAFFIC_TESTING]: SUB_TAB_IDS.TRAFFIC_SPLITTING,
    // [TAB_IDS.OPERATIONS]: SUB_TAB_IDS.MONITORING, // Commented out until implemented
  });

  const [deployedServices, setDeployedServices] = React.useState<
    {
      namespace: string;
      deploymentName: string;
      serviceName: string;
    }[]
  >([]);

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

  // Tutorial state
  const [tutorialDialogOpen, setTutorialDialogOpen] = React.useState<boolean>(false);
  const [selectedTutorialId, setSelectedTutorialId] = React.useState<string | undefined>(undefined);

  // Proxy URL state for connecting ProxyManager to HTTPClient
  const [proxyUrl, setProxyUrl] = React.useState<string>('');

  // Function to discover deployments in demo namespace
  const discoverDeployments = useCallback(async () => {
    try {
      const result = await ddClient?.extension?.host?.cli?.exec('kubectl', [
        'get', 'deployments', '-n', 'demo', '--no-headers', 
        '-o', 'custom-columns=NAME:.metadata.name,READY:.status.readyReplicas,DESIRED:.status.replicas'
      ]);
      
      if (result?.stdout) {
        const deployments = result.stdout.trim().split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => {
            const [name] = line.trim().split(/\s+/);
            return {
              namespace: 'demo',
              deploymentName: name,
              serviceName: name // Assume service name matches deployment name for demo apps
            };
          });
        
        setDeployedServices(deployments);
      } else {
        setDeployedServices([]);
      }
    } catch (error) {
      console.log('No deployments found in demo namespace or namespace does not exist');
      setDeployedServices([]);
    }
  }, [ddClient]);

  // Optimized fetchData with caching and error handling
  const apiManager = useMemo(() => ApiCallManager.getInstance(), []);
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use cached API calls for better performance
      const installed = await apiManager.call(
        'envoy-gateway-crds', 
        () => checkEnvoyGatewayCRDs(ddClient),
        forceRefresh
      );
      setIsEnvoyGatewayInstalled(installed);

      if (installed) {
        // Parallel API calls for better performance, including deployment discovery
        const [gwResult, rtResult] = await Promise.all([
          apiManager.call('envoy-gateways', () => listEnvoyGateways(ddClient), forceRefresh),
          apiManager.call('envoy-routes', () => listEnvoyHTTPRoutes(ddClient), forceRefresh),
          discoverDeployments()
        ]);
        
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
      }
    } catch (e: any) {
      console.error("Caught error:", e);
      setError(typeof e === "string" ? e : JSON.stringify(e, null, 2));
    } finally {
      setLoading(false);
    }
  }, [ddClient, apiManager, discoverDeployments]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    setInstallationError(null);
    setError(null);
    try {
      const result = await installEnvoyGateway(ddClient, "latest");
      if (result.error) {
        console.error("Installation error:", result.error);
        setInstallationError(result.error);
      } else {
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

  // Enhanced tab change handlers
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    // Clear cache for the new tab to ensure fresh data
    apiManager.clearCache();
  }, [apiManager]);

  const handleSubTabChange = useCallback((tabId: number, subTabValue: number) => {
    setCurrentSubTabs(prev => ({
      ...prev,
      [tabId]: subTabValue
    }));
  }, []);

  // Memoized dialog helper functions for better performance
  const openActionDialog = useCallback((
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
  }, []);

  const closeActionDialog = useCallback(() => {
    setActionDialog(prev => ({ ...prev, open: false }));
  }, []);

  const handleActionSuccess = useCallback(() => {
    // Refresh data after successful action with cache invalidation
    apiManager.invalidatePattern(/^(envoy-gateways|envoy-routes|envoy-gateway-crds)$/);
    fetchData(true);
  }, [apiManager, fetchData]);


  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <EnvoyLogo width={48} height={48} />
        <Typography variant="h3" gutterBottom sx={{ mb: 0, fontWeight: 500 }}>
          Envoy Gateway
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage and observe Envoy Gateway resources in your local Kubernetes
        cluster using Docker Desktop.
      </Typography>

      {/* Backend Status and Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={4} alignItems="center">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Backend Status
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {error || installationError ? "Error" : "Ready"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Kubernetes
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {loading || isInstalling ? "Loading..." : "Ready"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Gateways
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {gateways.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Routes
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {routes.length}
            </Typography>
          </Box>
        </Stack>
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
          {/* Enhanced Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="envoy gateway main tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  maxWidth: 'none',
                }
              }}
            >
              <EnhancedTab
                icon={<RocketLaunchIcon />}
                label="Quick Start"
                description="Templates & Getting Started"
                value={TAB_IDS.QUICK_START}
              />
              <EnhancedTab
                icon={<InfrastructureIcon />}
                label="Infrastructure"
                description="Gateways, Routes & TLS"
                count={gateways.length + routes.length}
                value={TAB_IDS.INFRASTRUCTURE}
              />
              <EnhancedTab
                icon={<SecurityIcon />}
                label="Security & Policies"
                description="Auth, Rate Limiting & Resilience"
                value={TAB_IDS.SECURITY_POLICIES}
              />
              <EnhancedTab
                icon={<TrafficIcon />}
                label="Traffic & Testing"
                description="Splitting, HTTP Testing & Performance"
                value={TAB_IDS.TRAFFIC_TESTING}
              />
              {/* Operations tab commented out until implemented
              <EnhancedTab
                icon={<MonitoringIcon />}
                label="Operations"
                description="Monitoring & Troubleshooting"
                value={TAB_IDS.OPERATIONS}
              />
              */}
            </Tabs>
          </Box>

          {/* Enhanced Tab Content */}
          <Box role="tabpanel" hidden={currentTab !== TAB_IDS.QUICK_START}>
            {currentTab === TAB_IDS.QUICK_START && (
              <QuickStartTab
                currentSubTab={currentSubTabs[TAB_IDS.QUICK_START]}
                onSubTabChange={(value) => handleSubTabChange(TAB_IDS.QUICK_START, value)}
                gateways={gateways}
                routes={routes}
                deployedServices={deployedServices}
                loading={loading}
                onRefresh={fetchData}
                onResourceAction={openActionDialog}
                ddClient={ddClient}
                onTemplateApply={handleActionSuccess}
              />
            )}
          </Box>

          <Box role="tabpanel" hidden={currentTab !== TAB_IDS.INFRASTRUCTURE}>
            {currentTab === TAB_IDS.INFRASTRUCTURE && (
              <InfrastructureTab
                currentSubTab={currentSubTabs[TAB_IDS.INFRASTRUCTURE]}
                onSubTabChange={(value) => handleSubTabChange(TAB_IDS.INFRASTRUCTURE, value)}
                onResourceAction={handleActionSuccess}
              />
            )}
          </Box>

          <Box role="tabpanel" hidden={currentTab !== TAB_IDS.SECURITY_POLICIES}>
            {currentTab === TAB_IDS.SECURITY_POLICIES && (
              <SecurityPoliciesTab
                currentSubTab={currentSubTabs[TAB_IDS.SECURITY_POLICIES]}
                onSubTabChange={(value) => handleSubTabChange(TAB_IDS.SECURITY_POLICIES, value)}
                onPolicyCreated={handleActionSuccess}
              />
            )}
          </Box>

          <Box role="tabpanel" hidden={currentTab !== TAB_IDS.TRAFFIC_TESTING}>
            {currentTab === TAB_IDS.TRAFFIC_TESTING && (
              <TrafficTestingTab
                currentSubTab={currentSubTabs[TAB_IDS.TRAFFIC_TESTING]}
                onSubTabChange={(value) => handleSubTabChange(TAB_IDS.TRAFFIC_TESTING, value)}
                proxyUrl={proxyUrl}
                onProxyUrlChange={setProxyUrl}
              />
            )}
          </Box>

          {/* Operations tab content commented out until implemented
          <Box role="tabpanel" hidden={currentTab !== TAB_IDS.OPERATIONS}>
            {currentTab === TAB_IDS.OPERATIONS && (
              <OperationsTab
                currentSubTab={currentSubTabs[TAB_IDS.OPERATIONS]}
                onSubTabChange={(value) => handleSubTabChange(TAB_IDS.OPERATIONS, value)}
              />
            )}
          </Box>
          */}
        </>
      )}

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

      {/* Tutorial Manager */}
      <TutorialManager
        open={tutorialDialogOpen}
        onClose={() => {
          setTutorialDialogOpen(false);
          setSelectedTutorialId(undefined);
        }}
        selectedTutorial={selectedTutorialId}
      />

      {/* Tutorial Launcher - Floating Action Button */}
      <TutorialLauncher
        onLaunchTutorial={(tutorialId) => {
          setSelectedTutorialId(tutorialId);
          setTutorialDialogOpen(true);
        }}
      />
    </Box>
  );
}