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
  Divider
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Speed as RateLimitIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Person as UserIcon,
  Language as IPIcon,
  Label as HeaderIcon,
  Security as SecurityIcon
} from "@mui/icons-material";

interface RateLimitRule {
  id: string;
  name: string;
  namespace: string;
  targetType: "Gateway" | "HTTPRoute";
  targetName: string;
  requests: number;
  timeUnit: "second" | "minute" | "hour" | "day";
  dimension: "global" | "per-ip" | "per-header" | "per-user";
  dimensionKey?: string; // For per-header, per-user dimensions
  burst?: number; // Allow burst above limit
  enforceMode: "enforce" | "shadow";
  created: string;
  status: "active" | "pending" | "error";
}

interface RateLimitManagerProps {
  onPolicyCreated?: () => void;
}

export const RateLimitManager: React.FC<RateLimitManagerProps> = ({
  onPolicyCreated
}) => {
  const [rules, setRules] = React.useState<RateLimitRule[]>([
    {
      id: "rate-limit-1",
      name: "api-rate-limit",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "api-route",
      requests: 100,
      timeUnit: "minute",
      dimension: "per-ip",
      burst: 120,
      enforceMode: "enforce",
      created: "2025-06-12T10:30:00Z",
      status: "active"
    },
    {
      id: "rate-limit-2", 
      name: "global-gateway-limit",
      namespace: "default",
      targetType: "Gateway",
      targetName: "main-gateway",
      requests: 1000,
      timeUnit: "minute",
      dimension: "global",
      enforceMode: "enforce",
      created: "2025-06-12T09:15:00Z",
      status: "active"
    }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<RateLimitRule | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    namespace: "default",
    targetType: "HTTPRoute" as "Gateway" | "HTTPRoute",
    targetName: "",
    requests: 100,
    timeUnit: "minute" as "second" | "minute" | "hour" | "day",
    dimension: "per-ip" as "global" | "per-ip" | "per-header" | "per-user",
    dimensionKey: "",
    burst: 0,
    enforceMode: "enforce" as "enforce" | "shadow"
  });

  const handleCreateNew = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "",
      requests: 100,
      timeUnit: "minute",
      dimension: "per-ip",
      dimensionKey: "",
      burst: 0,
      enforceMode: "enforce"
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleEdit = (rule: RateLimitRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      namespace: rule.namespace,
      targetType: rule.targetType,
      targetName: rule.targetName,
      requests: rule.requests,
      timeUnit: rule.timeUnit,
      dimension: rule.dimension,
      dimensionKey: rule.dimensionKey || "",
      burst: rule.burst || 0,
      enforceMode: rule.enforceMode
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this rate limiting rule? This will remove traffic protection.")) {
      setRules(prev => prev.filter(r => r.id !== id));
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

      if (formData.requests <= 0) {
        throw new Error("Request limit must be greater than 0");
      }

      if ((formData.dimension === "per-header" || formData.dimension === "per-user") && !formData.dimensionKey) {
        throw new Error("Dimension key is required for per-header and per-user limits");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newRule: RateLimitRule = {
        id: editingRule?.id || `rate-limit-${Date.now()}`,
        name: formData.name,
        namespace: formData.namespace,
        targetType: formData.targetType,
        targetName: formData.targetName,
        requests: formData.requests,
        timeUnit: formData.timeUnit,
        dimension: formData.dimension,
        dimensionKey: formData.dimensionKey || undefined,
        burst: formData.burst > 0 ? formData.burst : undefined,
        enforceMode: formData.enforceMode,
        created: editingRule?.created || new Date().toISOString(),
        status: "active"
      };

      if (editingRule) {
        setRules(prev => prev.map(r => r.id === editingRule.id ? newRule : r));
      } else {
        setRules(prev => [...prev, newRule]);
      }

      setDialogOpen(false);
      if (onPolicyCreated) {
        onPolicyCreated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save rate limiting rule");
    } finally {
      setIsCreating(false);
    }
  };

  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case "global": return <SecurityIcon />;
      case "per-ip": return <IPIcon />;
      case "per-header": return <HeaderIcon />;
      case "per-user": return <UserIcon />;
      default: return <SecurityIcon />;
    }
  };

  const formatRateLimit = (requests: number, timeUnit: string, burst?: number) => {
    const burstText = burst ? ` (burst: ${burst})` : "";
    return `${requests}/${timeUnit}${burstText}`;
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RateLimitIcon />
            Rate Limiting Policies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure request rate limits to protect your services from traffic overload and abuse.
            Define limits per IP, header, user, or globally.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Add Rate Limit
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Rate Limiting Best Practices
        </Typography>
        <Typography variant="body2">
          • Start with conservative limits and monitor traffic patterns
          • Use per-IP limits to prevent individual clients from overwhelming your service
          • Consider burst allowances for legitimate traffic spikes
          • Test limits in shadow mode before enforcing
        </Typography>
      </Alert>

      {/* Rate Limiting Service Setup */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon />
            <Typography variant="subtitle1" fontWeight="bold">
              Rate Limiting Service Setup
            </Typography>
            <Chip label="Required" size="small" color="warning" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Service Required
            </Typography>
            <Typography variant="body2">
              Rate limiting requires deploying a rate limit service (like Envoy Rate Limit Service) 
              to your cluster. This service handles rate limit calculations and storage.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SecurityIcon />
                    Envoy Rate Limit Service
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The official Envoy rate limiting service provides distributed rate limiting 
                    with Redis backend for scalable traffic control.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Deployment Command:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: "grey.900", borderRadius: 1 }}>
                    <Typography 
                      component="pre" 
                      variant="body2" 
                      sx={{ 
                        color: "grey.100", 
                        fontFamily: "monospace",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        fontSize: "0.8rem"
                      }}
                    >
{`# Deploy Redis for rate limit storage
kubectl apply -f https://raw.githubusercontent.com/envoyproxy/ratelimit/main/examples/redis/redis.yaml

# Deploy Rate Limit Service
kubectl apply -f https://raw.githubusercontent.com/envoyproxy/ratelimit/main/examples/ratelimit/ratelimit.yaml`}
                    </Typography>
                  </Paper>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      // TODO: Implement automated deployment
                      alert("Automated deployment coming soon! Please use the manual commands for now.");
                    }}
                  >
                    Auto Deploy
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<InfoIcon />}
                    href="https://github.com/envoyproxy/ratelimit"
                    target="_blank"
                  >
                    Documentation
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WarningIcon />
                    Configuration Requirements
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    After deploying the rate limit service, you need to configure Envoy Gateway 
                    to use it for rate limiting policies.
                  </Typography>

                  <List dense>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Rate Limit Service Running"
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Redis Storage Available"
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Gateway Configuration Updated"
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  </List>

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Gateway Configuration:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: "grey.900", borderRadius: 1 }}>
                    <Typography 
                      component="pre" 
                      variant="body2" 
                      sx={{ 
                        color: "grey.100", 
                        fontFamily: "monospace",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        fontSize: "0.8rem"
                      }}
                    >
{`apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: rate-limit-config
spec:
  rateLimit:
    backend:
      type: Redis
      redis:
        url: redis://redis.default.svc.cluster.local:6379`}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Verification Steps
            </Typography>
            <Typography variant="body2">
              1. Check that Redis and rate limit service pods are running: <code>kubectl get pods</code><br/>
              2. Verify rate limit service logs: <code>kubectl logs -l app=ratelimit</code><br/>
              3. Test rate limiting with the Rate Limit Tester tool above
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Rate Limiting Overview */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Rate Limiting Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {rules.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Rules
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="success.main">
                  {rules.filter(r => r.targetType === "HTTPRoute").length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Route Limits
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="warning.main">
                  {rules.filter(r => r.targetType === "Gateway").length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gateway Limits
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {rules.filter(r => r.dimension === "per-ip").length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Per-IP Rules
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rate Limiting Rules List */}
      <Grid container spacing={2}>
        {rules.map((rule) => (
          <Grid item xs={12} lg={6} key={rule.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {rule.name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <Chip 
                        size="small" 
                        label={rule.status} 
                        color={rule.status === "active" ? "success" : rule.status === "error" ? "error" : "warning"}
                      />
                      <Chip 
                        size="small" 
                        label={rule.enforceMode}
                        color={rule.enforceMode === "enforce" ? "error" : "warning"}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <RateLimitIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {rule.targetType} → {rule.targetName}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Limit: {formatRateLimit(rule.requests, rule.timeUnit, rule.burst)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  {getDimensionIcon(rule.dimension)}
                  <Typography variant="body2">
                    Dimension: {rule.dimension}
                    {rule.dimensionKey && ` (${rule.dimensionKey})`}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(rule.created).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(rule)}
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
                  onClick={() => handleDelete(rule.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {rules.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <RateLimitIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Rate Limiting Rules
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Protect your services by configuring rate limiting policies. Set request limits
                per IP, user, or globally to prevent abuse and overload.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Add Rate Limit
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? "Edit Rate Limiting Rule" : "Create Rate Limiting Rule"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="api-rate-limit"
                helperText="Unique name for this rate limiting rule"
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
                  <MenuItem value="HTTPRoute">HTTPRoute - Apply to specific route</MenuItem>
                  <MenuItem value="Gateway">Gateway - Apply to entire gateway</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Name"
                value={formData.targetName}
                onChange={(e) => setFormData(prev => ({ ...prev, targetName: e.target.value }))}
                placeholder="api-route"
                helperText={`Name of the ${formData.targetType} to apply rate limiting`}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Rate Limit Configuration" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Requests"
                value={formData.requests}
                onChange={(e) => setFormData(prev => ({ ...prev, requests: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1, max: 10000 }}
                helperText="Number of requests allowed"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Time Unit</InputLabel>
                <Select
                  value={formData.timeUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeUnit: e.target.value as any }))}
                  label="Time Unit"
                >
                  <MenuItem value="second">Per Second</MenuItem>
                  <MenuItem value="minute">Per Minute</MenuItem>
                  <MenuItem value="hour">Per Hour</MenuItem>
                  <MenuItem value="day">Per Day</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Burst Allowance (Optional)"
                value={formData.burst}
                onChange={(e) => setFormData(prev => ({ ...prev, burst: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0 }}
                helperText="Additional requests allowed in bursts"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rate Limit Dimension</InputLabel>
                <Select
                  value={formData.dimension}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimension: e.target.value as any }))}
                  label="Rate Limit Dimension"
                >
                  <MenuItem value="global">Global - Single limit for all traffic</MenuItem>
                  <MenuItem value="per-ip">Per IP - Individual limit per client IP</MenuItem>
                  <MenuItem value="per-header">Per Header - Limit based on header value</MenuItem>
                  <MenuItem value="per-user">Per User - Limit based on user identifier</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(formData.dimension === "per-header" || formData.dimension === "per-user") && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dimension Key"
                  value={formData.dimensionKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensionKey: e.target.value }))}
                  placeholder={formData.dimension === "per-header" ? "X-User-ID" : "user-id"}
                  helperText={`${formData.dimension === "per-header" ? "Header name" : "User identifier field"} to group by`}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Enforcement Mode</InputLabel>
                <Select
                  value={formData.enforceMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, enforceMode: e.target.value as any }))}
                  label="Enforcement Mode"
                >
                  <MenuItem value="enforce">Enforce - Block requests exceeding limit</MenuItem>
                  <MenuItem value="shadow">Shadow - Log violations but allow requests</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Rate Limiting Impact
            </Typography>
            <Typography variant="body2">
              Rate limiting will return HTTP 429 (Too Many Requests) responses when limits are exceeded.
              Consider starting with shadow mode to understand traffic patterns before enforcing limits.
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : editingRule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};