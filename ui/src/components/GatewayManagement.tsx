import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { GatewayCreationForm } from './GatewayCreationForm';
import { GatewayStatusMonitor } from './GatewayStatusMonitor';
import { LoadBalancerManager } from './LoadBalancerManager';
import { listEnvoyGateways } from '../helper/kubernetes';
import { Gateway } from '../types/gateway';
import { LoadBalancerStatus } from '../services/loadBalancerService';

const ddClient = createDockerDesktopClient();

interface GatewayManagementProps {
  onGatewayCreated?: (gateway: Gateway) => void;
}

export const GatewayManagement: React.FC<GatewayManagementProps> = ({
  onGatewayCreated
}) => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [loadBalancerStatus, setLoadBalancerStatus] = useState<LoadBalancerStatus | null>(null);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await listEnvoyGateways(ddClient);
      
      if (result.error) {
        setError(result.error);
        setGateways([]);
      } else {
        setGateways(result.items || []);
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to fetch Gateways');
      setGateways([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (gateway: Gateway) => {
    setShowCreateForm(false);
    setCreateSuccess(`Gateway "${gateway.metadata.name}" created successfully!`);
    
    // Refresh the gateway list
    fetchGateways();
    
    // Notify parent component
    onGatewayCreated?.(gateway);
    
    // Clear success message after 5 seconds
    setTimeout(() => setCreateSuccess(null), 5000);
  };

  const handleGatewayDeleted = () => {
    // Refresh the gateway list when a gateway is deleted
    fetchGateways();
  };

  const handleLoadBalancerStatusChange = (status: LoadBalancerStatus) => {
    setLoadBalancerStatus(status);
    // Refresh gateway list if LoadBalancer was just configured
    if (status.isConfigured && (!loadBalancerStatus || !loadBalancerStatus.isConfigured)) {
      setTimeout(() => {
        fetchGateways();
      }, 3000); // Wait a bit for IP assignments to propagate
    }
  };

  const getGatewayStatusSummary = (gateway: Gateway) => {
    const conditions = gateway.status?.conditions || [];
    const programmedCondition = conditions.find(c => c.type === 'Programmed');
    
    if (programmedCondition) {
      if (programmedCondition.status === 'True') {
        return { status: 'ready', color: 'success' as const };
      } else if (programmedCondition.status === 'False') {
        return { status: 'failed', color: 'error' as const };
      }
    }
    
    return { status: 'pending', color: 'warning' as const };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gateway Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchGateways}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Gateway
          </Button>
        </Box>
      </Box>

      {createSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setCreateSuccess(null)}>
          {createSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Error loading Gateways</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* LoadBalancer Configuration */}
      <Box sx={{ mb: 3 }}>
        <LoadBalancerManager 
          onStatusChange={handleLoadBalancerStatusChange}
          showConfigureButton={true}
        />
      </Box>

      {/* Gateway Address Assignment Warning */}
      {loadBalancerStatus && !loadBalancerStatus.isConfigured && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Gateways may not receive IP addresses</Typography>
          <Typography variant="body2">
            Without a LoadBalancer controller, your Gateways will remain in "AddressNotAssigned" state. 
            Configure a LoadBalancer above to resolve this issue.
          </Typography>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Gateway Summary */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gateway Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {gateways.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Gateways
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {gateways.filter(gw => getGatewayStatusSummary(gw).status === 'ready').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {gateways.filter(gw => getGatewayStatusSummary(gw).status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {gateways.filter(gw => getGatewayStatusSummary(gw).status === 'failed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Gateway List */}
          {gateways.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Gateways Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first Gateway to start routing traffic through Envoy Gateway.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
              >
                Create Gateway
              </Button>
            </Paper>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Gateways ({gateways.length})
              </Typography>
              {gateways.map((gateway) => (
                <GatewayStatusMonitor
                  key={`${gateway.metadata.namespace}-${gateway.metadata.name}`}
                  gatewayName={gateway.metadata.name}
                  namespace={gateway.metadata.namespace}
                  onDelete={handleGatewayDeleted}
                />
              ))}
            </Box>
          )}
        </>
      )}

      {/* Create Gateway Dialog */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          Create New Gateway
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <GatewayCreationForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
