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
  ExpandLess as ExpandLessIcon,
  AutoAwesome as QuickStartIcon
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
  }, []);

  const loadActiveForwards = async () => {
    try {
      const forwards = await portForwardService.listPortForwards();
      setActiveForwards(forwards);
    } catch (err) {
      console.error('Failed to load port forwards:', err);
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
      const result = await portForwardService.quickStartGatewayForward();
      setSuccess(`Gateway port forward started: localhost:${result.localPort}`);
      await loadActiveForwards();
      
      if (onPortForwardReady && result.url) {
        onPortForwardReady(result.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start gateway port forward');
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
        <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <QuickStartIcon sx={{ mr: 1 }} />
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<StartIcon />}
              onClick={handleQuickStartGateway}
              disabled={loading}
            >
              Start Gateway Port Forward
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => setFormData({
                serviceName: 'echo-service',
                namespace: 'demo',
                servicePort: 80,
                localPort: 8080,
                resourceType: 'service'
              })}
            >
              Demo Service Template
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
                <TextField
                  fullWidth
                  label="Service Name"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Namespace"
                  value={formData.namespace}
                  onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
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
            {error}
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