import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VpnKey as CertificateIcon,
  Warning as WarningIcon,
  CloudDownload as CloudDownloadIcon, // Added for install button
} from "@mui/icons-material";
import { createDockerDesktopClient } from "@docker/extension-api-client";

const ddClient = createDockerDesktopClient();
const CERT_MANAGER_VERSION = "v1.14.5";
const CERT_MANAGER_INSTALL_URL = `https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml`;


export interface Certificate {
  name: string;
  namespace: string;
  secretName: string;
  dnsNames: string[];
  issuer: string;
  status: "ready" | "pending" | "failed";
  expirationDate?: string;
  createdAt: string;
}

interface CertificateManagerProps {
  onCertificateCreated?: (certificate: Certificate) => void;
  selectedNamespace?: string;
}

export function CertificateManager({ onCertificateCreated, selectedNamespace = "demo" }: CertificateManagerProps) {
  const [certificates, setCertificates] = React.useState<Certificate[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null);
  const [certificateYaml, setCertificateYaml] = React.useState<string>("");

  // State for CRD check and installation
  const [crdCheckStatus, setCrdCheckStatus] = React.useState<
    "pending" | "checking" | "checked_missing" | "checked_present" | "installing" | "install_failed"
  >("pending");

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    namespace: selectedNamespace,
    dnsNames: ["example.com"],
    issuerType: "self-signed" as "self-signed" | "ca-issuer",
    customIssuer: "",
  });

  const [creating, setCreating] = React.useState<boolean>(false);

  const fetchCertificates = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if ddClient extension host CLI is available
      if (!ddClient?.extension?.host?.cli?.exec) {
        throw new Error("Docker Desktop CLI interface not available");
      }

      // Fetch certificates from the cluster
      const result = await ddClient.extension.host.cli.exec("kubectl", [
        "get", "certificates", 
        "--all-namespaces", 
        "-o", "json"
      ]);

      if (result.stderr) {
        throw new Error(result.stderr);
      }

      const response = JSON.parse(result.stdout);
      const certs: Certificate[] = response.items?.map((cert: any) => ({
        name: cert.metadata.name,
        namespace: cert.metadata.namespace,
        secretName: cert.spec.secretName,
        dnsNames: cert.spec.dnsNames || [],
        issuer: cert.spec.issuerRef?.name || "unknown",
        status: cert.status?.conditions?.find((c: any) => c.type === "Ready")?.status === "True" ? "ready" : "pending",
        expirationDate: cert.status?.expirationTime,
        createdAt: cert.metadata.creationTimestamp,
      })) || [];

      setCertificates(certs);
    } catch (err: any) {
      console.error("Error fetching certificates:", err);
      setError(err.message || "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  }, []); // Removed fetchCertificates from dependencies as it's called conditionally

  const checkCrdsExist = React.useCallback(async () => {
    setCrdCheckStatus("checking");
    setError(null); // Clear previous general errors
    try {
      if (!ddClient?.extension?.host?.cli?.exec) {
        throw new Error("Docker Desktop CLI interface not available for CRD check.");
      }
      await ddClient.extension.host.cli.exec("kubectl", ["get", "crd", "certificates.cert-manager.io"]);
      setCrdCheckStatus("checked_present");
      fetchCertificates(); // CRDs exist, now fetch the list of Certificate resources
    } catch (err: any) {
      if (err.message && (err.message.includes("NotFound") || err.message.includes("not found"))) {
        setCrdCheckStatus("checked_missing");
        setError(`Cert-manager CRDs (certificates.cert-manager.io) not found. Please install cert-manager to manage TLS certificates.`);
      } else {
        console.error("Error checking CRDs:", err);
        setCrdCheckStatus("checked_missing"); // Treat other errors as CRDs potentially missing or inaccessible
        setError(err.message || "Failed to check for cert-manager CRDs. Ensure kubectl is configured correctly.");
      }
    }
  }, [fetchCertificates]);

  React.useEffect(() => {
    if (crdCheckStatus === "pending") {
      checkCrdsExist();
    }
  }, [crdCheckStatus, checkCrdsExist]);

  const handleInstallCertManager = async () => {
    setCrdCheckStatus("installing");
    setError(null);
    try {
      if (!ddClient?.extension?.host?.cli?.exec) {
        throw new Error("Docker Desktop CLI interface not available for cert-manager installation.");
      }
      // Inform user about the installation
      ddClient.desktopUI.toast.success(`Starting cert-manager ${CERT_MANAGER_VERSION} installation...`);
      
      await ddClient.extension.host.cli.exec("kubectl", ["apply", "-f", CERT_MANAGER_INSTALL_URL]);

      ddClient.desktopUI.toast.success(`Cert-manager ${CERT_MANAGER_VERSION} applied. Waiting for resources to be ready...`);
      // Wait for cert-manager to settle and CRDs to be fully registered
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds wait

      setCrdCheckStatus("pending"); // Re-trigger CRD check
    } catch (err: any) {
      console.error("Error installing cert-manager:", err);
      setCrdCheckStatus("install_failed");
      setError(err.message || `Failed to install cert-manager ${CERT_MANAGER_VERSION}. Please check Kubernetes logs or try manually.`);
      ddClient.desktopUI.toast.error(`Cert-manager installation failed: ${err.message}`);
    }
  };

  const handleCreateCertificate = async () => {
    if (crdCheckStatus !== 'checked_present') {
      setError("Cannot create certificate: cert-manager is not ready.");
      return;
    }
    if (!formData.name.trim()) {
      setError("Certificate name is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Use backend API to create certificate
      if (!ddClient?.extension?.vm?.service?.post) {
        throw new Error("Docker Desktop backend service not available");
      }

      const response = await ddClient.extension.vm.service.post("/create-certificate", {
        name: formData.name,
        namespace: formData.namespace,
        dnsNames: formData.dnsNames,
        issuerType: formData.issuerType,
        issuerName: formData.customIssuer
      }) as any;

      // Check if response has the expected structure
      const success = response?.data?.success ?? response?.success ?? false;
      const errorMessage = response?.data?.error ?? response?.error ?? null;

      if (!success) {
        throw new Error(errorMessage || "Failed to create certificate");
      }

      // Create Certificate object for callback
      const newCertificate: Certificate = {
        name: formData.name,
        namespace: formData.namespace,
        secretName: `${formData.name}-tls`,
        dnsNames: formData.dnsNames,
        issuer: formData.issuerType === "self-signed" ? "selfsigned-issuer" : formData.customIssuer,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      onCertificateCreated?.(newCertificate);
      
      // Reset form and close dialog
      setFormData({
        name: "",
        namespace: selectedNamespace,
        dnsNames: ["example.com"],
        issuerType: "self-signed",
        customIssuer: "",
      });
      setCreateDialogOpen(false);

      // Refresh certificates list
      await fetchCertificates();
    } catch (err: any) {
      console.error("Error creating certificate:", err);
      setError(err.message || "Failed to create certificate");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCertificate = async (cert: Certificate) => {
    try {
      if (!ddClient?.extension?.host?.cli?.exec) {
        throw new Error("Docker Desktop CLI interface not available");
      }

      await ddClient.extension.host.cli.exec("kubectl", [
        "delete", "certificate", cert.name, "-n", cert.namespace
      ]);

      // Also delete the secret if it exists
      try {
        await ddClient.extension.host.cli.exec("kubectl", [
          "delete", "secret", cert.secretName, "-n", cert.namespace
        ]);
      } catch {
        // Secret might not exist, ignore error
      }

      await fetchCertificates();
    } catch (err: any) {
      console.error("Error deleting certificate:", err);
      setError(err.message || "Failed to delete certificate");
    }
  };

  const handleViewCertificate = async (cert: Certificate) => {
    try {
      if (!ddClient?.extension?.host?.cli?.exec) {
        throw new Error("Docker Desktop CLI interface not available");
      }

      const result = await ddClient.extension.host.cli.exec("kubectl", [
        "get", "certificate", cert.name, "-n", cert.namespace, "-o", "yaml"
      ]);

      setCertificateYaml(result.stdout);
      setSelectedCertificate(cert);
      setViewDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching certificate YAML:", err);
      setError(err.message || "Failed to fetch certificate details");
    }
  };

  const addDnsName = () => {
    setFormData(prev => ({
      ...prev,
      dnsNames: [...prev.dnsNames, ""]
    }));
  };

  const updateDnsName = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      dnsNames: prev.dnsNames.map((dns, i) => i === index ? value : dns)
    }));
  };

  const removeDnsName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dnsNames: prev.dnsNames.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "success";
      case "pending": return "warning";
      case "failed": return "error";
      default: return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Certificate Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={crdCheckStatus !== "checked_present" || createDialogOpen || loading}
          sx={(theme) =>
            theme.palette.mode === "light"
              ? {
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  border: `1px solid ${theme.palette.primary.dark}`,
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                  },
                }
              : {}
          }
        >
          Generate Certificate
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Manage TLS certificates for secure HTTPS connections. Generate self-signed certificates for testing or use existing Certificate Authorities.
      </Typography>

      {/* CRD Status and Installation UI */}
      {crdCheckStatus === "pending" || crdCheckStatus === "checking" ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, flexDirection: "column", gap: 2 }}>
          <CircularProgress />
          <Typography>Checking for cert-manager...</Typography>
        </Box>
      ) : crdCheckStatus === "installing" ? (
        <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
          Installing cert-manager {CERT_MANAGER_VERSION}... This may take a few moments. Please wait.
        </Alert>
      ) : crdCheckStatus === "checked_missing" || crdCheckStatus === "install_failed" ? (
        <Card variant="outlined" sx={{ p: 3, mb: 2, textAlign: "center" }}>
          <WarningIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Cert-manager Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Cert-manager is required to manage TLS certificates. Version {CERT_MANAGER_VERSION} will be installed.
          </Typography>
          {error && ( // Display specific error related to CRD check or install failure
            <Alert severity={crdCheckStatus === "install_failed" ? "error" : "warning"} sx={{ mb: 2, textAlign: "left" }}>
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={handleInstallCertManager}
          >
            Install Cert-manager ({CERT_MANAGER_VERSION})
          </Button>
        </Card>
      ) : crdCheckStatus === "checked_present" ? (
        <>
          {/* This error is for when cert-manager IS installed, but listing certs failed or other general errors */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {loading ? ( // This loading is for fetching the list of certs
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : certificates.length === 0 ? (
            <Card variant="outlined" sx={{ textAlign: "center", p: 4 }}>
              <CertificateIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Certificates Found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first TLS certificate to enable HTTPS on your Gateways.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setCreateDialogOpen(true)}
                disabled={crdCheckStatus !== "checked_present"} // Ensure button is enabled only if CRDs are present
              >
                Generate Certificate
              </Button>
            </Card>
          ) : (
            <List>
              {certificates.map((cert, index) => (
                <React.Fragment key={`${cert.namespace}-${cert.name}`}>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon color={getStatusColor(cert.status) as any} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1">{cert.name}</Typography>
                      <Chip
                        label={cert.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(cert.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Namespace: {cert.namespace} • Secret: {cert.secretName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        DNS Names: {cert.dnsNames.join(", ")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Issuer: {cert.issuer}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Certificate">
                      <IconButton onClick={() => handleViewCertificate(cert)} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Certificate">
                      <IconButton 
                        onClick={() => handleDeleteCertificate(cert)} 
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
              {index < certificates.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </>
  ) : null}

      {/* Create Certificate Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate TLS Certificate</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Certificate Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="A unique name for this certificate"
            />

            <TextField
              fullWidth
              label="Namespace"
              value={formData.namespace}
              onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Kubernetes namespace where the certificate will be created"
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Issuer Type</InputLabel>
              <Select
                value={formData.issuerType}
                label="Issuer Type"
                onChange={(e) => setFormData(prev => ({ ...prev, issuerType: e.target.value as any }))}
              >
                <MenuItem value="self-signed">Self-Signed (for testing)</MenuItem>
                <MenuItem value="ca-issuer">Custom CA Issuer</MenuItem>
              </Select>
            </FormControl>

            {formData.issuerType === "ca-issuer" && (
              <TextField
                fullWidth
                label="Issuer Name"
                value={formData.customIssuer}
                onChange={(e) => setFormData(prev => ({ ...prev, customIssuer: e.target.value }))}
                sx={{ mb: 2 }}
                helperText="Name of the existing Issuer or ClusterIssuer"
              />
            )}

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2">DNS Names</Typography>
                <Button size="small" onClick={addDnsName} startIcon={<AddIcon />}>
                  Add DNS Name
                </Button>
              </Box>
              {formData.dnsNames.map((dns, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={dns}
                    onChange={(e) => updateDnsName(index, e.target.value)}
                    placeholder="example.com"
                  />
                  {formData.dnsNames.length > 1 && (
                    <IconButton size="small" onClick={() => removeDnsName(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            {formData.issuerType === "self-signed" && (
              <Alert severity="info" sx={{ mt: 2 }} icon={<WarningIcon />}>
                Self-signed certificates are only suitable for testing. For production use, configure a proper Certificate Authority.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateCertificate}
            disabled={creating || !formData.name.trim()}
          >
            {creating ? <CircularProgress size={20} /> : "Generate Certificate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Certificate Details: {selectedCertificate?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Certificate YAML Configuration:
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 1,
                p: 2,
                overflowX: "auto",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 400,
              }}
            >
              {certificateYaml}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}