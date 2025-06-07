import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  KubectlProxyService,
  ProxyStatus,
  ServiceEndpoint,
} from "../services/kubectlProxyService";

const ddClient = createDockerDesktopClient();

interface ProxyManagerProps {
  onProxyStatusChange?: (status: ProxyStatus) => void;
  onUrlGenerated?: (url: string) => void;
}

export const ProxyManager: React.FC<ProxyManagerProps> = ({
  onProxyStatusChange,
  onUrlGenerated,
}) => {
  const [proxyService] = useState(() => new KubectlProxyService(ddClient));
  const [proxyStatus, setProxyStatus] = useState<ProxyStatus>({
    isRunning: false,
    port: 8001,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // URL Generator state
  const [serviceName, setServiceName] = useState("echo-service");
  const [namespace, setNamespace] = useState("demo");
  const [port, setPort] = useState(8080);
  const [path, setPath] = useState("/");
  const [generatedUrl, setGeneratedUrl] = useState("");

  useEffect(() => {
    // Initial status check
    checkStatus();

    // Cleanup on unmount
    return () => {
      proxyService.destroy();
    };
  }, [proxyService]);

  useEffect(() => {
    onProxyStatusChange?.(proxyStatus);
  }, [proxyStatus, onProxyStatusChange]);

  const checkStatus = async () => {
    try {
      const status = await proxyService.checkProxyStatus();
      setProxyStatus(status);
      setError(status.error || null);
    } catch (error: any) {
      setError(
        typeof error === "string"
          ? error
          : error.message || "Failed to check proxy status",
      );
    }
  };

  const handleStartProxy = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const status = await proxyService.startProxy();
      setProxyStatus(status);

      if (status.isRunning) {
        setSuccess("Kubectl proxy started successfully!");
        // Generate URL for current service selection
        updateGeneratedUrl();
      } else {
        setError(status.error || "Failed to start proxy");
      }
    } catch (error: any) {
      setError(
        typeof error === "string"
          ? error
          : error.message || "Failed to start proxy",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopProxy = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await proxyService.stopProxy();
      const status = proxyService.getProxyStatus();
      setProxyStatus(status);
      setSuccess("Kubectl proxy stopped successfully!");
      setGeneratedUrl("");
    } catch (error: any) {
      setError(
        typeof error === "string"
          ? error
          : error.message || "Failed to stop proxy",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await proxyService.testProxyConnectivity();
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(
        typeof error === "string"
          ? error
          : error.message || "Connectivity test failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateGeneratedUrl = () => {
    if (proxyStatus.isRunning && serviceName && namespace && port) {
      const url = proxyService.generateProxyUrl(
        serviceName,
        namespace,
        port,
        path,
      );
      setGeneratedUrl(url);
    } else {
      setGeneratedUrl("");
    }
  };

  useEffect(() => {
    updateGeneratedUrl();
  }, [serviceName, namespace, port, path, proxyStatus.isRunning]);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess("URL copied to clipboard!");
    } catch (error) {
      setError("Failed to copy URL to clipboard");
    }
  };

  const handleUseUrl = (url: string) => {
    onUrlGenerated?.(url);
    setSuccess("URL sent to HTTP client!");
  };

  const handleQuickService = (endpoint: ServiceEndpoint) => {
    setServiceName(endpoint.serviceName);
    setNamespace(endpoint.namespace);
    setPort(endpoint.port);
    setPath(endpoint.path || "/");
  };

  const getStatusColor = (): "success" | "error" | "warning" | "default" => {
    if (proxyStatus.isRunning) return "success";
    if (proxyStatus.error) return "error";
    return "default";
  };

  const getStatusIcon = () => {
    if (proxyStatus.isRunning) return <CheckCircleIcon />;
    if (proxyStatus.error) return <ErrorIcon />;
    return null;
  };

  const commonEndpoints = proxyService.getCommonServiceEndpoints();

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h3">
          Kubectl Proxy Manager
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={proxyStatus.isRunning ? "Running" : "Stopped"}
            color={getStatusColor()}
            icon={getStatusIcon() || undefined}
            size="small"
          />
          <Tooltip title="Refresh status">
            <IconButton onClick={checkStatus} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kubectl proxy provides access to Kubernetes services through a local
        HTTP proxy. Start the proxy to test services without manual port
        forwarding.
      </Typography>

      {/* Status and Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color={proxyStatus.isRunning ? "error" : "primary"}
              onClick={
                proxyStatus.isRunning ? handleStopProxy : handleStartProxy
              }
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} />
                ) : proxyStatus.isRunning ? (
                  <StopIcon />
                ) : (
                  <PlayArrowIcon />
                )
              }
              sx={(theme) =>
                !proxyStatus.isRunning && theme.palette.mode === "light"
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
              {isLoading
                ? "Working..."
                : proxyStatus.isRunning
                  ? "Stop Proxy"
                  : "Start Proxy"}
            </Button>

            {proxyStatus.isRunning && (
              <Button
                variant="outlined"
                onClick={handleTestConnectivity}
                disabled={isLoading}
              >
                Test Connection
              </Button>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          {proxyStatus.isRunning && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Proxy URL: http://localhost:{proxyStatus.port}
              </Typography>
              {proxyStatus.startTime && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Started: {proxyStatus.startTime.toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* URL Generator */}
      {proxyStatus.isRunning && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Service URL Generator
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Service Name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Namespace"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Port"
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 8080)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/"
              />
            </Grid>
          </Grid>

          {generatedUrl && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Generated Proxy URL"
                value={generatedUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Copy URL">
                        <IconButton
                          onClick={() => handleCopyUrl(generatedUrl)}
                          size="small"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Use in HTTP Client">
                        <IconButton
                          onClick={() => handleUseUrl(generatedUrl)}
                          size="small"
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                }}
              />
            </Box>
          )}

          {/* Quick Access to Common Services */}
          <Typography variant="subtitle2" gutterBottom>
            Quick Access:
          </Typography>
          <List dense>
            {commonEndpoints.map((endpoint, index) => {
              const url = proxyService.generateProxyUrlFromEndpoint(endpoint);
              return (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={`${endpoint.serviceName}.${endpoint.namespace}`}
                    secondary={`Port ${endpoint.port} → ${url}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Use this service">
                      <IconButton
                        onClick={() => handleQuickService(endpoint)}
                        size="small"
                      >
                        <LinkIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy URL">
                      <IconButton
                        onClick={() => handleCopyUrl(url)}
                        size="small"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </>
      )}
    </Paper>
  );
};
