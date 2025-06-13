import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  FormGroup,
  Checkbox,
  Slider,
  InputAdornment,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { ContextualHelp, QuickHelp } from './ContextualHelp';

// Retry policy interfaces
export interface RetryCondition {
  httpStatusCodes: number[];
  resetCodes: string[];
  retriableHeaders: string[];
  retriableRequestHeaders: string[];
}

export interface BackoffStrategy {
  baseInterval: number;
  maxInterval: number;
  multiplier: number;
  jitter: boolean;
}

export interface RetryPolicyConfig {
  name: string;
  namespace: string;
  targetType: 'Gateway' | 'HTTPRoute';
  targetName: string;
  enabled: boolean;
  maxRetries: number;
  perTryTimeout: number;
  retryOn: RetryCondition;
  backoff: BackoffStrategy;
  description?: string;
}

interface RetryPolicyConfigurationProps {
  initialConfig?: RetryPolicyConfig;
  onSave: (config: RetryPolicyConfig) => Promise<void>;
  onCancel: () => void;
  targetOptions: Array<{ name: string; type: 'Gateway' | 'HTTPRoute'; namespace: string }>;
}

const DEFAULT_RETRY_CONFIG: RetryPolicyConfig = {
  name: '',
  namespace: 'default',
  targetType: 'HTTPRoute',
  targetName: '',
  enabled: true,
  maxRetries: 3,
  perTryTimeout: 10,
  retryOn: {
    httpStatusCodes: [502, 503, 504],
    resetCodes: ['connect-failure', 'refused-stream'],
    retriableHeaders: [],
    retriableRequestHeaders: []
  },
  backoff: {
    baseInterval: 1000, // ms
    maxInterval: 30000, // ms
    multiplier: 2,
    jitter: true
  }
};

const COMMON_HTTP_STATUS_CODES = [
  { code: 408, description: 'Request Timeout' },
  { code: 429, description: 'Too Many Requests' },
  { code: 500, description: 'Internal Server Error' },
  { code: 502, description: 'Bad Gateway' },
  { code: 503, description: 'Service Unavailable' },
  { code: 504, description: 'Gateway Timeout' },
  { code: 507, description: 'Insufficient Storage' },
];

const RESET_CODES = [
  { code: 'connect-failure', description: 'Connection failed to upstream' },
  { code: 'connection-failure', description: 'Connection failure during request' },
  { code: 'connection-termination', description: 'Connection terminated' },
  { code: 'refused-stream', description: 'HTTP/2 stream refused' },
  { code: 'cancelled', description: 'Request cancelled' },
  { code: 'deadline-exceeded', description: 'Request deadline exceeded' },
  { code: 'internal-error', description: 'Internal error occurred' },
  { code: 'resource-exhausted', description: 'Resource exhausted' },
];

