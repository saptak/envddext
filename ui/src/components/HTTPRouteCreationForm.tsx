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
  Alert,
  CircularProgress,
  Divider,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  HTTPRouteFormData,
  HTTPRouteRuleFormData,
  HTTPRouteMatchFormData,
  HTTPBackendRefFormData,
  DEFAULT_HTTPROUTE_FORM_DATA,
  SUPPORTED_PATH_TYPES,
  SUPPORTED_HTTP_METHODS,
  ValidationError
} from '../types/httproute';
import {
  createHTTPRoute,
  validateHTTPRouteConfiguration,
  getAvailableGateways,
  getAvailableServices,
  checkGatewayCompatibility,
  listNamespaceNames
} from '../helper/kubernetes';
import { HTTPRoute } from '../types/httproute';

const ddClient = createDockerDesktopClient();

interface HTTPRouteCreationFormProps {
  onSuccess: (httpRoute: HTTPRoute) => void;
  onCancel: () => void;
}

export const HTTPRouteCreationForm: React.FC<HTTPRouteCreationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<HTTPRouteFormData>(DEFAULT_HTTPROUTE_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available options
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>(['default']);
  const [availableGateways, setAvailableGateways] = useState<Array<{ name: string; namespace: string; listeners: string[] }>>([]);
  const [availableServices, setAvailableServices] = useState<Array<{ name: string; namespace: string; ports: Array<{ name?: string; port: number; protocol: string }> }>>([]);
  const [gatewayCompatibility, setGatewayCompatibility] = useState<{ compatible: boolean; message?: string; listeners?: string[] } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.namespace) {
      loadAvailableServices();
    }
  }, [formData.namespace]);

  useEffect(() => {
    if (formData.parentGateway && formData.parentGatewayNamespace) {
      checkGatewayCompat();
    }
  }, [formData.parentGateway, formData.parentGatewayNamespace, formData.namespace]);

  const loadInitialData = async () => {
    try {
      // Load namespaces
      const namespaces = await listNamespaceNames(ddClient);
      setAvailableNamespaces(namespaces);

      // Load available gateways
      const gatewayResult = await getAvailableGateways(ddClient);
      if (!gatewayResult.error) {
        setAvailableGateways(gatewayResult.items);
      }
    } catch (error: any) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadAvailableServices = async () => {
    try {
      const serviceResult = await getAvailableServices(ddClient, formData.namespace);
      if (!serviceResult.error) {
        setAvailableServices(serviceResult.items);
      }
    } catch (error: any) {
      console.error("Error loading services:", error);
    }
  };

  const checkGatewayCompat = async () => {
    try {
      const compatibility = await checkGatewayCompatibility(
        ddClient,
        formData.parentGateway,
        formData.parentGatewayNamespace || formData.namespace,
        formData.namespace
      );
      setGatewayCompatibility(compatibility);
    } catch (error: any) {
      console.error("Error checking gateway compatibility:", error);
    }
  };

  const handleFormChange = (field: keyof HTTPRouteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field));
    setError(null);
  };

  const handleRuleChange = (ruleIndex: number, field: keyof HTTPRouteRuleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === ruleIndex ? { ...rule, [field]: value } : rule
      )
    }));

    // Clear validation errors for this rule field
    const fieldName = `rules[${ruleIndex}].${field}`;
    setValidationErrors(prev => prev.filter(error => error.field !== fieldName));
  };

  const handleMatchChange = (ruleIndex: number, matchIndex: number, field: keyof HTTPRouteMatchFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, ruleI) =>
        ruleI === ruleIndex ? {
          ...rule,
          matches: rule.matches.map((match, matchI) =>
            matchI === matchIndex ? { ...match, [field]: value } : match
          )
        } : rule
      )
    }));
  };

  const handleBackendChange = (ruleIndex: number, backendIndex: number, field: keyof HTTPBackendRefFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, ruleI) =>
        ruleI === ruleIndex ? {
          ...rule,
          backendRefs: rule.backendRefs.map((backend, backendI) =>
            backendI === backendIndex ? { ...backend, [field]: value } : backend
          )
        } : rule
      )
    }));
  };

  const addRule = () => {
    const newRule: HTTPRouteRuleFormData = {
      matches: [
        {
          pathType: 'PathPrefix',
          pathValue: '/',
          headers: [],
          queryParams: []
        }
      ],
      backendRefs: [
        {
          name: '',
          port: 80,
          weight: 100
        }
      ]
    };

    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };

  const removeRule = (index: number) => {
    if (formData.rules.length > 1) {
      setFormData(prev => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index)
      }));
    }
  };

  const addMatch = (ruleIndex: number) => {
    const newMatch: HTTPRouteMatchFormData = {
      pathType: 'PathPrefix',
      pathValue: '/',
      headers: [],
      queryParams: []
    };

    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === ruleIndex ? {
          ...rule,
          matches: [...rule.matches, newMatch]
        } : rule
      )
    }));
  };

  const removeMatch = (ruleIndex: number, matchIndex: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === ruleIndex ? {
          ...rule,
          matches: rule.matches.filter((_, j) => j !== matchIndex)
        } : rule
      )
    }));
  };

  const addBackend = (ruleIndex: number) => {
    const newBackend: HTTPBackendRefFormData = {
      name: '',
      port: 80,
      weight: 100
    };

    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === ruleIndex ? {
          ...rule,
          backendRefs: [...rule.backendRefs, newBackend]
        } : rule
      )
    }));
  };

  const removeBackend = (ruleIndex: number, backendIndex: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === ruleIndex ? {
          ...rule,
          backendRefs: rule.backendRefs.filter((_, j) => j !== backendIndex)
        } : rule
      )
    }));
  };

  const addHostname = () => {
    setFormData(prev => ({
      ...prev,
      hostnames: [...prev.hostnames, '']
    }));
  };

  const removeHostname = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hostnames: prev.hostnames.filter((_, i) => i !== index)
    }));
  };

  const handleHostnameChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      hostnames: prev.hostnames.map((hostname, i) => i === index ? value : hostname)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate form data
      const validation = validateHTTPRouteConfiguration(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Please fix the validation errors before submitting.');
        return;
      }

      // Create HTTPRoute
      const result = await createHTTPRoute(ddClient, formData);

      if (!result.success) {
        setError(result.error || 'Failed to create HTTPRoute');
        return;
      }

      setSuccess('HTTPRoute created successfully!');

      // Notify parent component
      if (result.httpRoute) {
        onSuccess(result.httpRoute);
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    const error = validationErrors.find(e => e.field === fieldName);
    return error?.message;
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {gatewayCompatibility && !gatewayCompatibility.compatible && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Gateway Compatibility Issue: {gatewayCompatibility.message}
        </Alert>
      )}

      {gatewayCompatibility && gatewayCompatibility.compatible && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✓ {gatewayCompatibility.message}
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
            label="HTTPRoute Name"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            error={!!getFieldError('name')}
            helperText={getFieldError('name') || 'Must be a valid DNS subdomain'}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
                '& input': {
                  color: 'text.primary',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
                '&.Mui-focused': {
                  color: 'primary.main',
                },
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'text.primary' }}>Namespace</InputLabel>
            <Select
              value={formData.namespace}
              onChange={(e) => handleFormChange('namespace', e.target.value)}
              label="Namespace"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '& .MuiSelect-select': {
                  color: 'text.primary',
                },
                '& .MuiSvgIcon-root': {
                  color: 'text.primary',
                },
              }}
            >
              {availableNamespaces.map(ns => (
                <MenuItem key={ns} value={ns}>{ns}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Parent Gateway Selection */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Parent Gateway
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'text.primary' }}>Gateway</InputLabel>
            <Select
              value={formData.parentGateway}
              onChange={(e) => {
                const selectedGateway = availableGateways.find(gw => gw.name === e.target.value);
                handleFormChange('parentGateway', e.target.value);
                if (selectedGateway) {
                  handleFormChange('parentGatewayNamespace', selectedGateway.namespace);
                }
              }}
              label="Gateway"
              error={!!getFieldError('parentGateway')}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '& .MuiSelect-select': {
                  color: 'text.primary',
                },
                '& .MuiSvgIcon-root': {
                  color: 'text.primary',
                },
              }}
            >
              {availableGateways.map(gw => (
                <MenuItem key={`${gw.namespace}-${gw.name}`} value={gw.name}>
                  {gw.name} ({gw.namespace})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'text.primary' }}>Gateway Namespace</InputLabel>
            <Select
              value={formData.parentGatewayNamespace || formData.namespace}
              onChange={(e) => handleFormChange('parentGatewayNamespace', e.target.value)}
              label="Gateway Namespace"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '& .MuiSelect-select': {
                  color: 'text.primary',
                },
                '& .MuiSvgIcon-root': {
                  color: 'text.primary',
                },
              }}
            >
              {availableNamespaces.map(ns => (
                <MenuItem key={ns} value={ns}>{ns}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Hostnames */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Hostnames (Optional)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Specify hostnames to match against the Host header. Leave empty to match all hosts.
          </Typography>
        </Grid>

        {formData.hostnames.map((hostname, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                label={`Hostname ${index + 1}`}
                value={hostname}
                onChange={(e) => handleHostnameChange(index, e.target.value)}
                error={!!getFieldError(`hostnames[${index}]`)}
                helperText={getFieldError(`hostnames[${index}]`)}
                placeholder="example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                    '& input': {
                      color: 'text.primary',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    },
                  },
                }}
              />
              <IconButton
                onClick={() => removeHostname(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Button
            startIcon={<AddIcon />}
            onClick={addHostname}
            variant="outlined"
            size="small"
          >
            Add Hostname
          </Button>
        </Grid>

        {/* Rules Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Routing Rules
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Define how HTTP requests should be matched and routed to backend services.
          </Typography>
        </Grid>

        {formData.rules.map((rule, ruleIndex) => (
          <Grid item xs={12} key={ruleIndex}>
            <Accordion defaultExpanded={ruleIndex === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="subtitle1">
                    Rule {ruleIndex + 1}
                    {rule.name && ` (${rule.name})`}
                  </Typography>
                  {formData.rules.length > 1 && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRule(ruleIndex);
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {/* Rule Name */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Rule Name (Optional)"
                      value={rule.name || ''}
                      onChange={(e) => handleRuleChange(ruleIndex, 'name', e.target.value || undefined)}
                      placeholder="read-only, write-only, etc."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                          '& input': {
                            color: 'text.primary',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>

                  {/* Matches Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Match Conditions
                    </Typography>
                    {rule.matches.map((match, matchIndex) => (
                      <Paper key={matchIndex} sx={{ p: 2, mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" fontWeight="medium">
                            Match {matchIndex + 1}
                          </Typography>
                          {rule.matches.length > 1 && (
                            <IconButton
                              onClick={() => removeMatch(ruleIndex, matchIndex)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>

                        <Grid container spacing={2}>
                          {/* Path Matching */}
                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                              <InputLabel sx={{ color: 'text.primary' }}>Path Type</InputLabel>
                              <Select
                                value={match.pathType}
                                onChange={(e) => handleMatchChange(ruleIndex, matchIndex, 'pathType', e.target.value)}
                                label="Path Type"
                                sx={{
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                  },
                                  '& .MuiSelect-select': {
                                    color: 'text.primary',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color: 'text.primary',
                                  },
                                }}
                              >
                                {SUPPORTED_PATH_TYPES.map(type => (
                                  <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Path Value"
                              value={match.pathValue}
                              onChange={(e) => handleMatchChange(ruleIndex, matchIndex, 'pathValue', e.target.value)}
                              error={!!getFieldError(`rules[${ruleIndex}].matches[${matchIndex}].pathValue`)}
                              helperText={getFieldError(`rules[${ruleIndex}].matches[${matchIndex}].pathValue`)}
                              placeholder="/api/v1"
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                  },
                                  '& input': {
                                    color: 'text.primary',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'text.secondary',
                                  '&.Mui-focused': {
                                    color: 'primary.main',
                                  },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                              <InputLabel sx={{ color: 'text.primary' }}>HTTP Method (Optional)</InputLabel>
                              <Select
                                value={match.method || ''}
                                onChange={(e) => handleMatchChange(ruleIndex, matchIndex, 'method', e.target.value || undefined)}
                                label="HTTP Method (Optional)"
                                sx={{
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                  },
                                  '& .MuiSelect-select': {
                                    color: 'text.primary',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color: 'text.primary',
                                  },
                                }}
                              >
                                <MenuItem value="">Any Method</MenuItem>
                                {SUPPORTED_HTTP_METHODS.map(method => (
                                  <MenuItem key={method} value={method}>{method}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}

                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => addMatch(ruleIndex)}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                    >
                      Add Match Condition
                    </Button>
                  </Grid>

                  {/* Backend References */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Backend Services
                    </Typography>
                    {rule.backendRefs.map((backend, backendIndex) => (
                      <Paper key={backendIndex} sx={{ p: 2, mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" fontWeight="medium">
                            Backend {backendIndex + 1}
                          </Typography>
                          {rule.backendRefs.length > 1 && (
                            <IconButton
                              onClick={() => removeBackend(ruleIndex, backendIndex)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Autocomplete
                              options={availableServices.map(svc => svc.name)}
                              value={backend.name}
                              onChange={(_, value) => handleBackendChange(ruleIndex, backendIndex, 'name', value || '')}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Service Name"
                                  error={!!getFieldError(`rules[${ruleIndex}].backendRefs[${backendIndex}].name`)}
                                  helperText={getFieldError(`rules[${ruleIndex}].backendRefs[${backendIndex}].name`)}
                                  required
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)',
                                      },
                                      '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: 'primary.main',
                                      },
                                      '& input': {
                                        color: 'text.primary',
                                      },
                                    },
                                    '& .MuiInputLabel-root': {
                                      color: 'text.secondary',
                                      '&.Mui-focused': {
                                        color: 'primary.main',
                                      },
                                    },
                                  }}
                                />
                              )}
                              freeSolo
                              sx={{
                                '& .MuiAutocomplete-popupIndicator': {
                                  color: 'text.primary',
                                },
                                '& .MuiAutocomplete-clearIndicator': {
                                  color: 'text.primary',
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Port"
                              type="number"
                              value={backend.port}
                              onChange={(e) => handleBackendChange(ruleIndex, backendIndex, 'port', parseInt(e.target.value) || 80)}
                              error={!!getFieldError(`rules[${ruleIndex}].backendRefs[${backendIndex}].port`)}
                              helperText={getFieldError(`rules[${ruleIndex}].backendRefs[${backendIndex}].port`)}
                              inputProps={{ min: 1, max: 65535 }}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                  },
                                  '& input': {
                                    color: 'text.primary',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'text.secondary',
                                  '&.Mui-focused': {
                                    color: 'primary.main',
                                  },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Weight"
                              type="number"
                              value={backend.weight}
                              onChange={(e) => handleBackendChange(ruleIndex, backendIndex, 'weight', parseInt(e.target.value) || 100)}
                              error={!!getFieldError(`rules[${ruleIndex}].backendRefs[${backendIndex}].weight`)}
                              helperText={getFieldError(`rules[${ruleIndex}].backendRefs[${backendIndex}].weight`) || 'For traffic splitting'}
                              inputProps={{ min: 0, max: 1000000 }}
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                  },
                                  '& input': {
                                    color: 'text.primary',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'text.secondary',
                                  '&.Mui-focused': {
                                    color: 'primary.main',
                                  },
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}

                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => addBackend(ruleIndex)}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                    >
                      Add Backend Service
                    </Button>
                  </Grid>

                  {/* Timeouts */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Timeouts (Optional)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Request Timeout"
                          value={rule.requestTimeout || ''}
                          onChange={(e) => handleRuleChange(ruleIndex, 'requestTimeout', e.target.value || undefined)}
                          error={!!getFieldError(`rules[${ruleIndex}].requestTimeout`)}
                          helperText={getFieldError(`rules[${ruleIndex}].requestTimeout`) || 'e.g., 30s, 5m, 1h'}
                          placeholder="30s"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                              },
                              '& input': {
                                color: 'text.primary',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'text.secondary',
                              '&.Mui-focused': {
                                color: 'primary.main',
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Backend Request Timeout"
                          value={rule.backendRequestTimeout || ''}
                          onChange={(e) => handleRuleChange(ruleIndex, 'backendRequestTimeout', e.target.value || undefined)}
                          error={!!getFieldError(`rules[${ruleIndex}].backendRequestTimeout`)}
                          helperText={getFieldError(`rules[${ruleIndex}].backendRequestTimeout`) || 'Must be ≤ request timeout'}
                          placeholder="10s"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                              },
                              '& input': {
                                color: 'text.primary',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'text.secondary',
                              '&.Mui-focused': {
                                color: 'primary.main',
                              },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Button
            startIcon={<AddIcon />}
            onClick={addRule}
            variant="outlined"
            size="small"
          >
            Add Rule
          </Button>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Creating...' : 'Create HTTPRoute'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
