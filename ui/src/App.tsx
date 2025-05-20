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
  DialogActions
} from "@mui/material";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { listEnvoyGateways, listEnvoyHTTPRoutes, checkEnvoyGatewayCRDs, installEnvoyGateway } from "./helper/kubernetes";

const ddClient = createDockerDesktopClient();

export function App() {
  const [gateways, setGateways] = React.useState<any[]>([]);
  const [routes, setRoutes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEnvoyGatewayInstalled, setIsEnvoyGatewayInstalled] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [installationError, setInstallationError] = React.useState<string | null>(null);
  const [quickStartDialogOpen, setQuickStartDialogOpen] = React.useState(false);

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
          console.error('Gateway error:', gwResult.error);
          setError(gwResult.error);
        }
        if (rtResult.error) {
          console.error('Route error:', rtResult.error);
          setError(rtResult.error);
        }
        setGateways(gwResult.items || []);
        setRoutes(rtResult.items || []);
      } catch (e: any) {
        console.error('Caught error:', e);
        setError(typeof e === 'string' ? e : JSON.stringify(e, null, 2));
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
        console.error('Installation error:', result.error);
        setInstallationError(result.error);
      } else {
        // Installation successful, re-check CRDs and fetch data
        await fetchData();
      }
    } catch (e: any) {
      console.error('Caught installation error:', e);
      setInstallationError(typeof e === 'string' ? e : JSON.stringify(e, null, 2));
    }
    setIsInstalling(false);
  };

  const handleQuickStartOpen = () => {
    setQuickStartDialogOpen(true);
  };

  const handleQuickStartClose = () => {
    setQuickStartDialogOpen(false);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Envoy Gateway
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage and observe Envoy Gateway resources in your local Kubernetes cluster using Docker Desktop.
      </Typography>

      {/* Backend Status and Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1">Backend Status: <b>{error || installationError ? "error" : "ok"}</b></Typography>
        <Typography variant="subtitle1">Kubernetes: <b>{loading || isInstalling ? "Loading..." : "Ready"}</b></Typography>
        <Typography variant="subtitle1">Gateways: <b>{gateways.length}</b></Typography>
        <Typography variant="subtitle1">Routes: <b>{routes.length}</b></Typography>
      </Paper>

      {loading || isInstalling ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
          {isInstalling && <Typography variant="body1" sx={{ ml: 2 }}>Installing Envoy Gateway...</Typography>}
        </Box>
      ) : error || installationError ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography color="error" sx={{ whiteSpace: 'pre-wrap' }}>
            Error: {typeof (error || installationError) === 'string' ? (error || installationError) : JSON.stringify((error || installationError), null, 2)}
          </Typography>
        </Paper>
      ) : !isEnvoyGatewayInstalled ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Envoy Gateway Not Installed</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Envoy Gateway Custom Resource Definitions (CRDs) were not found in your Kubernetes cluster.
            Please install Envoy Gateway to use this extension.
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
             <Typography color="error" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
               Installation Error: {typeof installationError === 'string' ? installationError : JSON.stringify(installationError, null, 2)}
             </Typography>
           )}
        </Paper>
      ) : (
        <>
          {/* Gateways Section */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6">Gateways</Typography>
            <Divider sx={{ my: 1 }} />
            {gateways.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No gateways found
              </Typography>
            ) : (
              gateways.map((gw: any) => (
                <Typography key={gw.metadata.uid} variant="body2">
                  {gw.metadata.name} (ns: {gw.metadata.namespace})
                </Typography>
              ))
            )}
          </Paper>

          {/* Routes Section */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6">Routes</Typography>
            <Divider sx={{ my: 1 }} />
            {routes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No routes found
              </Typography>
            ) : (
              routes.map((rt: any) => (
                <Typography key={rt.metadata.uid} variant="body2">
                  {rt.metadata.name} (ns: {rt.metadata.namespace})
                </Typography>
              ))
            )}
          </Paper>

          {/* Quick Setup Section */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">🚀 Quick Setup</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Get started with Envoy Gateway quickly for learning and local development.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleQuickStartOpen}
              sx={{ mt: 1 }}
            >
              Launch Quick Start
            </Button>
          </Paper>
        </>
      )}

      {/* Quick Start Dialog */}
      <Dialog
        open={quickStartDialogOpen}
        onClose={handleQuickStartClose}
        aria-labelledby="quick-start-dialog-title"
        aria-describedby="quick-start-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="quick-start-dialog-title">
          🚀 Envoy Gateway Quick Start
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="quick-start-dialog-description" sx={{ mb: 2 }}>
            Welcome to the Envoy Gateway Quick Start! This wizard will help you get started with common Envoy Gateway use cases.
            Choose one of the examples below to deploy a complete working configuration to your Kubernetes cluster.
          </DialogContentText>
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Available Examples:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Basic HTTP Routing - Deploy a simple web service with HTTP routing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • TLS Termination - Secure your services with HTTPS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Traffic Splitting - Route traffic to multiple versions of a service
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQuickStartClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
