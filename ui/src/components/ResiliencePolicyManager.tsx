import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Grid,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import TimeoutConfiguration, { TimeoutConfig, ResiliencePolicyConfig as TimeoutPolicyConfig } from './TimeoutConfiguration';
import RetryPolicyConfiguration, { RetryPolicyConfig } from './RetryPolicyConfiguration';
import { ContextualHelp } from './ContextualHelp';

// Combined resilience policy interface
export interface ResiliencePolicy {
  id: string;
  name: string;
  namespace: string;
  type: 'timeout' | 'retry' | 'combined';
  targetType: 'Gateway' | 'HTTPRoute';
  targetName: string;
  timeoutConfig?: TimeoutConfig;
  retryConfig?: RetryPolicyConfig;
  status: 'active' | 'pending' | 'error';
  created: string;
  lastModified: string;
}

interface ResiliencePolicyManagerProps {
  // Mock data - in real implementation, these would come from Kubernetes API
  policies?: ResiliencePolicy[];
  onCreatePolicy?: (policy: ResiliencePolicy) => Promise<void>;
  onUpdatePolicy?: (policy: ResiliencePolicy) => Promise<void>;
  onDeletePolicy?: (policyId: string) => Promise<void>;
}

const MOCK_POLICIES: ResiliencePolicy[] = [
  {
    id: 'timeout-policy-1',
    name: 'api-timeouts',
    namespace: 'demo',
    type: 'timeout',
    targetType: 'HTTPRoute',
    targetName: 'echo-route',
    status: 'active',
    created: '2025-06-13T10:00:00Z',
    lastModified: '2025-06-13T10:00:00Z',
    timeoutConfig: {
      request: { enabled: true, timeout: 30, unit: 'seconds' },
      backend: { enabled: true, connectTimeout: 10, responseTimeout: 30, unit: 'seconds' }
    }
  },
  {
    id: 'retry-policy-1',
    name: 'gateway-retries',
    namespace: 'demo',
    type: 'retry',
    targetType: 'Gateway',
    targetName: 'my-first-gateway',
    status: 'active',
    created: '2025-06-13T11:00:00Z',
    lastModified: '2025-06-13T11:00:00Z',
    retryConfig: {
      name: 'gateway-retries',
      namespace: 'demo',
      targetType: 'Gateway',
      targetName: 'my-first-gateway',
      enabled: true,
      maxRetries: 3,
      perTryTimeout: 10,
      retryOn: {
        httpStatusCodes: [502, 503, 504],
        resetCodes: ['connect-failure'],
        retriableHeaders: [],
        retriableRequestHeaders: []
      },
      backoff: {
        baseInterval: 1000,
        maxInterval: 30000,
        multiplier: 2,
        jitter: true
      }
    }
  }
];

// Mock target options
const MOCK_TARGET_OPTIONS = [
  { name: 'my-first-gateway', type: 'Gateway' as const, namespace: 'demo' },
  { name: 'secure-gateway', type: 'Gateway' as const, namespace: 'demo' },
  { name: 'echo-route', type: 'HTTPRoute' as const, namespace: 'demo' },
  { name: 'api-route', type: 'HTTPRoute' as const, namespace: 'demo' },
];

