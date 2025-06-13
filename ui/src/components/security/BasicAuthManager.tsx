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
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  VpnKey as AuthIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Security as SecurityIcon
} from "@mui/icons-material";

interface BasicAuthConfig {
  id: string;
  name: string;
  namespace: string;
  targetType: "Gateway" | "HTTPRoute";
  targetName: string;
  secretName: string;
  realm?: string;
  created: string;
  status: "active" | "pending" | "error";
}

interface BasicAuthManagerProps {
  onPolicyCreated?: () => void;
}

export const BasicAuthManager: React.FC<BasicAuthManagerProps> = ({
  onPolicyCreated
}) => {
  const [configs, setConfigs] = React.useState<BasicAuthConfig[]>([
    {
      id: "auth-1",
      name: "api-basic-auth",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "api-route",
      secretName: "api-auth-secret",
      realm: "API Access",
      created: "2025-06-12T10:30:00Z",
      status: "active"
    }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<BasicAuthConfig | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    namespace: "default",
    targetType: "HTTPRoute" as "Gateway" | "HTTPRoute",
    targetName: "",
    secretName: "",
    realm: "",
    username: "",
    password: "",
    createSecret: true
  });

  const handleCreateNew = () => {
    setEditingConfig(null);
    setFormData({
      name: "",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "",
      secretName: "",
      realm: "",
      username: "",
      password: "",
      createSecret: true
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleEdit = (config: BasicAuthConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      namespace: config.namespace,
      targetType: config.targetType,
      targetName: config.targetName,
      secretName: config.secretName,
      realm: config.realm || "",
      username: "",
      password: "",
      createSecret: false
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Basic Authentication configuration?")) {
      setConfigs(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Validation
      if (!formData.name || !formData.targetName) {
        throw new Error("Name and target are required");
      }

      if (formData.createSecret && (!formData.username || !formData.password)) {
        throw new Error("Username and password are required when creating a new secret");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newConfig: BasicAuthConfig = {
        id: editingConfig?.id || `auth-${Date.now()}`,
        name: formData.name,
        namespace: formData.namespace,
        targetType: formData.targetType,
        targetName: formData.targetName,
        secretName: formData.secretName || `${formData.name}-secret`,
        realm: formData.realm,
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
      setError(err.message || "Failed to save Basic Authentication configuration");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSecret = () => {
    setSecretDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AuthIcon />
            Basic Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Protect your routes with username and password authentication. 
            Basic Auth is simple to implement and widely supported.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Add Basic Auth
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          How Basic Authentication Works
        </Typography>
        <Typography variant="body2">
          Basic Authentication requires clients to send credentials (username:password) 
          encoded in Base64 with each request. While simple, it should only be used with HTTPS 
          to protect credentials in transit.
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
                  <AuthIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {config.targetType} / {config.targetName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Secret: {config.secretName}
                </Typography>
                {config.realm && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Realm: {config.realm}
                  </Typography>
                )}
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
                  onClick={() => {}}
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
              <AuthIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Basic Authentication Policies
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first Basic Authentication policy to protect your routes.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Create Basic Auth Policy
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? "Edit Basic Authentication" : "Create Basic Authentication"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="api-basic-auth"
                helperText="Unique name for this authentication policy"
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
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={formData.targetType}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value as "Gateway" | "HTTPRoute" }))}
                  label="Target Type"
                >
                  <MenuItem value="HTTPRoute">HTTPRoute</MenuItem>
                  <MenuItem value="Gateway">Gateway</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Name"
                value={formData.targetName}
                onChange={(e) => setFormData(prev => ({ ...prev, targetName: e.target.value }))}
                placeholder="my-route"
                helperText="Name of the Gateway or HTTPRoute to protect"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Realm (Optional)"
                value={formData.realm}
                onChange={(e) => setFormData(prev => ({ ...prev, realm: e.target.value }))}
                placeholder="Protected Area"
                helperText="Realm name displayed in the browser's authentication dialog"
              />
            </Grid>
          </Grid>

          {/* Secret Configuration */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Secret Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.createSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, createSecret: e.target.checked }))}
                  />
                }
                label="Create new Kubernetes Secret"
                sx={{ mb: 2 }}
              />

              {formData.createSecret ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Secret Name"
                      value={formData.secretName}
                      onChange={(e) => setFormData(prev => ({ ...prev, secretName: e.target.value }))}
                      placeholder={`${formData.name}-secret`}
                      helperText="Name for the Kubernetes Secret to store credentials"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </Grid>
                </Grid>
              ) : (
                <TextField
                  fullWidth
                  label="Existing Secret Name"
                  value={formData.secretName}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretName: e.target.value }))}
                  placeholder="existing-auth-secret"
                  helperText="Name of an existing Kubernetes Secret containing credentials"
                />
              )}

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Security Note:</strong> Credentials will be stored as a Kubernetes Secret. 
                  Ensure your cluster is properly secured and consider using more advanced 
                  authentication methods for production environments.
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>

          {/* Testing Information */}
          <Accordion sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Testing Your Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Testing Basic Authentication
                </Typography>
                <Typography variant="body2" component="div">
                  Once configured, you can test Basic Authentication using:
                  <List dense sx={{ mt: 1 }}>
                    <ListItem>
                      <ListItemText 
                        primary="HTTP Testing Tab"
                        secondary="Use the built-in HTTP client with authentication options"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="cURL Command"
                        secondary={`curl -u ${formData.username || "username"}:${formData.password || "password"} http://your-gateway/path`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Browser"
                        secondary="Navigate to the protected route and enter credentials when prompted"
                      />
                    </ListItem>
                  </List>
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={isCreating}>
            {isCreating ? "Creating..." : editingConfig ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};