export const RetryPolicyConfiguration: React.FC<RetryPolicyConfigurationProps> = ({
  initialConfig,
  onSave,
  onCancel,
  targetOptions
}) => {
  const [config, setConfig] = useState<RetryPolicyConfig>({
    ...DEFAULT_RETRY_CONFIG,
    ...initialConfig
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.name.trim()) {
      newErrors.name = 'Policy name is required';
    }

    if (!config.targetName) {
      newErrors.targetName = 'Target resource is required';
    }

    if (config.maxRetries < 0 || config.maxRetries > 10) {
      newErrors.maxRetries = 'Max retries must be between 0 and 10';
    }

    if (config.perTryTimeout <= 0) {
      newErrors.perTryTimeout = 'Per-try timeout must be greater than 0';
    }

    if (config.backoff.baseInterval <= 0) {
      newErrors.baseInterval = 'Base interval must be greater than 0';
    }

    if (config.backoff.maxInterval <= config.backoff.baseInterval) {
      newErrors.maxInterval = 'Max interval must be greater than base interval';
    }

    if (config.backoff.multiplier <= 1) {
      newErrors.multiplier = 'Multiplier must be greater than 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;

    setSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      console.error('Failed to save retry policy:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateRetryCondition = (field: keyof RetryCondition, value: any) => {
    setConfig(prev => ({
      ...prev,
      retryOn: {
        ...prev.retryOn,
        [field]: value
      }
    }));
  };

  const updateBackoffStrategy = (field: keyof BackoffStrategy, value: any) => {
    setConfig(prev => ({
      ...prev,
      backoff: {
        ...prev.backoff,
        [field]: value
      }
    }));
  };

  const toggleHttpStatusCode = (code: number) => {
    const currentCodes = config.retryOn.httpStatusCodes;
    const newCodes = currentCodes.includes(code)
      ? currentCodes.filter(c => c !== code)
      : [...currentCodes, code];
    updateRetryCondition('httpStatusCodes', newCodes);
  };

  const toggleResetCode = (code: string) => {
    const currentCodes = config.retryOn.resetCodes;
    const newCodes = currentCodes.includes(code)
      ? currentCodes.filter(c => c !== code)
      : [...currentCodes, code];
    updateRetryCondition('resetCodes', newCodes);
  };

  const calculateTotalRetryTime = () => {
    let totalTime = 0;
    let currentInterval = config.backoff.baseInterval;
    
    for (let i = 0; i < config.maxRetries; i++) {
      totalTime += Math.min(currentInterval, config.backoff.maxInterval);
      currentInterval *= config.backoff.multiplier;
    }
    
    return totalTime / 1000; // Convert to seconds
  };

  const getRetryTimelineSteps = (): Array<{ attempt: number; delay: number; cumulative: number }> => {
    const steps: Array<{ attempt: number; delay: number; cumulative: number }> = [];
    let currentInterval = config.backoff.baseInterval;
    
    for (let i = 0; i < Math.min(config.maxRetries, 5); i++) {
      const actualInterval = Math.min(currentInterval, config.backoff.maxInterval);
      steps.push({
        attempt: i + 1,
        delay: actualInterval / 1000,
        cumulative: steps.reduce((sum, step) => sum + step.delay, actualInterval / 1000)
      });
      currentInterval *= config.backoff.multiplier;
    }
    
    return steps;
  };

  const filteredTargets = targetOptions.filter(target => target.type === config.targetType);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <RefreshIcon color="primary" />
          <Typography variant="h5">Retry Policy Configuration</Typography>
          <ContextualHelp topic="gateway" variant="tooltip" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure automatic retry behavior for failed requests to improve reliability
        </Typography>
      </Box>

      {/* Basic Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Policy Configuration"
          subheader="Basic settings for your retry policy"
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
                helperText={errors.name || 'Unique name for this retry policy'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Namespace"
                value={config.namespace}
                onChange={(e) => setConfig(prev => ({ ...prev, namespace: e.target.value }))}
                helperText="Kubernetes namespace for the policy"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={config.targetType}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    targetType: e.target.value as 'Gateway' | 'HTTPRoute',
                    targetName: ''
                  }))}
                  label="Target Type"
                >
                  <MenuItem value="Gateway">Gateway</MenuItem>
                  <MenuItem value="HTTPRoute">HTTPRoute</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.targetName}>
                <InputLabel>Target Resource</InputLabel>
                <Select
                  value={config.targetName}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetName: e.target.value }))}
                  label="Target Resource"
                >
                  {filteredTargets.map((target) => (
                    <MenuItem key={target.name} value={target.name}>
                      {target.name} ({target.namespace})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={config.description || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
                helperText="Optional description for this retry policy"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Retry Settings */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Retry Settings"
          subheader="Configure retry attempts and timing"
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label="Enable Retries"
            />
          }
        />
        {config.enabled && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  Maximum Retry Attempts
                  <QuickHelp 
                    title="Max Retries"
                    description="Total number of retry attempts. Higher values increase resilience but may delay failure detection."
                  />
                </Typography>
                <Slider
                  value={config.maxRetries}
                  onChange={(_, value) => setConfig(prev => ({ ...prev, maxRetries: value as number }))}
                  min={0}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="on"
                  sx={{ mt: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">No retries</Typography>
                  <Typography variant="caption">Maximum (10)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Per-Try Timeout"
                  type="number"
                  value={config.perTryTimeout}
                  onChange={(e) => setConfig(prev => ({ ...prev, perTryTimeout: parseInt(e.target.value) || 0 }))}
                  error={!!errors.perTryTimeout}
                  helperText={errors.perTryTimeout || 'Timeout for each individual retry attempt'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">seconds</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>

            {/* Retry Timeline Preview */}
            {config.maxRetries > 0 && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Retry Timeline Preview
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Total max time: {calculateTotalRetryTime().toFixed(1)}s with {config.maxRetries} retries
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {getRetryTimelineSteps().map((step) => (
                    <Chip 
                      key={step.attempt}
                      label={`Retry ${step.attempt}: +${step.delay.toFixed(1)}s`}
                      size="small"
                      variant="outlined"
                      icon={<TimelineIcon />}
                    />
                  ))}
                </Box>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Retry Conditions */}
      {config.enabled && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Retry Conditions"
            subheader="Define when retries should be attempted"
          />
          <CardContent>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="subtitle1">HTTP Status Codes</Typography>
                  <Chip 
                    label={`${config.retryOn.httpStatusCodes.length} selected`} 
                    size="small" 
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select HTTP status codes that should trigger retries:
                </Typography>
                <FormGroup>
                  <Grid container spacing={1}>
                    {COMMON_HTTP_STATUS_CODES.map((status) => (
                      <Grid item xs={12} sm={6} md={4} key={status.code}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={config.retryOn.httpStatusCodes.includes(status.code)}
                              onChange={() => toggleHttpStatusCode(status.code)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{status.code}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {status.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="subtitle1">Connection Reset Codes</Typography>
                  <Chip 
                    label={`${config.retryOn.resetCodes.length} selected`} 
                    size="small" 
                    color="warning"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select connection reset conditions that should trigger retries:
                </Typography>
                <FormGroup>
                  {RESET_CODES.map((reset) => (
                    <FormControlLabel
                      key={reset.code}
                      control={
                        <Checkbox
                          checked={config.retryOn.resetCodes.includes(reset.code)}
                          onChange={() => toggleResetCode(reset.code)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{reset.code}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reset.description}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Backoff Strategy */}
      {config.enabled && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Backoff Strategy"
            subheader="Configure retry timing and intervals"
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Base Interval"
                  type="number"
                  value={config.backoff.baseInterval}
                  onChange={(e) => updateBackoffStrategy('baseInterval', parseInt(e.target.value) || 0)}
                  error={!!errors.baseInterval}
                  helperText={errors.baseInterval || 'Initial retry delay'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ms</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Interval"
                  type="number"
                  value={config.backoff.maxInterval}
                  onChange={(e) => updateBackoffStrategy('maxInterval', parseInt(e.target.value) || 0)}
                  error={!!errors.maxInterval}
                  helperText={errors.maxInterval || 'Maximum retry delay'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ms</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Backoff Multiplier"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={config.backoff.multiplier}
                  onChange={(e) => updateBackoffStrategy('multiplier', parseFloat(e.target.value) || 0)}
                  error={!!errors.multiplier}
                  helperText={errors.multiplier || 'Exponential backoff multiplier'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.backoff.jitter}
                      onChange={(e) => updateBackoffStrategy('jitter', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Enable Jitter</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add randomness to prevent thundering herd
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔄 Exponential Backoff Formula
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                delay = min(base_interval × multiplier^attempt, max_interval)
                {config.backoff.jitter && ' + random_jitter'}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Configuration Preview</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box 
            component="pre" 
            sx={{ 
              bgcolor: 'background.default', 
              p: 2, 
              borderRadius: 1, 
              overflow: 'auto',
              fontSize: '0.875rem'
            }}
          >
            {JSON.stringify(config, null, 2)}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={saving || Object.keys(errors).length > 0}
        >
          {saving ? 'Saving...' : 'Save Retry Policy'}
        </Button>
      </Box>

      {/* Best Practices */}
      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          ✅ Best Practices
        </Typography>
        <List dense>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Use conservative retry counts (2-3) for most APIs"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Enable jitter to prevent thundering herd effects"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Only retry idempotent operations (GET, PUT, DELETE)"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Set per-try timeouts shorter than total request timeout"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Alert>
    </Box>
  );
};

export default RetryPolicyConfiguration;