export const ResiliencePolicyManager: React.FC<ResiliencePolicyManagerProps> = ({
  policies = MOCK_POLICIES,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPolicyType, setCreatePolicyType] = useState<'timeout' | 'retry'>('timeout');
  const [editingPolicy, setEditingPolicy] = useState<ResiliencePolicy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<ResiliencePolicy | null>(null);

  const timeoutPolicies = policies.filter(p => p.type === 'timeout');
  const retryPolicies = policies.filter(p => p.type === 'retry');

  const getStatusIcon = (status: ResiliencePolicy['status']) => {
    switch (status) {
      case 'active': return <CheckIcon color="success" />;
      case 'pending': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <WarningIcon />;
    }
  };

  const getStatusColor = (status: ResiliencePolicy['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatTimeoutSummary = (config?: TimeoutConfig) => {
    if (!config) return 'No timeout configuration';
    
    const enabledTimeouts = Object.entries(config)
      .filter(([_, value]) => value?.enabled)
      .map(([key]) => key);
    
    return enabledTimeouts.length > 0 
      ? `${enabledTimeouts.length} timeout(s): ${enabledTimeouts.join(', ')}`
      : 'No timeouts enabled';
  };

  const formatRetrySummary = (config?: RetryPolicyConfig) => {
    if (!config || !config.enabled) return 'Retries disabled';
    
    return `${config.maxRetries} retries, ${config.retryOn.httpStatusCodes.length} status codes`;
  };

  const handleCreateTimeout = async (config: TimeoutPolicyConfig) => {
    const newPolicy: ResiliencePolicy = {
      id: `timeout-${Date.now()}`,
      name: config.name,
      namespace: config.namespace,
      type: 'timeout',
      targetType: config.targetType,
      targetName: config.targetName,
      timeoutConfig: config.timeouts,
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    if (onCreatePolicy) {
      await onCreatePolicy(newPolicy);
    }
    setCreateDialogOpen(false);
  };

  const handleCreateRetry = async (config: RetryPolicyConfig) => {
    const newPolicy: ResiliencePolicy = {
      id: `retry-${Date.now()}`,
      name: config.name,
      namespace: config.namespace,
      type: 'retry',
      targetType: config.targetType,
      targetName: config.targetName,
      retryConfig: config,
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    if (onCreatePolicy) {
      await onCreatePolicy(newPolicy);
    }
    setCreateDialogOpen(false);
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (onDeletePolicy) {
      await onDeletePolicy(policyId);
    }
  };

  const PolicyCard: React.FC<{ policy: ResiliencePolicy }> = ({ policy }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {policy.type === 'timeout' ? <TimerIcon color="primary" /> : <RefreshIcon color="secondary" />}
              <Typography variant="h6">{policy.name}</Typography>
              <Chip 
                label={policy.status} 
                color={getStatusColor(policy.status)}
                size="small"
                icon={getStatusIcon(policy.status)}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {policy.targetType}: {policy.targetName} ({policy.namespace})
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {policy.type === 'timeout' 
                ? formatTimeoutSummary(policy.timeoutConfig)
                : formatRetrySummary(policy.retryConfig)
              }
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Created: {new Date(policy.created).toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Configuration">
              <IconButton size="small" onClick={() => setViewingPolicy(policy)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Policy">
              <IconButton size="small" onClick={() => setEditingPolicy(policy)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Policy">
              <IconButton size="small" onClick={() => handleDeletePolicy(policy.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ShieldIcon color="primary" />
          <Typography variant="h5">Resilience Policies</Typography>
          <ContextualHelp topic="gateway" variant="tooltip" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure timeout and retry policies to improve application resilience and reliability
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{timeoutPolicies.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Timeout Policies
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <RefreshIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{retryPolicies.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Retry Policies
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              {policies.filter(p => p.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Policies
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreatePolicyType('timeout');
            setCreateDialogOpen(true);
          }}
        >
          Add Timeout Policy
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreatePolicyType('retry');
            setCreateDialogOpen(true);
          }}
        >
          Add Retry Policy
        </Button>
      </Box>

      {/* Policy Tabs */}
      <Card>
        <CardHeader 
          title={
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon />
                    Timeout Policies ({timeoutPolicies.length})
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RefreshIcon />
                    Retry Policies ({retryPolicies.length})
                  </Box>
                } 
              />
            </Tabs>
          }
        />
        <CardContent>
          {activeTab === 0 && (
            <Box>
              {timeoutPolicies.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    No timeout policies configured. Click "Add Timeout Policy" to create your first timeout configuration.
                  </Typography>
                </Alert>
              ) : (
                timeoutPolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              {retryPolicies.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    No retry policies configured. Click "Add Retry Policy" to create your first retry configuration.
                  </Typography>
                </Alert>
              ) : (
                retryPolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Policy Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {createPolicyType === 'timeout' ? (
            <TimeoutConfiguration
              targetOptions={MOCK_TARGET_OPTIONS}
              onSave={handleCreateTimeout}
              onCancel={() => setCreateDialogOpen(false)}
            />
          ) : (
            <RetryPolicyConfiguration
              targetOptions={MOCK_TARGET_OPTIONS}
              onSave={handleCreateRetry}
              onCancel={() => setCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Policy Dialog */}
      <Dialog
        open={!!viewingPolicy}
        onClose={() => setViewingPolicy(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewingPolicy?.type === 'timeout' ? <TimerIcon color="primary" /> : <RefreshIcon color="secondary" />}
            <Typography variant="h6">{viewingPolicy?.name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingPolicy && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Policy Configuration:
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  bgcolor: 'background.default', 
                  p: 2, 
                  borderRadius: 1, 
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  mb: 2
                }}
              >
                {JSON.stringify(
                  viewingPolicy.type === 'timeout' ? viewingPolicy.timeoutConfig : viewingPolicy.retryConfig, 
                  null, 
                  2
                )}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Policy Details:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Target" secondary={`${viewingPolicy.targetType}: ${viewingPolicy.targetName}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Namespace" secondary={viewingPolicy.namespace} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Status" secondary={viewingPolicy.status} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Created" 
                    secondary={new Date(viewingPolicy.created).toLocaleString()} 
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingPolicy(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Information */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🛡️ About Resilience Policies
        </Typography>
        <Typography variant="body2">
          Resilience policies help your applications handle failures gracefully. Timeout policies prevent requests from hanging indefinitely, 
          while retry policies automatically retry failed requests. Configure these policies based on your application's requirements and user expectations.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ResiliencePolicyManager;