import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  GatewayFormData,
  GatewayListenerFormData,
  DEFAULT_GATEWAY_FORM_DATA,
  SUPPORTED_PROTOCOLS,
  SUPPORTED_TLS_MODES,
  ALLOWED_ROUTES_FROM_OPTIONS,
  SUPPORTED_ROUTE_KINDS
} from '../types/gateway';
import { validateGatewayForm, getFieldError, hasFieldError } from '../utils/gatewayValidation';
import { createGateway, listGatewayClasses, listNamespaceNames } from '../helper/kubernetes';

const ddClient = createDockerDesktopClient();

interface GatewayCreationFormProps {
  onSuccess: (gateway: any) => void;
  onCancel: () => void;
}

export const GatewayCreationForm: React.FC<GatewayCreationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<GatewayFormData>(DEFAULT_GATEWAY_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Available options
  const [gatewayClasses, setGatewayClasses] = useState<string[]>(['envoy-gateway']);
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    try {
      setLoading(true);
      
      // Load gateway classes
      const classes = await listGatewayClasses(ddClient);
      const classNames = classes.map(gc => gc.metadata.name);
      if (classNames.length > 0) {
        setGatewayClasses(classNames);
      }

      // Load namespaces
      const namespaceNames = await listNamespaceNames(ddClient);
      setNamespaces(namespaceNames);
    } catch (error) {
      console.error('Error loading form options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GatewayFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleListenerChange = (index: number, field: keyof GatewayListenerFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      listeners: prev.listeners.map((listener, i) => 
        i === index ? { ...listener, [field]: value } : listener
      )
    }));

    // Clear validation errors for this listener field
    const fieldName = `listeners[${index}].${field}`;
    setValidationErrors(prev => prev.filter(error => error.field !== fieldName));
  };

  const addListener = () => {
    const newListener: GatewayListenerFormData = {
      name: `listener-${formData.listeners.length + 1}`,
      port: 80,
      protocol: 'HTTP',
      allowedRoutesFrom: 'Same',
      allowedRouteKinds: ['HTTPRoute']
    };

    setFormData(prev => ({
      ...prev,
      listeners: [...prev.listeners, newListener]
    }));
  };

  const removeListener = (index: number) => {
    if (formData.listeners.length > 1) {
      setFormData(prev => ({
        ...prev,
        listeners: prev.listeners.filter((_, i) => i !== index)
      }));
    }
  };

  const handleRouteKindToggle = (listenerIndex: number, routeKind: string) => {
    const listener = formData.listeners[listenerIndex];
    const currentKinds = listener.allowedRouteKinds;
    
    let newKinds;
    if (currentKinds.includes(routeKind)) {
      newKinds = currentKinds.filter(kind => kind !== routeKind);
    } else {
      newKinds = [...currentKinds, routeKind];
    }

    handleListenerChange(listenerIndex, 'allowedRouteKinds', newKinds);
  };

  const handleSubmit = async () => {
    // Validate form
    const validation = validateGatewayForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createGateway(ddClient, formData);
      
      if (result.success) {
        onSuccess(result.gateway);
      } else {
        setSubmitError(result.error || 'Failed to create Gateway');
      }
    } catch (error: any) {
      setSubmitError(typeof error === 'string' ? error : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Create Gateway
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new Gateway resource to expose services through Envoy Gateway.
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Gateway Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={hasFieldError(validationErrors, 'name')}
            helperText={getFieldError(validationErrors, 'name')}
            placeholder="my-gateway"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={hasFieldError(validationErrors, 'namespace')}>
            <InputLabel>Namespace</InputLabel>
            <Select
              value={formData.namespace}
              onChange={(e) => handleInputChange('namespace', e.target.value)}
              label="Namespace"
            >
              {namespaces.map(ns => (
                <MenuItem key={ns} value={ns}>{ns}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth error={hasFieldError(validationErrors, 'gatewayClassName')}>
            <InputLabel>Gateway Class</InputLabel>
            <Select
              value={formData.gatewayClassName}
              onChange={(e) => handleInputChange('gatewayClassName', e.target.value)}
              label="Gateway Class"
            >
              {gatewayClasses.map(gc => (
                <MenuItem key={gc} value={gc}>{gc}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Listeners */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Listeners
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addListener}
              variant="outlined"
              size="small"
            >
              Add Listener
            </Button>
          </Box>

          {formData.listeners.map((listener, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1">
                    {listener.name || `Listener ${index + 1}`} - {listener.protocol}:{listener.port}
                  </Typography>
                  {formData.listeners.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeListener(index);
                      }}
                      sx={{ ml: 'auto', mr: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Listener Name"
                      value={listener.name}
                      onChange={(e) => handleListenerChange(index, 'name', e.target.value)}
                      error={hasFieldError(validationErrors, `listeners[${index}].name`)}
                      helperText={getFieldError(validationErrors, `listeners[${index}].name`)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Port"
                      type="number"
                      value={listener.port}
                      onChange={(e) => handleListenerChange(index, 'port', parseInt(e.target.value) || 0)}
                      error={hasFieldError(validationErrors, `listeners[${index}].port`)}
                      helperText={getFieldError(validationErrors, `listeners[${index}].port`)}
                      inputProps={{ min: 1, max: 65535 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Protocol</InputLabel>
                      <Select
                        value={listener.protocol}
                        onChange={(e) => handleListenerChange(index, 'protocol', e.target.value)}
                        label="Protocol"
                      >
                        {SUPPORTED_PROTOCOLS.map(protocol => (
                          <MenuItem key={protocol} value={protocol}>{protocol}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {listener.protocol === 'HTTPS' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>TLS Mode</InputLabel>
                          <Select
                            value={listener.tlsMode || ''}
                            onChange={(e) => handleListenerChange(index, 'tlsMode', e.target.value)}
                            label="TLS Mode"
                          >
                            {SUPPORTED_TLS_MODES.map(mode => (
                              <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {listener.tlsMode === 'Terminate' && (
                        <>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Certificate Name"
                              value={listener.certificateName || ''}
                              onChange={(e) => handleListenerChange(index, 'certificateName', e.target.value)}
                              error={hasFieldError(validationErrors, `listeners[${index}].certificateName`)}
                              helperText={getFieldError(validationErrors, `listeners[${index}].certificateName`)}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Certificate Namespace (optional)"
                              value={listener.certificateNamespace || ''}
                              onChange={(e) => handleListenerChange(index, 'certificateNamespace', e.target.value)}
                            />
                          </Grid>
                        </>
                      )}
                    </>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Hostname (optional)"
                      value={listener.hostname || ''}
                      onChange={(e) => handleListenerChange(index, 'hostname', e.target.value)}
                      error={hasFieldError(validationErrors, `listeners[${index}].hostname`)}
                      helperText={getFieldError(validationErrors, `listeners[${index}].hostname`) || 'e.g., example.com or *.example.com'}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Allowed Routes From</InputLabel>
                      <Select
                        value={listener.allowedRoutesFrom}
                        onChange={(e) => handleListenerChange(index, 'allowedRoutesFrom', e.target.value)}
                        label="Allowed Routes From"
                      >
                        {ALLOWED_ROUTES_FROM_OPTIONS.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Allowed Route Kinds
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {SUPPORTED_ROUTE_KINDS.map(kind => (
                        <Chip
                          key={kind}
                          label={kind}
                          clickable
                          color={listener.allowedRouteKinds.includes(kind) ? 'primary' : 'default'}
                          onClick={() => handleRouteKindToggle(index, kind)}
                          variant={listener.allowedRouteKinds.includes(kind) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>

        {/* Advanced Options */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="Show Advanced Options"
          />
        </Grid>

        {showAdvanced && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Options
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Labels (key=value, one per line)"
                multiline
                rows={3}
                value={formData.labels ? Object.entries(formData.labels).map(([k, v]) => `${k}=${v}`).join('\n') : ''}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter(line => line.trim());
                  const labels: Record<string, string> = {};
                  lines.forEach(line => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                      labels[key.trim()] = valueParts.join('=').trim();
                    }
                  });
                  handleInputChange('labels', Object.keys(labels).length > 0 ? labels : undefined);
                }}
                helperText="Enter labels as key=value pairs, one per line"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Annotations (key=value, one per line)"
                multiline
                rows={3}
                value={formData.annotations ? Object.entries(formData.annotations).map(([k, v]) => `${k}=${v}`).join('\n') : ''}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter(line => line.trim());
                  const annotations: Record<string, string> = {};
                  lines.forEach(line => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                      annotations[key.trim()] = valueParts.join('=').trim();
                    }
                  });
                  handleInputChange('annotations', Object.keys(annotations).length > 0 ? annotations : undefined);
                }}
                helperText="Enter annotations as key=value pairs, one per line"
              />
            </Grid>
          </>
        )}

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            >
              {isSubmitting ? 'Creating...' : 'Create Gateway'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
