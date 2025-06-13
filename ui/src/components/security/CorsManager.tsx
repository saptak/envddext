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
  ListItemSecondaryAction,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Public as CorsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from "@mui/icons-material";

interface CorsConfig {
  id: string;
  name: string;
  namespace: string;
  targetType: "Gateway" | "HTTPRoute";
  targetName: string;
  allowOrigins: string[];
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders: string[];
  allowCredentials: boolean;
  maxAge: number;
  created: string;
  status: "active" | "pending" | "error";
}

interface CorsManagerProps {
  onPolicyCreated?: () => void;
}

const DEFAULT_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"];
const DEFAULT_HEADERS = ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"];

export const CorsManager: React.FC<CorsManagerProps> = ({
  onPolicyCreated
}) => {
  const [configs, setConfigs] = React.useState<CorsConfig[]>([
    {
      id: "cors-1",
      name: "api-cors-policy",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "api-route",
      allowOrigins: ["https://myapp.com", "https://localhost:3000"],
      allowMethods: ["GET", "POST", "PUT", "DELETE"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["X-Request-ID"],
      allowCredentials: true,
      maxAge: 3600,
      created: "2025-06-12T10:30:00Z",
      status: "active"
    }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<CorsConfig | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    namespace: "default",
    targetType: "HTTPRoute" as "Gateway" | "HTTPRoute",
    targetName: "",
    allowOrigins: ["*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: [] as string[],
    allowCredentials: false,
    maxAge: 3600,
    newOrigin: "",
    newHeader: "",
    newExposeHeader: ""
  });

  const handleCreateNew = () => {
    setEditingConfig(null);
    setFormData({
      name: "",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "",
      allowOrigins: ["*"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: [],
      allowCredentials: false,
      maxAge: 3600,
      newOrigin: "",
      newHeader: "",
      newExposeHeader: ""
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleEdit = (config: CorsConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      namespace: config.namespace,
      targetType: config.targetType,
      targetName: config.targetName,
      allowOrigins: [...config.allowOrigins],
      allowMethods: [...config.allowMethods],
      allowHeaders: [...config.allowHeaders],
      exposeHeaders: [...config.exposeHeaders],
      allowCredentials: config.allowCredentials,
      maxAge: config.maxAge,
      newOrigin: "",
      newHeader: "",
      newExposeHeader: ""
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this CORS policy?")) {
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

      if (formData.allowOrigins.length === 0) {
        throw new Error("At least one allowed origin is required");
      }

      if (formData.allowMethods.length === 0) {
        throw new Error("At least one allowed method is required");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newConfig: CorsConfig = {
        id: editingConfig?.id || `cors-${Date.now()}`,
        name: formData.name,
        namespace: formData.namespace,
        targetType: formData.targetType,
        targetName: formData.targetName,
        allowOrigins: [...formData.allowOrigins],
        allowMethods: [...formData.allowMethods],
        allowHeaders: [...formData.allowHeaders],
        exposeHeaders: [...formData.exposeHeaders],
        allowCredentials: formData.allowCredentials,
        maxAge: formData.maxAge,
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
      setError(err.message || "Failed to save CORS policy");
    } finally {
      setIsCreating(false);
    }
  };

  const addOrigin = () => {
    if (formData.newOrigin && !formData.allowOrigins.includes(formData.newOrigin)) {
      setFormData(prev => ({
        ...prev,
        allowOrigins: [...prev.allowOrigins, prev.newOrigin],
        newOrigin: ""
      }));
    }
  };

  const removeOrigin = (origin: string) => {
    setFormData(prev => ({
      ...prev,
      allowOrigins: prev.allowOrigins.filter(o => o !== origin)
    }));
  };

  const addHeader = () => {
    if (formData.newHeader && !formData.allowHeaders.includes(formData.newHeader)) {
      setFormData(prev => ({
        ...prev,
        allowHeaders: [...prev.allowHeaders, prev.newHeader],
        newHeader: ""
      }));
    }
  };

  const removeHeader = (header: string) => {
    setFormData(prev => ({
      ...prev,
      allowHeaders: prev.allowHeaders.filter(h => h !== header)
    }));
  };

  const addExposeHeader = () => {
    if (formData.newExposeHeader && !formData.exposeHeaders.includes(formData.newExposeHeader)) {
      setFormData(prev => ({
        ...prev,
        exposeHeaders: [...prev.exposeHeaders, prev.newExposeHeader],
        newExposeHeader: ""
      }));
    }
  };

  const removeExposeHeader = (header: string) => {
    setFormData(prev => ({
      ...prev,
      exposeHeaders: prev.exposeHeaders.filter(h => h !== header)
    }));
  };

  const toggleMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      allowMethods: prev.allowMethods.includes(method)
        ? prev.allowMethods.filter(m => m !== method)
        : [...prev.allowMethods, method]
    }));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CorsIcon />
            CORS Policy Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure Cross-Origin Resource Sharing (CORS) to allow web applications 
            from different domains to access your APIs safely.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Add CORS Policy
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Understanding CORS
        </Typography>
        <Typography variant="body2">
          CORS is a browser security feature that controls which domains can access your API. 
          Without proper CORS configuration, browsers will block cross-origin requests, 
          preventing web applications from accessing your services.
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
                  <CorsIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {config.targetType} / {config.targetName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Origins: {config.allowOrigins.slice(0, 2).join(", ")}
                  {config.allowOrigins.length > 2 && ` +${config.allowOrigins.length - 2} more`}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Methods: {config.allowMethods.join(", ")}
                </Typography>
                {config.allowCredentials && (
                  <Chip size="small" label="Credentials Allowed" color="warning" sx={{ mr: 1 }} />
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
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
              <CorsIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No CORS Policies
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first CORS policy to enable cross-origin access to your APIs.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Create CORS Policy
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? "Edit CORS Policy" : "Create CORS Policy"}
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
                placeholder="api-cors-policy"
                helperText="Unique name for this CORS policy"
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
                helperText="Name of the Gateway or HTTPRoute to configure"
              />
            </Grid>
          </Grid>

          {/* Allowed Origins */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Allowed Origins</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Origin"
                  value={formData.newOrigin}
                  onChange={(e) => setFormData(prev => ({ ...prev, newOrigin: e.target.value }))}
                  placeholder="https://example.com"
                  onKeyPress={(e) => e.key === "Enter" && addOrigin()}
                />
                <Button onClick={addOrigin} variant="outlined">
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.allowOrigins.map((origin) => (
                  <Chip
                    key={origin}
                    label={origin}
                    onDelete={() => removeOrigin(origin)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Security Note:</strong> Using "*" allows all origins and can be a security risk. 
                  Specify exact domains for production environments.
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>

          {/* Allowed Methods */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Allowed Methods</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup row>
                {DEFAULT_METHODS.map((method) => (
                  <FormControlLabel
                    key={method}
                    control={
                      <Checkbox
                        checked={formData.allowMethods.includes(method)}
                        onChange={() => toggleMethod(method)}
                      />
                    }
                    label={method}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Allowed Headers */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Allowed Headers</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Header"
                  value={formData.newHeader}
                  onChange={(e) => setFormData(prev => ({ ...prev, newHeader: e.target.value }))}
                  placeholder="X-Custom-Header"
                  onKeyPress={(e) => e.key === "Enter" && addHeader()}
                />
                <Button onClick={addHeader} variant="outlined">
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.allowHeaders.map((header) => (
                  <Chip
                    key={header}
                    label={header}
                    onDelete={() => removeHeader(header)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Exposed Headers */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Exposed Headers (Optional)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Exposed Header"
                  value={formData.newExposeHeader}
                  onChange={(e) => setFormData(prev => ({ ...prev, newExposeHeader: e.target.value }))}
                  placeholder="X-Request-ID"
                  onKeyPress={(e) => e.key === "Enter" && addExposeHeader()}
                />
                <Button onClick={addExposeHeader} variant="outlined">
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.exposeHeaders.map((header) => (
                  <Chip
                    key={header}
                    label={header}
                    onDelete={() => removeExposeHeader(header)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Headers that the browser can access in the response
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Advanced Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.allowCredentials}
                        onChange={(e) => setFormData(prev => ({ ...prev, allowCredentials: e.target.checked }))}
                      />
                    }
                    label="Allow Credentials"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Allow cookies and authentication headers in CORS requests
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Age (seconds)"
                    value={formData.maxAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAge: parseInt(e.target.value) || 0 }))}
                    helperText="How long browsers cache preflight responses"
                  />
                </Grid>
              </Grid>
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