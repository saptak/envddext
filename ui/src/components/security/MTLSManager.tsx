import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Grid,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  VerifiedUser as MTLSIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  AssuredWorkload as CertIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Upload as UploadIcon
} from "@mui/icons-material";

interface MTLSConfig {
  id: string;
  name: string;
  namespace: string;
  targetType: "Gateway";  // mTLS is typically configured at Gateway level
  targetName: string;
  caCertificateSecret: string;
  clientCertificateMode: "optional" | "required";
  trustedCAs: string[];
  crlSecret?: string;
  created: string;
  status: "active" | "pending" | "error";
}

interface MTLSManagerProps {
  onPolicyCreated?: () => void;
}

export const MTLSManager: React.FC<MTLSManagerProps> = ({
  onPolicyCreated
}) => {
  const [configs, setConfigs] = React.useState<MTLSConfig[]>([
    {
      id: "mtls-1",
      name: "secure-gateway-mtls",
      namespace: "default",
      targetType: "Gateway",
      targetName: "secure-gateway",
      caCertificateSecret: "client-ca-secret",
      clientCertificateMode: "required",
      trustedCAs: ["corporate-ca", "partner-ca"],
      created: "2025-06-12T10:30:00Z",
      status: "active"
    }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<MTLSConfig | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeStep, setActiveStep] = React.useState(0);
  const [yamlDialogOpen, setYamlDialogOpen] = React.useState(false);
  const [selectedConfigForYaml, setSelectedConfigForYaml] = React.useState<MTLSConfig | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    namespace: "default",
    targetName: "",
    caCertificateSecret: "",
    clientCertificateMode: "required" as "optional" | "required",
    trustedCAs: [] as string[],
    crlSecret: "",
    createCASecret: true,
    caCertificate: "",
    caPrivateKey: ""
  });

  const steps = [
    "Basic Configuration",
    "CA Certificate Setup", 
    "Client Certificate Validation",
    "Review & Create"
  ];

  const handleCreateNew = () => {
    setEditingConfig(null);
    setFormData({
      name: "",
      namespace: "default",
      targetName: "",
      caCertificateSecret: "",
      clientCertificateMode: "required",
      trustedCAs: [],
      crlSecret: "",
      createCASecret: true,
      caCertificate: "",
      caPrivateKey: ""
    });
    setActiveStep(0);
    setDialogOpen(true);
    setError(null);
  };

  const handleEdit = (config: MTLSConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      namespace: config.namespace,
      targetName: config.targetName,
      caCertificateSecret: config.caCertificateSecret,
      clientCertificateMode: config.clientCertificateMode,
      trustedCAs: [...config.trustedCAs],
      crlSecret: config.crlSecret || "",
      createCASecret: false,
      caCertificate: "",
      caPrivateKey: ""
    });
    setActiveStep(0);
    setDialogOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this mTLS configuration? This will disable client certificate validation.")) {
      setConfigs(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSave = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Validation
      if (!formData.name || !formData.targetName) {
        throw new Error("Name and target Gateway are required");
      }

      if (formData.createCASecret && (!formData.caCertificate || !formData.caPrivateKey)) {
        throw new Error("CA certificate and private key are required when creating a new CA secret");
      }

      if (!formData.createCASecret && !formData.caCertificateSecret) {
        throw new Error("CA certificate secret name is required");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newConfig: MTLSConfig = {
        id: editingConfig?.id || `mtls-${Date.now()}`,
        name: formData.name,
        namespace: formData.namespace,
        targetType: "Gateway",
        targetName: formData.targetName,
        caCertificateSecret: formData.caCertificateSecret || `${formData.name}-ca-secret`,
        clientCertificateMode: formData.clientCertificateMode,
        trustedCAs: [...formData.trustedCAs],
        crlSecret: formData.crlSecret || undefined,
        created: editingConfig?.created || new Date().toISOString(),
        status: "active"
      };

      if (editingConfig) {
        setConfigs(prev => prev.map(c => c.id === editingConfig.id ? newConfig : c));
      } else {
        setConfigs(prev => [...prev, newConfig]);
      }

      setDialogOpen(false);
      if (onPolicyCreated) {
        onPolicyCreated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save mTLS configuration");
    } finally {
      setIsCreating(false);
    }
  };

  const addTrustedCA = (caName: string) => {
    if (caName && !formData.trustedCAs.includes(caName)) {
      setFormData(prev => ({
        ...prev,
        trustedCAs: [...prev.trustedCAs, caName]
      }));
    }
  };

  const removeTrustedCA = (caName: string) => {
    setFormData(prev => ({
      ...prev,
      trustedCAs: prev.trustedCAs.filter(ca => ca !== caName)
    }));
  };

  const generateMTLSYAML = (config: MTLSConfig): string => {
    return `apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: ${config.targetName}
  namespace: ${config.namespace}
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: server-cert-secret  # Server certificate
        options:
          clientValidation:
            caCertificateRefs:
              - name: ${config.caCertificateSecret}
            optional: ${config.clientCertificateMode === 'optional' ? 'true' : 'false'}${config.crlSecret ? `
            crlRef:
              name: ${config.crlSecret}` : ''}`;
  };

  const handleViewYaml = (config: MTLSConfig) => {
    setSelectedConfigForYaml(config);
    setYamlDialogOpen(true);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Configuration Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="secure-gateway-mtls"
                helperText="Unique name for this mTLS configuration"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Namespace"
                value={formData.namespace}
                onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Gateway"
                value={formData.targetName}
                onChange={(e) => setFormData(prev => ({ ...prev, targetName: e.target.value }))}
                placeholder="secure-gateway"
                helperText="Name of the Gateway to configure with mTLS"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" fontWeight="bold">
                  Mutual TLS (mTLS) Overview
                </Typography>
                <Typography variant="body2">
                  mTLS requires both the server and client to present certificates for authentication. 
                  This provides strong identity verification and encrypted communication.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.createCASecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, createCASecret: e.target.checked }))}
                />
              }
              label="Create new CA certificate secret"
              sx={{ mb: 2 }}
            />

            {formData.createCASecret ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="CA Certificate Secret Name"
                    value={formData.caCertificateSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, caCertificateSecret: e.target.value }))}
                    placeholder={`${formData.name}-ca-secret`}
                    helperText="Name for the Kubernetes Secret to store the CA certificate"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="CA Certificate (PEM format)"
                    value={formData.caCertificate}
                    onChange={(e) => setFormData(prev => ({ ...prev, caCertificate: e.target.value }))}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    helperText="Paste the CA certificate that will be used to validate client certificates"
                    sx={{ fontFamily: "monospace" }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="CA Private Key (PEM format)"
                    value={formData.caPrivateKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, caPrivateKey: e.target.value }))}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    helperText="Private key for the CA certificate (if needed for certificate generation)"
                    sx={{ fontFamily: "monospace" }}
                  />
                </Grid>
              </Grid>
            ) : (
              <TextField
                fullWidth
                label="Existing CA Certificate Secret"
                value={formData.caCertificateSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, caCertificateSecret: e.target.value }))}
                placeholder="existing-ca-secret"
                helperText="Name of an existing Kubernetes Secret containing the CA certificate"
              />
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Security Note:</strong> The CA certificate must be trusted by your clients. 
                Store CA private keys securely and consider using a proper PKI infrastructure 
                for production environments.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Client Certificate Validation Settings
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Client Certificate Mode</InputLabel>
              <Select
                value={formData.clientCertificateMode}
                onChange={(e) => setFormData(prev => ({ ...prev, clientCertificateMode: e.target.value as "optional" | "required" }))}
                label="Client Certificate Mode"
              >
                <MenuItem value="required">Required - Reject connections without valid client certificates</MenuItem>
                <MenuItem value="optional">Optional - Allow connections with or without client certificates</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Certificate Revocation List Secret (Optional)"
              value={formData.crlSecret}
              onChange={(e) => setFormData(prev => ({ ...prev, crlSecret: e.target.value }))}
              placeholder="crl-secret"
              helperText="Kubernetes Secret containing Certificate Revocation List (CRL) for checking revoked certificates"
              sx={{ mb: 2 }}
            />

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Client Certificate Requirements
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Client certificates must be signed by the configured CA" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Certificates must not be expired or revoked" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Certificate Subject/SAN should identify the client" />
                </ListItem>
              </List>
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review mTLS Configuration
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Configuration Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Name:</Typography>
                    <Typography variant="body1">{formData.name || "Not specified"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Target Gateway:</Typography>
                    <Typography variant="body1">{formData.targetName || "Not specified"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">CA Secret:</Typography>
                    <Typography variant="body1">{formData.caCertificateSecret || "Not specified"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Client Mode:</Typography>
                    <Typography variant="body1">{formData.clientCertificateMode}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="subtitle2" fontWeight="bold">
                Ready to Configure mTLS
              </Typography>
              <Typography variant="body2">
                Your Gateway will be configured to require client certificates for enhanced security. 
                Make sure your clients have valid certificates signed by the configured CA.
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Configuration Failed
                </Typography>
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MTLSIcon />
            Mutual TLS (mTLS) Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure client certificate authentication for the highest level of security. 
            Requires both server and client certificates for mutual authentication.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Configure mTLS
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Advanced Security Feature
        </Typography>
        <Typography variant="body2">
          mTLS provides the strongest authentication but requires careful certificate management. 
          Ensure you have a proper PKI infrastructure and client certificate distribution strategy 
          before implementing in production.
        </Typography>
      </Alert>

      {/* Configuration List */}
      <Grid container spacing={2}>
        {configs.map((config) => (
          <Grid item xs={12} md={6} key={config.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {config.name}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={config.status} 
                      color={config.status === "active" ? "success" : config.status === "error" ? "error" : "warning"}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <MTLSIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Gateway: {config.targetName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  CA Secret: {config.caCertificateSecret}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Mode:
                  </Typography>
                  <Chip 
                    size="small" 
                    label={config.clientCertificateMode.toUpperCase()}
                    color={config.clientCertificateMode === "required" ? "error" : "warning"}
                    icon={<SecurityIcon />}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(config.created).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(config)}
                >
                  Edit
                </Button>
                <Button 
                  size="small" 
                  startIcon={<ViewIcon />}
                  onClick={() => handleViewYaml(config)}
                >
                  View YAML
                </Button>
                <Button 
                  size="small" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(config.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {configs.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <MTLSIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No mTLS Configurations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure mutual TLS to require client certificates for the highest level of security.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Configure mTLS
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? "Edit mTLS Configuration" : "Configure Mutual TLS (mTLS)"}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSave : handleNext}
                      disabled={isCreating}
                      sx={{ mr: 1 }}
                    >
                      {index === steps.length - 1 ? 
                        (isCreating ? "Configuring..." : "Configure mTLS") : 
                        "Continue"
                      }
                    </Button>
                    <Button
                      disabled={index === 0 || isCreating}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* YAML View Dialog */}
      <Dialog
        open={yamlDialogOpen}
        onClose={() => setYamlDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>mTLS Gateway Configuration YAML</DialogTitle>
        <DialogContent>
          {selectedConfigForYaml && (
            <Paper
              sx={{
                p: 2,
                backgroundColor: "grey.900",
                color: "common.white",
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "500px",
                overflow: "auto",
                ...(theme => theme.palette.mode === 'light' && {
                  backgroundColor: 'grey.100',
                  color: 'text.primary'
                })
              }}
            >
              <Typography
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {generateMTLSYAML(selectedConfigForYaml)}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYamlDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};