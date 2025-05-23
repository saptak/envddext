import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { GatewayStatusInfo } from '../types/gateway';
import { getGatewayStatus, deleteGateway } from '../helper/kubernetes';

const ddClient = createDockerDesktopClient();

interface GatewayStatusMonitorProps {
  gatewayName: string;
  namespace: string;
  onDelete?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const GatewayStatusMonitor: React.FC<GatewayStatusMonitorProps> = ({
  gatewayName,
  namespace,
  onDelete,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGatewayStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchGatewayStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [gatewayName, namespace, autoRefresh, refreshInterval]);

  const fetchGatewayStatus = async () => {
    try {
      setError(null);
      const status = await getGatewayStatus(ddClient, namespace, gatewayName);
      setGatewayStatus(status);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to fetch Gateway status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchGatewayStatus();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Gateway "${gatewayName}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteGateway(ddClient, namespace, gatewayName);
      if (result.success) {
        onDelete?.();
      } else {
        setError(result.error || 'Failed to delete Gateway');
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to delete Gateway');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <HourglassEmptyIcon color="warning" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getListenerStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'failed':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <HourglassEmptyIcon color="warning" fontSize="small" />;
    }
  };

  if (error) {
    return (
      <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
        <Alert severity="error">
          <Typography variant="subtitle2">Error loading Gateway status</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button size="small" onClick={handleRefresh} sx={{ mt: 1 }}>
            Retry
          </Button>
        </Alert>
      </Paper>
    );
  }

  if (!gatewayStatus) {
    return (
      <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Loading Gateway status...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStatusIcon(gatewayStatus.status)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {gatewayName}
            </Typography>
            <Chip 
              label={gatewayStatus.status.toUpperCase()} 
              size="small" 
              color={getStatusColor(gatewayStatus.status) as any} 
              variant="outlined" 
              sx={{ ml: 2 }}
            />
            {gatewayStatus.age && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                {gatewayStatus.age}
              </Typography>
            )}
          </Box>
          <Box>
            <Tooltip title={`Last refreshed: ${lastRefreshed.toLocaleTimeString()}`}>
              <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            {onDelete && (
              <Tooltip title="Delete Gateway">
                <IconButton 
                  size="small" 
                  onClick={handleDelete} 
                  disabled={deleting}
                  color="error"
                >
                  {deleting ? <CircularProgress size={18} /> : <DeleteIcon />}
                </IconButton>
              </Tooltip>
            )}
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s' 
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Namespace: {namespace}
        </Typography>

        {gatewayStatus.message && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {gatewayStatus.message}
          </Typography>
        )}

        {/* Gateway Addresses */}
        {gatewayStatus.addresses && gatewayStatus.addresses.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Gateway Addresses:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {gatewayStatus.addresses.map((address, index) => (
                <Chip
                  key={index}
                  label={address}
                  size="small"
                  icon={<NetworkCheckIcon />}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {/* Listeners Status */}
            {gatewayStatus.listeners && gatewayStatus.listeners.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Listeners Status:
                </Typography>
                <List dense>
                  {gatewayStatus.listeners.map((listener, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {getListenerStatusIcon(listener.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {listener.name}
                            </Typography>
                            <Chip
                              label={`${listener.attachedRoutes} routes`}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={listener.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Conditions */}
            {gatewayStatus.conditions && gatewayStatus.conditions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Conditions:
                </Typography>
                <List dense>
                  {gatewayStatus.conditions.map((condition, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {condition.status === 'True' ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : condition.status === 'False' ? (
                          <ErrorIcon color="error" fontSize="small" />
                        ) : (
                          <InfoIcon color="info" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {condition.type}
                            </Typography>
                            <Chip
                              label={condition.status}
                              size="small"
                              color={
                                condition.status === 'True' ? 'success' :
                                condition.status === 'False' ? 'error' : 'default'
                              }
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {condition.reason}: {condition.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last transition: {new Date(condition.lastTransitionTime).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};
