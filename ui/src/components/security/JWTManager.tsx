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
  ListItemSecondaryAction,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Divider,
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
  Security as JWTIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Key as KeyIcon,
  Verified as VerifiedIcon,
  Code as TokenIcon,
  Settings as ConfigIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Public as PublicIcon,
  Security as SecurityIcon
} from "@mui/icons-material";

// JWT Policy interfaces
interface JWTClaim {
  name: string;
  headerName: string;
  required: boolean;
}

interface JWTProvider {
  name: string;
  issuer: string;
  jwksUri: string;
  audiences: string[];
  claimMappings: JWTClaim[];
}

interface JWTPolicy {
  id: string;
  name: string;
  namespace: string;
  targetType: "Gateway" | "HTTPRoute";
  targetName: string;
  providers: JWTProvider[];
  required: boolean;
  stripToken: boolean;
  created: string;
  status: "active" | "pending" | "error";
}

interface JWTManagerProps {
  onPolicyCreated?: (policy: JWTPolicy) => void;
}

export const JWTManager: React.FC<JWTManagerProps> = ({ onPolicyCreated }) => {
  const [policies, setPolicies] = React.useState<JWTPolicy[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedPolicy, setSelectedPolicy] = React.useState<JWTPolicy | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // New policy form state
  const [newPolicy, setNewPolicy] = React.useState<Partial<JWTPolicy>>({
    name: "",
    namespace: "default",
    targetType: "HTTPRoute",
    targetName: "",
    providers: [],
    required: true,
    stripToken: false
  });

  const [currentProvider, setCurrentProvider] = React.useState<Partial<JWTProvider>>({
    name: "",
    issuer: "",
    jwksUri: "",
    audiences: [],
    claimMappings: []
  });

  const [currentClaim, setCurrentClaim] = React.useState<Partial<JWTClaim>>({
    name: "",
    headerName: "",
    required: false
  });

  const [activeStep, setActiveStep] = React.useState(0);
  const [audienceInput, setAudienceInput] = React.useState("");

  // Load existing policies
  React.useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockPolicies: JWTPolicy[] = [
        {
          id: "jwt-policy-1",
          name: "api-jwt-auth",
          namespace: "default",
          targetType: "HTTPRoute",
          targetName: "api-route",
          providers: [
            {
              name: "auth0-provider",
              issuer: "https://example.auth0.com/",
              jwksUri: "https://example.auth0.com/.well-known/jwks.json",
              audiences: ["api.example.com"],
              claimMappings: [
                { name: "sub", headerName: "x-user-id", required: true },
                { name: "email", headerName: "x-user-email", required: false }
              ]
            }
          ],
          required: true,
          stripToken: false,
          created: "2025-06-13T10:00:00Z",
          status: "active"
        }
      ];
      setPolicies(mockPolicies);
    } catch (err) {
      setError("Failed to load JWT policies");
      console.error("Error loading JWT policies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = () => {
    setCreateDialogOpen(true);
    setActiveStep(0);
    setNewPolicy({
      name: "",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "",
      providers: [],
      required: true,
      stripToken: false
    });
  };

  const handleAddProvider = () => {
    if (!currentProvider.name || !currentProvider.issuer || !currentProvider.jwksUri) {
      setError("Provider name, issuer, and JWKS URI are required");
      return;
    }

    const provider: JWTProvider = {
      name: currentProvider.name!,
      issuer: currentProvider.issuer!,
      jwksUri: currentProvider.jwksUri!,
      audiences: currentProvider.audiences || [],
      claimMappings: currentProvider.claimMappings || []
    };

    setNewPolicy(prev => ({
      ...prev,
      providers: [...(prev.providers || []), provider]
    }));

    setCurrentProvider({
      name: "",
      issuer: "",
      jwksUri: "",
      audiences: [],
      claimMappings: []
    });
    setError(null);
  };

  const handleAddAudience = () => {
    if (audienceInput.trim()) {
      setCurrentProvider(prev => ({
        ...prev,
        audiences: [...(prev.audiences || []), audienceInput.trim()]
      }));
      setAudienceInput("");
    }
  };

  const handleRemoveAudience = (index: number) => {
    setCurrentProvider(prev => ({
      ...prev,
      audiences: prev.audiences?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddClaim = () => {
    if (!currentClaim.name || !currentClaim.headerName) {
      setError("Claim name and header name are required");
      return;
    }

    const claim: JWTClaim = {
      name: currentClaim.name!,
      headerName: currentClaim.headerName!,
      required: currentClaim.required || false
    };

    setCurrentProvider(prev => ({
      ...prev,
      claimMappings: [...(prev.claimMappings || []), claim]
    }));

    setCurrentClaim({
      name: "",
      headerName: "",
      required: false
    });
    setError(null);
  };

  const handleRemoveClaim = (index: number) => {
    setCurrentProvider(prev => ({
      ...prev,
      claimMappings: prev.claimMappings?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmitPolicy = async () => {
    if (!newPolicy.name || !newPolicy.targetName || !newPolicy.providers?.length) {
      setError("Policy name, target name, and at least one provider are required");
      return;
    }

    setLoading(true);
    try {
      const policy: JWTPolicy = {
        id: `jwt-${Date.now()}`,
        name: newPolicy.name!,
        namespace: newPolicy.namespace || "default",
        targetType: newPolicy.targetType!,
        targetName: newPolicy.targetName!,
        providers: newPolicy.providers!,
        required: newPolicy.required || true,
        stripToken: newPolicy.stripToken || false,
        created: new Date().toISOString(),
        status: "pending"
      };

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPolicies(prev => [...prev, policy]);
      setCreateDialogOpen(false);
      setSuccess("JWT policy created successfully");
      
      if (onPolicyCreated) {
        onPolicyCreated(policy);
      }
    } catch (err) {
      setError("Failed to create JWT policy");
      console.error("Error creating JWT policy:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPolicies(prev => prev.filter(p => p.id !== policyId));
      setSuccess("JWT policy deleted successfully");
    } catch (err) {
      setError("Failed to delete JWT policy");
      console.error("Error deleting JWT policy:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckIcon sx={{ color: "success.main" }} />;
      case "pending":
        return <InfoIcon sx={{ color: "warning.main" }} />;
      case "error":
        return <ErrorIcon sx={{ color: "error.main" }} />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const steps = [
    "Basic Configuration",
    "JWT Provider Setup",
    "Claim Mappings",
    "Review & Apply"
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <JWTIcon sx={{ color: "primary.main", fontSize: 32 }} />
          <Box>
            <Typography variant="h6">JWT Authentication</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure JWT token validation for routes with provider management
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePolicy}
          disabled={loading}
        >
          Add JWT Policy
        </Button>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon sx={{ color: "primary.main" }} />
            JWT Authentication Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            JWT (JSON Web Token) authentication provides stateless authentication using cryptographically 
            signed tokens. Configure JWT providers, validate tokens against JWKS endpoints, and extract 
            claims to headers for downstream services.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="primary.main">{policies.length}</Typography>
                <Typography variant="body2">Active Policies</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="success.main">
                  {policies.filter(p => p.status === "active").length}
                </Typography>
                <Typography variant="body2">Configured</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {policies.reduce((sum, p) => sum + p.providers.length, 0)}
                </Typography>
                <Typography variant="body2">JWT Providers</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Policies List */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        JWT Policies ({policies.length})
      </Typography>

      {policies.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <JWTIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No JWT Policies Configured
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first JWT authentication policy to protect routes with token validation.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreatePolicy}>
            Create JWT Policy
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {policies.map((policy) => (
            <Grid item xs={12} md={6} key={policy.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getStatusIcon(policy.status)}
                      <Typography variant="h6">{policy.name}</Typography>
                    </Box>
                    <Chip 
                      label={policy.status} 
                      color={getStatusColor(policy.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Target: {policy.targetType} / {policy.targetName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Namespace: {policy.namespace}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Providers: {policy.providers.length}
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {policy.providers.map((provider, index) => (
                      <Chip 
                        key={index}
                        label={provider.name}
                        size="small"
                        icon={<KeyIcon />}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Chip 
                      label={policy.required ? "Required" : "Optional"}
                      size="small"
                      color={policy.required ? "error" : "default"}
                    />
                    {policy.stripToken && (
                      <Chip label="Strip Token" size="small" color="info" />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setViewDialogOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeletePolicy(policy.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Policy Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <JWTIcon />
            Create JWT Authentication Policy
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Basic Configuration */}
            <Step>
              <StepLabel>Basic Configuration</StepLabel>
              <StepContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Policy Name"
                      value={newPolicy.name || ""}
                      onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="api-jwt-auth"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Namespace"
                      value={newPolicy.namespace || ""}
                      onChange={(e) => setNewPolicy(prev => ({ ...prev, namespace: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Target Type</InputLabel>
                      <Select
                        value={newPolicy.targetType || "HTTPRoute"}
                        onChange={(e) => setNewPolicy(prev => ({ ...prev, targetType: e.target.value as any }))}
                      >
                        <MenuItem value="HTTPRoute">HTTPRoute</MenuItem>
                        <MenuItem value="Gateway">Gateway</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Target Name"
                      value={newPolicy.targetName || ""}
                      onChange={(e) => setNewPolicy(prev => ({ ...prev, targetName: e.target.value }))}
                      placeholder="api-route"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newPolicy.required || false}
                          onChange={(e) => setNewPolicy(prev => ({ ...prev, required: e.target.checked }))}
                        />
                      }
                      label="JWT Required (reject requests without valid tokens)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newPolicy.stripToken || false}
                          onChange={(e) => setNewPolicy(prev => ({ ...prev, stripToken: e.target.checked }))}
                        />
                      }
                      label="Strip Token (remove Authorization header from upstream requests)"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={() => setActiveStep(1)}>
                    Next: Configure Provider
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: JWT Provider Setup */}
            <Step>
              <StepLabel>JWT Provider Setup</StepLabel>
              <StepContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Provider Name"
                      value={currentProvider.name || ""}
                      onChange={(e) => setCurrentProvider(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="auth0-provider"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Issuer URL"
                      value={currentProvider.issuer || ""}
                      onChange={(e) => setCurrentProvider(prev => ({ ...prev, issuer: e.target.value }))}
                      placeholder="https://example.auth0.com/"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="JWKS URI"
                      value={currentProvider.jwksUri || ""}
                      onChange={(e) => setCurrentProvider(prev => ({ ...prev, jwksUri: e.target.value }))}
                      placeholder="https://example.auth0.com/.well-known/jwks.json"
                      helperText="JSON Web Key Set endpoint for token validation"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Audiences (Optional)
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Add Audience"
                        value={audienceInput}
                        onChange={(e) => setAudienceInput(e.target.value)}
                        placeholder="api.example.com"
                        onKeyPress={(e) => e.key === "Enter" && handleAddAudience()}
                      />
                      <Button variant="outlined" onClick={handleAddAudience}>
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {currentProvider.audiences?.map((audience, index) => (
                        <Chip
                          key={index}
                          label={audience}
                          onDelete={() => handleRemoveAudience(index)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                  <Button variant="contained" onClick={() => setActiveStep(2)}>
                    Next: Configure Claims
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Claim Mappings */}
            <Step>
              <StepLabel>Claim Mappings</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Map JWT claims to HTTP headers for downstream services
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Claim Name"
                      value={currentClaim.name || ""}
                      onChange={(e) => setCurrentClaim(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="sub"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Header Name"
                      value={currentClaim.headerName || ""}
                      onChange={(e) => setCurrentClaim(prev => ({ ...prev, headerName: e.target.value }))}
                      placeholder="x-user-id"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currentClaim.required || false}
                          onChange={(e) => setCurrentClaim(prev => ({ ...prev, required: e.target.checked }))}
                        />
                      }
                      label="Required"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleAddClaim}
                      disabled={!currentClaim.name || !currentClaim.headerName}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>

                {currentProvider.claimMappings && currentProvider.claimMappings.length > 0 && (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Claim</TableCell>
                          <TableCell>Header</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentProvider.claimMappings.map((claim, index) => (
                          <TableRow key={index}>
                            <TableCell>{claim.name}</TableCell>
                            <TableCell>{claim.headerName}</TableCell>
                            <TableCell>
                              <Chip 
                                label={claim.required ? "Yes" : "No"} 
                                size="small"
                                color={claim.required ? "error" : "default"}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveClaim(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button onClick={() => setActiveStep(1)}>Back</Button>
                  <Button variant="contained" onClick={() => setActiveStep(3)}>
                    Next: Review
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Review & Apply */}
            <Step>
              <StepLabel>Review & Apply</StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, mt: 1 }}>
                  <Typography variant="h6" gutterBottom>Policy Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {newPolicy.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Target:</strong> {newPolicy.targetType} / {newPolicy.targetName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Namespace:</strong> {newPolicy.namespace}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>JWT Required:</strong> {newPolicy.required ? "Yes" : "No"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Strip Token:</strong> {newPolicy.stripToken ? "Yes" : "No"}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Provider Configuration</Typography>
                  <Typography variant="body2">
                    <strong>Provider:</strong> {currentProvider.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Issuer:</strong> {currentProvider.issuer}
                  </Typography>
                  <Typography variant="body2">
                    <strong>JWKS URI:</strong> {currentProvider.jwksUri}
                  </Typography>
                  {currentProvider.audiences && currentProvider.audiences.length > 0 && (
                    <Typography variant="body2">
                      <strong>Audiences:</strong> {currentProvider.audiences.join(", ")}
                    </Typography>
                  )}
                  {currentProvider.claimMappings && currentProvider.claimMappings.length > 0 && (
                    <Typography variant="body2">
                      <strong>Claim Mappings:</strong> {currentProvider.claimMappings.length} configured
                    </Typography>
                  )}
                </Paper>

                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button onClick={() => setActiveStep(2)}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleAddProvider();
                      handleSubmitPolicy();
                    }}
                    disabled={loading}
                  >
                    Create JWT Policy
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* View Policy Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <JWTIcon />
            JWT Policy Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPolicy && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Typography variant="body2"><strong>Name:</strong> {selectedPolicy.name}</Typography>
                  <Typography variant="body2"><strong>Namespace:</strong> {selectedPolicy.namespace}</Typography>
                  <Typography variant="body2"><strong>Target:</strong> {selectedPolicy.targetType} / {selectedPolicy.targetName}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedPolicy.status}</Typography>
                  <Typography variant="body2"><strong>Created:</strong> {new Date(selectedPolicy.created).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>Configuration</Typography>
                  <Typography variant="body2"><strong>JWT Required:</strong> {selectedPolicy.required ? "Yes" : "No"}</Typography>
                  <Typography variant="body2"><strong>Strip Token:</strong> {selectedPolicy.stripToken ? "Yes" : "No"}</Typography>
                  <Typography variant="body2"><strong>Providers:</strong> {selectedPolicy.providers.length}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>JWT Providers</Typography>
              {selectedPolicy.providers.map((provider, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>{provider.name}</Typography>
                  <Typography variant="body2"><strong>Issuer:</strong> {provider.issuer}</Typography>
                  <Typography variant="body2"><strong>JWKS URI:</strong> {provider.jwksUri}</Typography>
                  {provider.audiences.length > 0 && (
                    <Typography variant="body2"><strong>Audiences:</strong> {provider.audiences.join(", ")}</Typography>
                  )}
                  
                  {provider.claimMappings.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Claim Mappings</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Claim</TableCell>
                              <TableCell>Header</TableCell>
                              <TableCell>Required</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {provider.claimMappings.map((claim, claimIndex) => (
                              <TableRow key={claimIndex}>
                                <TableCell>{claim.name}</TableCell>
                                <TableCell>{claim.headerName}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={claim.required ? "Yes" : "No"} 
                                    size="small"
                                    color={claim.required ? "error" : "default"}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};