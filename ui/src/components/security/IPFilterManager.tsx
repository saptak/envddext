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
  Radio,
  RadioGroup,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as IPFilterIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  CheckCircle as AllowIcon,
  Cancel as DenyIcon
} from "@mui/icons-material";

interface IPRule {
  id: string;
  type: "allow" | "deny";
  cidr: string;
  description?: string;
}

interface IPFilterConfig {
  id: string;
  name: string;
  namespace: string;
  targetType: "Gateway" | "HTTPRoute";
  targetName: string;
  defaultAction: "allow" | "deny";
  rules: IPRule[];
  created: string;
  status: "active" | "pending" | "error";
}

interface IPFilterManagerProps {
  onPolicyCreated?: () => void;
}

export const IPFilterManager: React.FC<IPFilterManagerProps> = ({
  onPolicyCreated
}) => {
  const [configs, setConfigs] = React.useState<IPFilterConfig[]>([
    {
      id: "ip-1",
      name: "admin-ip-filter",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "admin-route",
      defaultAction: "deny",
      rules: [
        { id: "rule-1", type: "allow", cidr: "192.168.1.0/24", description: "Corporate network" },
        { id: "rule-2", type: "allow", cidr: "10.0.0.0/8", description: "VPN network" }
      ],
      created: "2025-06-12T10:30:00Z",
      status: "active"
    }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<IPFilterConfig | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [yamlDialogOpen, setYamlDialogOpen] = React.useState(false);
  const [selectedConfigForYaml, setSelectedConfigForYaml] = React.useState<IPFilterConfig | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    namespace: "default",
    targetType: "HTTPRoute" as "Gateway" | "HTTPRoute",
    targetName: "",
    defaultAction: "deny" as "allow" | "deny",
    rules: [] as IPRule[],
    newRuleType: "allow" as "allow" | "deny",
    newRuleCidr: "",
    newRuleDescription: ""
  });

  const commonCIDRs = [
    { cidr: "127.0.0.1/32", description: "Localhost" },
    { cidr: "192.168.0.0/16", description: "Private network (Class C)" },
    { cidr: "10.0.0.0/8", description: "Private network (Class A)" },
    { cidr: "172.16.0.0/12", description: "Private network (Class B)" },
    { cidr: "0.0.0.0/0", description: "All IPv4 addresses (use with caution)" }
  ];

  const handleCreateNew = () => {
    setEditingConfig(null);
    setFormData({
      name: "",
      namespace: "default",
      targetType: "HTTPRoute",
      targetName: "",
      defaultAction: "deny",
      rules: [],
      newRuleType: "allow",
      newRuleCidr: "",
      newRuleDescription: ""
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleEdit = (config: IPFilterConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      namespace: config.namespace,
      targetType: config.targetType,
      targetName: config.targetName,
      defaultAction: config.defaultAction,
      rules: [...config.rules],
      newRuleType: "allow",
      newRuleCidr: "",
      newRuleDescription: ""
    });
    setDialogOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this IP Filter policy?")) {
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

      // Validate CIDR rules
      for (const rule of formData.rules) {
        if (!isValidCIDR(rule.cidr)) {
          throw new Error(`Invalid CIDR format: ${rule.cidr}`);
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newConfig: IPFilterConfig = {
        id: editingConfig?.id || `ip-${Date.now()}`,
        name: formData.name,
        namespace: formData.namespace,
        targetType: formData.targetType,
        targetName: formData.targetName,
        defaultAction: formData.defaultAction,
        rules: [...formData.rules],
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
      setError(err.message || "Failed to save IP Filter policy");
    } finally {
      setIsCreating(false);
    }
  };

  const isValidCIDR = (cidr: string): boolean => {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(cidr)) return false;
    
    const [ip, prefix] = cidr.split('/');
    const prefixNum = parseInt(prefix);
    
    if (prefixNum < 0 || prefixNum > 32) return false;
    
    const octets = ip.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  };

  const addRule = () => {
    if (!formData.newRuleCidr) return;
    
    if (!isValidCIDR(formData.newRuleCidr)) {
      setError("Invalid CIDR format. Please use format like 192.168.1.0/24");
      return;
    }

    const newRule: IPRule = {
      id: `rule-${Date.now()}`,
      type: formData.newRuleType,
      cidr: formData.newRuleCidr,
      description: formData.newRuleDescription || undefined
    };

    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule],
      newRuleCidr: "",
      newRuleDescription: ""
    }));
    setError(null);
  };

  const removeRule = (ruleId: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.id !== ruleId)
    }));
  };

  const addCommonCIDR = (cidr: string) => {
    setFormData(prev => ({ ...prev, newRuleCidr: cidr }));
  };

  const generateIPFilterYAML = (config: IPFilterConfig): string => {
    const targetRef = config.targetType === "Gateway" ? {
      group: "gateway.networking.k8s.io",
      kind: "Gateway",
      name: config.targetName
    } : {
      group: "gateway.networking.k8s.io", 
      kind: "HTTPRoute",
      name: config.targetName
    };

    return `apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: ${config.name}
  namespace: ${config.namespace}
spec:
  targetRef:
    group: ${targetRef.group}
    kind: ${targetRef.kind}
    name: ${targetRef.name}
  authorization:
    defaultAction: ${config.defaultAction}${config.rules.length > 0 ? `
    rules:${config.rules.map(rule => `
      - action: ${rule.type}
        from:
          - source:
              remoteIPBlocks:
                - ${rule.cidr}${rule.description ? `
        # ${rule.description}` : ''}`).join('')}` : ''}`;
  };

  const handleViewYaml = (config: IPFilterConfig) => {
    setSelectedConfigForYaml(config);
    setYamlDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IPFilterIcon />
            IP Access Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control access to your services based on client IP addresses or CIDR ranges. 
            Useful for restricting admin access or implementing geo-blocking.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Add IP Filter
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Important Security Considerations
        </Typography>
        <Typography variant="body2">
          IP filtering can be bypassed by proxies, VPNs, and other methods. Use it as part of 
          a defense-in-depth strategy, not as the sole security measure. Consider combining 
          with authentication for sensitive resources.
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
                  <IPFilterIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {config.targetType} / {config.targetName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Default Action:
                  </Typography>
                  <Chip 
                    size="small" 
                    label={config.defaultAction.toUpperCase()}
                    color={config.defaultAction === "allow" ? "success" : "error"}
                    icon={config.defaultAction === "allow" ? <AllowIcon /> : <DenyIcon />}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Rules: {config.rules.length} configured
                </Typography>
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
              <IPFilterIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No IP Filter Policies
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first IP filter policy to control access based on client IP addresses.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Create IP Filter Policy
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? "Edit IP Filter Policy" : "Create IP Filter Policy"}
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
                placeholder="admin-ip-filter"
                helperText="Unique name for this IP filter policy"
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
          </Grid>

          {/* Default Action */}
          <Box sx={{ mt: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Default Action</FormLabel>
              <RadioGroup
                row
                value={formData.defaultAction}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultAction: e.target.value as "allow" | "deny" }))}
              >
                <FormControlLabel 
                  value="allow" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AllowIcon color="success" />
                      Allow by default
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="deny" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DenyIcon color="error" />
                      Deny by default (Recommended)
                    </Box>
                  } 
                />
              </RadioGroup>
              <Typography variant="caption" color="text.secondary">
                The default action taken for IPs that don't match any rules
              </Typography>
            </FormControl>
          </Box>

          {/* IP Rules */}
          <Accordion sx={{ mt: 2 }} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">IP Rules ({formData.rules.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Add Rule Form */}
              <Box sx={{ mb: 3, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Rule
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Action</InputLabel>
                      <Select
                        value={formData.newRuleType}
                        onChange={(e) => setFormData(prev => ({ ...prev, newRuleType: e.target.value as "allow" | "deny" }))}
                        label="Action"
                      >
                        <MenuItem value="allow">Allow</MenuItem>
                        <MenuItem value="deny">Deny</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="CIDR Range"
                      value={formData.newRuleCidr}
                      onChange={(e) => setFormData(prev => ({ ...prev, newRuleCidr: e.target.value }))}
                      placeholder="192.168.1.0/24"
                      helperText="IP address or CIDR range"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      value={formData.newRuleDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, newRuleDescription: e.target.value }))}
                      placeholder="Corporate network"
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={addRule}
                      sx={{ height: "56px" }}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>

                {/* Common CIDR Ranges */}
                <Typography variant="subtitle2" gutterBottom>
                  Common CIDR Ranges:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {commonCIDRs.map((item) => (
                    <Chip
                      key={item.cidr}
                      label={`${item.cidr} (${item.description})`}
                      variant="outlined"
                      onClick={() => addCommonCIDR(item.cidr)}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Rules Table */}
              {formData.rules.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>CIDR Range</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Chip
                              size="small"
                              label={rule.type.toUpperCase()}
                              color={rule.type === "allow" ? "success" : "error"}
                              icon={rule.type === "allow" ? <AllowIcon /> : <DenyIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {rule.cidr}
                            </Typography>
                          </TableCell>
                          <TableCell>{rule.description || "-"}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeRule(rule.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    No rules configured. Add rules above to control access based on IP addresses.
                    Without rules, only the default action will be applied.
                  </Typography>
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Policy Preview */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Policy Preview</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="subtitle2" fontWeight="bold">
                  How this policy works:
                </Typography>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Client IP is checked against rules in order</li>
                    <li>First matching rule determines the action</li>
                    <li>If no rules match, the default action ({formData.defaultAction}) is taken</li>
                  </ol>
                </Typography>
              </Alert>
              
              {formData.rules.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Rule Evaluation Order:
                  </Typography>
                  {formData.rules.map((rule, index) => (
                    <Typography key={rule.id} variant="body2" sx={{ fontFamily: "monospace", mb: 0.5 }}>
                      {index + 1}. {rule.cidr} → {rule.type.toUpperCase()} 
                      {rule.description && ` (${rule.description})`}
                    </Typography>
                  ))}
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontStyle: "italic" }}>
                    *. (all others) → {formData.defaultAction.toUpperCase()}
                  </Typography>
                </Box>
              )}
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

      {/* YAML View Dialog */}
      <Dialog
        open={yamlDialogOpen}
        onClose={() => setYamlDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>IP Filter Policy YAML</DialogTitle>
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
                {generateIPFilterYAML(selectedConfigForYaml)}
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