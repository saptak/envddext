import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LinkIcon from '@mui/icons-material/Link';
import StorageIcon from '@mui/icons-material/Storage';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { getHTTPRouteStatus, deleteHTTPRoute } from '../helper/kubernetes';
import { HTTPRouteStatusInfo } from '../types/httproute';

const ddClient = createDockerDesktopClient();

interface HTTPRouteStatusMonitorProps {
  routeName: string;
  namespace: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onDelete?: (routeName: string, namespace: string) => void;
  onEdit?: (routeName: string, namespace: string) => void;
}

export const HTTPRouteStatusMonitor: React.FC<HTTPRouteStatusMonitorProps> = ({
  routeName,
  namespace,
  autoRefresh = true,
  refreshInterval = 10000,
  onDelete,
  onEdit
}) => {
  const [status, setStatus] = useState<HTTPRouteStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [routeName, namespace, autoRefresh, refreshInterval]);

  const fetchStatus = async () => {
    try {
      setError(null);
      const statusInfo = await getHTTPRouteStatus(ddClient, namespace, routeName);
      setStatus(statusInfo);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to fetch HTTPRoute status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const result = await deleteHTTPRoute(ddClient, namespace, routeName);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete HTTPRoute');
        return;
      }

      setDeleteDialogOpen(false);
      onDelete?.(routeName, namespace);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to delete HTTPRoute');
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
        return <PendingIcon color="warning" />;
      default:
        return <HelpOutlineIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'ready':
      case 'accepted':
      case 'available':
        return 'success';
      case 'failed':
      case 'unavailable':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Loading HTTPRoute status...</Typography>
        </Box>
      </Paper>
    );
  }

  if (!status) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Alert severity="error">
          Failed to load HTTPRoute status: {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ mb: 2 }}>
        <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {getStatusIcon(status.status)}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">
                  {status.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Namespace: {status.namespace} • Age: {status.age || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={status.status.toUpperCase()}
                  color={getStatusColor(status.status)}
                  size="small"
                />
                <Tooltip title="Refresh Status">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchStatus();
                    }}
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                {onEdit && (
                  <Tooltip title="Edit HTTPRoute">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(routeName, namespace);
                      }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete HTTPRoute">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Status Message */}
              {status.message && (
                <Grid item xs={12}>
                  <Alert severity={status.status === 'ready' ? 'success' : status.status === 'failed' ? 'error' : 'info'}>
                    {status.message}
                  </Alert>
                </Grid>
              )}

              {/* Parent Gateways */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon fontSize="small" />
                  Parent Gateways
                </Typography>
                {status.parentGateways && status.parentGateways.length > 0 ? (
                  <List dense>
                    {status.parentGateways.map((gateway, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getStatusIcon(gateway.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${gateway.name} (${gateway.namespace})`}
                          secondary={gateway.message}
                        />
                        <Chip
                          label={gateway.status.toUpperCase()}
                          color={getStatusColor(gateway.status)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No parent gateways found
                  </Typography>
                )}
              </Grid>

              {/* Backend Services */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon fontSize="small" />
                  Backend Services
                </Typography>
                {status.backendServices && status.backendServices.length > 0 ? (
                  <List dense>
                    {status.backendServices.map((service, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getStatusIcon(service.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${service.name} (${service.namespace})`}
                          secondary={`${service.endpoints || 0} endpoint(s)`}
                        />
                        <Chip
                          label={service.status.toUpperCase()}
                          color={getStatusColor(service.status)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No backend services configured
                  </Typography>
                )}
              </Grid>

              {/* Conditions */}
              {status.conditions && status.conditions.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Conditions
                  </Typography>
                  <List dense>
                    {status.conditions.map((condition, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getStatusIcon(condition.status === 'True' ? 'ready' : condition.status === 'False' ? 'failed' : 'pending')}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${condition.type}: ${condition.status}`}
                          secondary={`${condition.reason} - ${condition.message}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}

              {/* Error Display */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete HTTPRoute</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the HTTPRoute "{routeName}" in namespace "{namespace}"?
            This action cannot be undone and will remove all routing rules associated with this HTTPRoute.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : undefined}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
