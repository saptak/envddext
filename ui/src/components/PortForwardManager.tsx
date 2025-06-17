import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Grid,
  Collapse
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { portForwardService, PortForwardRequest, PortForwardStatus } from '../services/portForwardService';

interface PortForwardManagerProps {
  onPortForwardReady?: (url: string) => void;
  showQuickActions?: boolean;
}

export const PortForwardManager: React.FC<PortForwardManagerProps> = ({
  onPortForwardReady,
  showQuickActions = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeForwards, setActiveForwards] = useState<PortForwardStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<{name: string, type: string, ports: number[]}[]>([]);

  // Form state
  const [formData, setFormData] = useState<PortForwardRequest>({
    serviceName: '',
    namespace: 'demo',
    servicePort: 80,
    localPort: 8080,
    resourceType: 'service'
  });

  useEffect(() => {
    loadActiveForwards();
    loadAvailableServices();
  }, []);

  useEffect(() => {
    // Reload services when namespace changes
    if (formData.namespace) {
      loadAvailableServices();
    }
  }, [formData.namespace]);

  const loadActiveForwards = async () => {
    try {
      const forwards = await portForwardService.listPortForwards();
      setActiveForwards(forwards);
    } catch (err) {
      console.error('Failed to load port forwards:', err);
    }
  };

  const loadAvailableServices = async () => {
    try {
      const services = await portForwardService.listServices(formData.namespace);
      setAvailableServices(services);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const handleStartPortForward = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Find available port if current one is in use
      if (formData.localPort === 8080) {
        const availablePort = await portForwardService.findAvailablePort(8080);
        formData.localPort = availablePort;
      }

      const result = await portForwardService.startPortForward(formData);
      
      setSuccess(`Port forward started: localhost:${result.localPort}`);
      await loadActiveForwards();
      
      if (onPortForwardReady && result.url) {
        onPortForwardReady(result.url);
      }

      // Reset form
      setFormData({
        serviceName: '',
        namespace: 'demo',
        servicePort: 80,
        localPort: 8080,
        resourceType: 'service'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start port forward');
    } finally {
      setLoading(false);
    }
  };

  const handleStopPortForward = async (forward: PortForwardStatus) => {
    try {
      await portForwardService.stopPortForward(
        forward.serviceName,
        forward.namespace,
        forward.servicePort,
        forward.localPort
      );
      
      setSuccess(`Port forward stopped: ${forward.serviceName}`);
      await loadActiveForwards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop port forward');
    }
  };

  const handleQuickStartGateway = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Starting gateway port forward...');
      const result = await portForwardService.quickStartGatewayForward();
      setSuccess(`Gateway port forward started: localhost:${result.localPort}`);
      await loadActiveForwards();
      
      if (onPortForwardReady && result.url) {
        onPortForwardReady(result.url);
      }
    } catch (err) {
      console.error('Gateway port forward error:', err);
      
      // Show the actual error message without truncating
      let errorMessage = 'Failed to start gateway port forward';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err, null, 2);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess('URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const renderQuickActions = () => {
    if (!showQuickActions) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<StartIcon />}
              onClick={handleQuickStartGateway}
              disabled={loading}
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '&:disabled': {
                  backgroundColor: 'action.disabled',
                  color: 'grey.500',
                }
              }}
            >
              Start Gateway Port Forward
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => {
                setFormData({
                  serviceName: '',
                  namespace: 'demo',
                  servicePort: 80,
                  localPort: 8080,
                  resourceType: 'service'
                });
                setExpanded(true);
              }}
            >
              Demo Namespace
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderActiveForwards = () => {
    if (activeForwards.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No active port forwards. Start one using the form above or quick actions.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Service Port</TableCell>
              <TableCell>Local Port</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeForwards.map((forward, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {forward.serviceName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {forward.resourceType}
                  </Typography>
                </TableCell>
                <TableCell>{forward.namespace}</TableCell>
                <TableCell>{forward.servicePort}</TableCell>
                <TableCell>{forward.localPort}</TableCell>
                <TableCell>
                  <Chip
                    label={forward.isRunning ? 'Running' : 'Stopped'}
                    color={forward.isRunning ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {forward.url && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {forward.url}
                      </Typography>
                      <Tooltip title="Copy URL">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUrl(forward.url!)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open in browser">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenUrl(forward.url!)}
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleStopPortForward(forward)}
                    disabled={!forward.isRunning}
                  >
                    <StopIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Port Forward Manager
          </Typography>
          <Box>
            <IconButton onClick={loadActiveForwards} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {renderQuickActions()}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create Port Forward
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Service Name</InputLabel>
                  <Select
                    value={formData.serviceName}
                    label="Service Name"
                    onChange={(e) => {
                      const selectedService = availableServices.find(s => s.name === e.target.value);
                      setFormData({ 
                        ...formData, 
                        serviceName: e.target.value,
                        servicePort: selectedService?.ports[0] || 80
                      });
                    }}
                  >
                    {availableServices.map((service) => (
                      <MenuItem key={service.name} value={service.name}>
                        <Box>
                          <Typography variant="body2">{service.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.type} - Ports: {service.ports.join(', ')}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    {availableServices.length === 0 && (
                      <MenuItem disabled>
                        <Typography variant="caption">Loading services...</Typography>
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Namespace"
                  value={formData.namespace}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    namespace: e.target.value,
                    serviceName: '' // Reset service when namespace changes
                  })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource Type</InputLabel>
                  <Select
                    value={formData.resourceType}
                    label="Resource Type"
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                  >
                    <MenuItem value="service">Service</MenuItem>
                    <MenuItem value="pod">Pod</MenuItem>
                    <MenuItem value="deployment">Deployment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Service Port"
                  type="number"
                  value={formData.servicePort}
                  onChange={(e) => setFormData({ ...formData, servicePort: parseInt(e.target.value) || 80 })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Local Port"
                  type="number"
                  value={formData.localPort}
                  onChange={(e) => setFormData({ ...formData, localPort: parseInt(e.target.value) || 8080 })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} /> : <StartIcon />}
                  onClick={handleStartPortForward}
                  disabled={loading || !formData.serviceName}
                  sx={{ height: '40px' }}
                >
                  Start
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', fontFamily: 'monospace' }}>
              {error}
            </Box>
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {renderActiveForwards()}
      </CardContent>
    </Card>
  );
};

export default PortForwardManager;