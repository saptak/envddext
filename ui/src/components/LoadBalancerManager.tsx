import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  NetworkCheck as NetworkCheckIcon,
  Router as RouterIcon
} from '@mui/icons-material';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { LoadBalancerService, LoadBalancerStatus, LoadBalancerConfiguration } from '../services/loadBalancerService';

const ddClient = createDockerDesktopClient();
const loadBalancerService = new LoadBalancerService(ddClient);

interface LoadBalancerManagerProps {
  onStatusChange?: (status: LoadBalancerStatus) => void;
  showConfigureButton?: boolean;
}

export const LoadBalancerManager: React.FC<LoadBalancerManagerProps> = ({
  onStatusChange,
  showConfigureButton = true
}) => {
  const [status, setStatus] = useState<LoadBalancerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [config, setConfig] = useState<LoadBalancerConfiguration>({
    provider: 'metallb',
    ipRange: '172.18.200.1-172.18.200.100',
    autoDetectRange: true
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const result = await loadBalancerService.checkLoadBalancerStatus();
      setStatus(result);
      onStatusChange?.(result);
    } catch (error) {
      console.error('Error checking LoadBalancer status:', error);
      const errorStatus = {
        isConfigured: false,
        error: 'Failed to check LoadBalancer status'
      };
      setStatus(errorStatus);
      onStatusChange?.(errorStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    try {
      setConfiguring(true);
      const result = await loadBalancerService.configureMetalLB(config);
      
      if (result.success) {
        // Wait a moment and check status again
        setTimeout(() => {
          checkStatus();
        }, 2000);
        setShowConfigDialog(false);
      } else {
        console.error('Failed to configure LoadBalancer:', result.error);
        // Update status with error
        setStatus(prev => ({
          ...prev,
          isConfigured: false,
          error: result.error
        }));
      }
    } catch (error: any) {
      console.error('Error configuring LoadBalancer:', error);
      setStatus(prev => ({
        ...prev,
        isConfigured: false,
        error: typeof error === 'string' ? error : error.message
      }));
    } finally {
      setConfiguring(false);
    }
  };

  const handleRemove = async () => {
    try {
      setConfiguring(true);
      const result = await loadBalancerService.removeMetalLB();
      
      if (result.success) {
        setTimeout(() => {
          checkStatus();
        }, 2000);
      } else {
        console.error('Failed to remove LoadBalancer:', result.error);
      }
    } catch (error: any) {
      console.error('Error removing LoadBalancer:', error);
    } finally {
      setConfiguring(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <CircularProgress size={20} />;
    if (!status) return <ErrorIcon color="error" />;
    
    if (status.isConfigured) {
      return <CheckCircleIcon color="success" />;
    } else {
      return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = () => {
    if (!status || loading) return 'default';
    return status.isConfigured ? 'success' : 'warning';
  };

  const getProviderIcon = () => {
    if (!status?.provider) return <RouterIcon />;
    
    switch (status.provider) {
      case 'metallb':
        return <RouterIcon />;
      case 'cloud':
        return <CloudIcon />;
      default:
        return <NetworkCheckIcon />;
    }
  };

  if (loading && !status) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Checking LoadBalancer status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStatusIcon()}
              <Typography variant="h6">
                LoadBalancer Configuration
              </Typography>
              <Chip
                label={status?.isConfigured ? 'Configured' : 'Not Configured'}
                color={getStatusColor() as any}
                size="small"
              />
            </Box>
            <Button
              startIcon={<SettingsIcon />}
              onClick={checkStatus}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {status?.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>LoadBalancer Status Error</AlertTitle>
              {status.error}
            </Alert>
          )}

          {!status?.isConfigured && !status?.error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>LoadBalancer Not Configured</AlertTitle>
              No LoadBalancer controller detected. Gateways will not receive external IP addresses.
              {showConfigureButton && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setShowConfigDialog(true)}
                    disabled={configuring}
                    startIcon={configuring ? <CircularProgress size={16} /> : <SettingsIcon />}
                  >
                    {configuring ? 'Configuring...' : 'Configure LoadBalancer'}
                  </Button>
                </Box>
              )}
            </Alert>
          )}

          {status?.isConfigured && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>LoadBalancer Active</AlertTitle>
                LoadBalancer controller is configured and working. Gateways will receive external IP addresses.
              </Alert>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getProviderIcon()}
                <Box>
                  <Typography variant="subtitle2">
                    Provider: {status.provider?.toUpperCase() || 'Unknown'}
                  </Typography>
                  {status.version && (
                    <Typography variant="body2" color="text.secondary">
                      Version: {status.version}
                    </Typography>
                  )}
                </Box>
              </Box>

              {status.ipPools && status.ipPools.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    IP Address Pools:
                  </Typography>
                  <List dense>
                    {status.ipPools.map((pool, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon>
                          <NetworkCheckIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={pool.name}
                          secondary={pool.addresses.join(', ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {status.provider === 'metallb' && showConfigureButton && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemove}
                    disabled={configuring}
                    startIcon={configuring ? <CircularProgress size={16} /> : <ErrorIcon />}
                  >
                    {configuring ? 'Removing...' : 'Remove MetalLB'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onClose={() => setShowConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure LoadBalancer (MetalLB)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              MetalLB will provide LoadBalancer functionality for your Docker Desktop cluster.
              This enables Gateways to receive external IP addresses.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={config.autoDetectRange}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoDetectRange: e.target.checked }))}
                />
              }
              label="Auto-detect IP range"
            />

            {!config.autoDetectRange && (
              <TextField
                fullWidth
                label="IP Address Range"
                value={config.ipRange}
                onChange={(e) => setConfig(prev => ({ ...prev, ipRange: e.target.value }))}
                placeholder="172.18.200.1-172.18.200.100"
                helperText="Specify the IP range for LoadBalancer services (e.g., 172.18.200.1-172.18.200.100)"
                sx={{ mt: 2 }}
              />
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                MetalLB will be installed in the <code>metallb-system</code> namespace.
                {config.autoDetectRange ? ' The IP range will be automatically detected based on your Docker network configuration.' : ''}
              </Typography>
            </Alert>

            {configuring && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Installing and configuring MetalLB...
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowConfigDialog(false)}
            disabled={configuring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfigure}
            variant="contained"
            disabled={configuring || (!config.autoDetectRange && !config.ipRange.trim())}
            startIcon={configuring ? <CircularProgress size={16} /> : <SettingsIcon />}
          >
            {configuring ? 'Installing...' : 'Install & Configure'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};