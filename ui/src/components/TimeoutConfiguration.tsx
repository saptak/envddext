import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Chip,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Timer as TimerIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { ContextualHelp, QuickHelp } from './ContextualHelp';

// Timeout configuration interfaces
export interface TimeoutConfig {
  request?: {
    enabled: boolean;
    timeout: number;
    unit: 'seconds' | 'minutes';
  };
  idle?: {
    enabled: boolean;
    timeout: number;
    unit: 'seconds' | 'minutes';
  };
  stream?: {
    enabled: boolean;
    timeout: number;
    unit: 'seconds' | 'minutes';
  };
  backend?: {
    enabled: boolean;
    connectTimeout: number;
    responseTimeout: number;
    unit: 'seconds' | 'minutes';
  };
}

export interface ResiliencePolicyConfig {
  name: string;
  namespace: string;
  targetType: 'Gateway' | 'HTTPRoute';
  targetName: string;
  timeouts: TimeoutConfig;
  description?: string;
}

interface TimeoutConfigurationProps {
  initialConfig?: ResiliencePolicyConfig;
  onSave: (config: ResiliencePolicyConfig) => Promise<void>;
  onCancel: () => void;
  targetOptions: Array<{ name: string; type: 'Gateway' | 'HTTPRoute'; namespace: string }>;
}

const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  request: {
    enabled: false,
    timeout: 30,
    unit: 'seconds'
  },
  idle: {
    enabled: false,
    timeout: 5,
    unit: 'minutes'
  },
  stream: {
    enabled: false,
    timeout: 0,
    unit: 'seconds'
  },
  backend: {
    enabled: false,
    connectTimeout: 10,
    responseTimeout: 30,
    unit: 'seconds'
  }
};

const TimeoutCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  config: any;
  onConfigChange: (config: any) => void;
  helpTopic?: string;
  recommendations?: string[];
}> = ({ title, description, icon, config, onConfigChange, helpTopic, recommendations }) => {
  
  const handleToggle = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handleTimeoutChange = (field: string, value: number | string) => {
    onConfigChange({ ...config, [field]: value });
  };

  const getRecommendedIcon = (timeout: number, unit: string) => {
    const timeoutInSeconds = unit === 'minutes' ? timeout * 60 : timeout;
    
    if (timeoutInSeconds < 5) return <WarningIcon color="warning" />;
    if (timeoutInSeconds > 300) return <InfoIcon color="info" />;
    return <CheckIcon color="success" />;
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={icon}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{title}</Typography>
            {helpTopic && <ContextualHelp topic={helpTopic as any} variant="tooltip" />}
          </Box>
        }
        subheader={description}
        action={
          <FormControlLabel
            control={
              <Switch
                checked={config.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                color="primary"
              />
            }
            label="Enable"
          />
        }
      />
      
      {config.enabled && (
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            {config.timeout !== undefined && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timeout"
                  type="number"
                  value={config.timeout}
                  onChange={(e) => handleTimeoutChange('timeout', parseInt(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={config.unit}
                            onChange={(e) => handleTimeoutChange('unit', e.target.value)}
                          >
                            <MenuItem value="seconds">sec</MenuItem>
                            <MenuItem value="minutes">min</MenuItem>
                          </Select>
                        </FormControl>
                      </InputAdornment>
                    ),
                    startAdornment: (
                      <InputAdornment position="start">
                        {getRecommendedIcon(config.timeout, config.unit)}
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            )}
            
            {config.connectTimeout !== undefined && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Connect Timeout"
                    type="number"
                    value={config.connectTimeout}
                    onChange={(e) => handleTimeoutChange('connectTimeout', parseInt(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={config.unit}
                              onChange={(e) => handleTimeoutChange('unit', e.target.value)}
                            >
                              <MenuItem value="seconds">sec</MenuItem>
                              <MenuItem value="minutes">min</MenuItem>
                            </Select>
                          </FormControl>
                        </InputAdornment>
                      ),
                      startAdornment: (
                        <InputAdornment position="start">
                          {getRecommendedIcon(config.connectTimeout, config.unit)}
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Response Timeout"
                    type="number"
                    value={config.responseTimeout}
                    onChange={(e) => handleTimeoutChange('responseTimeout', parseInt(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={config.unit}
                              onChange={(e) => handleTimeoutChange('unit', e.target.value)}
                            >
                              <MenuItem value="seconds">sec</MenuItem>
                              <MenuItem value="minutes">min</MenuItem>
                            </Select>
                          </FormControl>
                        </InputAdornment>
                      ),
                      startAdornment: (
                        <InputAdornment position="start">
                          {getRecommendedIcon(config.responseTimeout, config.unit)}
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {recommendations && recommendations.length > 0 && config.enabled && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                💡 Recommendations:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recommendations.map((rec, index) => (
                  <Chip key={index} label={rec} size="small" variant="outlined" />
                ))}
              </Box>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const TimeoutConfiguration: React.FC<TimeoutConfigurationProps> = ({
  initialConfig,
  onSave,
  onCancel,
  targetOptions
}) => {
  const [config, setConfig] = useState<ResiliencePolicyConfig>({
    name: '',
    namespace: 'default',
    targetType: 'HTTPRoute',
    targetName: '',
    timeouts: DEFAULT_TIMEOUT_CONFIG,
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

    // Validate timeout values
    Object.entries(config.timeouts).forEach(([key, timeoutConfig]) => {
      if (timeoutConfig.enabled) {
        if (key === 'backend') {
          if (timeoutConfig.connectTimeout <= 0) {
            newErrors[`${key}.connectTimeout`] = 'Connect timeout must be greater than 0';
          }
          if (timeoutConfig.responseTimeout <= 0) {
            newErrors[`${key}.responseTimeout`] = 'Response timeout must be greater than 0';
          }
        } else if (timeoutConfig.timeout <= 0) {
          newErrors[`${key}.timeout`] = 'Timeout must be greater than 0';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;

    setSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      console.error('Failed to save timeout configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateTimeout = (section: keyof TimeoutConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      timeouts: {
        ...prev.timeouts,
        [section]: {
          ...prev.timeouts[section],
          ...updates
        }
      }
    }));
  };

  const filteredTargets = targetOptions.filter(target => target.type === config.targetType);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TimerIcon color="primary" />
          <Typography variant="h5">Timeout Configuration</Typography>
          <ContextualHelp topic="gateway" variant="tooltip" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure timeout policies to improve resilience and prevent resource exhaustion
        </Typography>
      </Box>

      {/* Basic Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Policy Configuration"
          subheader="Basic settings for your timeout policy"
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
                helperText={errors.name || 'Unique name for this timeout policy'}
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
                    targetName: '' // Reset target name when type changes
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
                helperText="Optional description for this timeout policy"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timeout Configurations */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SpeedIcon color="primary" />
        Timeout Settings
      </Typography>

      <TimeoutCard
        title="Request Timeout"
        description="Maximum time to wait for a complete request/response cycle"
        icon={<TimerIcon color="primary" />}
        config={config.timeouts.request}
        onConfigChange={(updates) => updateTimeout('request', updates)}
        recommendations={[
          '30s for API endpoints',
          '60s for file uploads',
          '10s for health checks'
        ]}
      />

      <TimeoutCard
        title="Idle Timeout"
        description="Maximum time a connection can remain idle before being closed"
        icon={<TimerIcon color="secondary" />}
        config={config.timeouts.idle}
        onConfigChange={(updates) => updateTimeout('idle', updates)}
        recommendations={[
          '5min for persistent connections',
          '1min for high-traffic APIs',
          '15min for interactive sessions'
        ]}
      />

      <TimeoutCard
        title="Stream Timeout"
        description="Timeout for streaming connections (0 = disabled)"
        icon={<TimerIcon color="info" />}
        config={config.timeouts.stream}
        onConfigChange={(updates) => updateTimeout('stream', updates)}
        recommendations={[
          '0s to disable for infinite streams',
          '30min for file streaming',
          '5min for real-time updates'
        ]}
      />

      <TimeoutCard
        title="Backend Timeouts"
        description="Connection and response timeouts for upstream services"
        icon={<TimerIcon color="warning" />}
        config={config.timeouts.backend}
        onConfigChange={(updates) => updateTimeout('backend', updates)}
        recommendations={[
          'Connect: 10s typical',
          'Response: 30s for APIs',
          'Response: 120s for processing'
        ]}
      />

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
          {saving ? 'Saving...' : 'Save Timeout Policy'}
        </Button>
      </Box>

      {/* Information Alert */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          ℹ️ About Timeout Policies
        </Typography>
        <Typography variant="body2">
          Timeout policies help prevent resource exhaustion and improve user experience by ensuring requests don't hang indefinitely. 
          Configure timeouts based on your application's expected response times and user tolerance.
        </Typography>
      </Alert>
    </Box>
  );
};

export default TimeoutConfiguration;