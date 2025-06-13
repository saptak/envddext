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
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import {
  Code as YamlIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Check as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  FileCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  PlayArrow as ApplyIcon
} from "@mui/icons-material";

interface YamlEditorProps {
  initialYaml?: string;
  resourceType?: "Gateway" | "HTTPRoute" | "SecurityPolicy" | "Custom";
  onSave?: (yaml: string) => void;
  onApply?: (yaml: string) => void;
  readonly?: boolean;
  title?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    line: number;
    column: number;
    message: string;
    severity: "error" | "warning";
  }>;
  suggestions: string[];
}

export const YamlEditor: React.FC<YamlEditorProps> = ({
  initialYaml = "",
  resourceType = "Custom",
  onSave,
  onApply,
  readonly = false,
  title = "YAML Editor"
}) => {
  const [yaml, setYaml] = React.useState(initialYaml);
  const [validation, setValidation] = React.useState<ValidationResult>({
    isValid: true,
    errors: [],
    suggestions: []
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [autoValidate, setAutoValidate] = React.useState(true);
  const [lineNumbers, setLineNumbers] = React.useState(true);

  const textareaRef = React.useRef<HTMLDivElement>(null);

  // Sample templates for different resource types
  const templates = {
    Gateway: `apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: my-gateway
  namespace: default
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: http
    protocol: HTTP
    port: 80`,
    HTTPRoute: `apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: my-route
  namespace: default
spec:
  parentRefs:
  - name: my-gateway
  hostnames:
  - "example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: my-service
      port: 80`,
    SecurityPolicy: `apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: my-security-policy
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: my-route
  basicAuth:
    users:
      secretRef:
        name: basic-auth-secret`,
    Custom: `# Enter your YAML configuration here
apiVersion: v1
kind: ConfigMap
metadata:
  name: example-config
  namespace: default
data:
  key: value`
  };

  React.useEffect(() => {
    if (autoValidate) {
      validateYaml(yaml);
    }
  }, [yaml, autoValidate]);

  const validateYaml = (yamlContent: string) => {
    try {
      if (!yamlContent.trim()) {
        setValidation({ isValid: true, errors: [], suggestions: [] });
        return;
      }

      // Basic YAML syntax validation
      const lines = yamlContent.split('\n');
      const errors: ValidationResult['errors'] = [];
      const suggestions: string[] = [];

      // Check for common YAML issues
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for tabs (should use spaces)
        if (line.includes('\t')) {
          errors.push({
            line: lineNum,
            column: line.indexOf('\t') + 1,
            message: "Use spaces instead of tabs for indentation",
            severity: "warning"
          });
        }

        // Check for trailing spaces
        if (line.endsWith(' ')) {
          errors.push({
            line: lineNum,
            column: line.length,
            message: "Trailing whitespace",
            severity: "warning"
          });
        }

        // Check for missing required fields based on resource type
        if (resourceType === "Gateway" && line.includes("kind: Gateway")) {
          if (!yamlContent.includes("gatewayClassName:")) {
            suggestions.push("Consider adding 'gatewayClassName' field");
          }
          if (!yamlContent.includes("listeners:")) {
            suggestions.push("Gateway should have at least one listener");
          }
        }

        if (resourceType === "HTTPRoute" && line.includes("kind: HTTPRoute")) {
          if (!yamlContent.includes("parentRefs:")) {
            suggestions.push("HTTPRoute should reference a parent Gateway");
          }
          if (!yamlContent.includes("rules:")) {
            suggestions.push("HTTPRoute should have at least one rule");
          }
        }
      });

      // Check for required Kubernetes fields
      if (!yamlContent.includes("apiVersion:")) {
        errors.push({
          line: 1,
          column: 1,
          message: "Missing required field 'apiVersion'",
          severity: "error"
        });
      }

      if (!yamlContent.includes("kind:")) {
        errors.push({
          line: 1,
          column: 1,
          message: "Missing required field 'kind'",
          severity: "error"
        });
      }

      if (!yamlContent.includes("metadata:")) {
        errors.push({
          line: 1,
          column: 1,
          message: "Missing required field 'metadata'",
          severity: "error"
        });
      }

      setValidation({
        isValid: errors.filter(e => e.severity === "error").length === 0,
        errors,
        suggestions
      });

    } catch (error) {
      setValidation({
        isValid: false,
        errors: [{
          line: 1,
          column: 1,
          message: "Invalid YAML syntax",
          severity: "error"
        }],
        suggestions: []
      });
    }
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(yaml);
      }
    } catch (error) {
      console.error("Failed to save YAML:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = async () => {
    if (!validation.isValid) {
      return;
    }

    setIsApplying(true);
    try {
      if (onApply) {
        await onApply(yaml);
      }
    } catch (error) {
      console.error("Failed to apply YAML:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml);
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resourceType.toLowerCase()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setYaml(content);
      };
      reader.readAsText(file);
    }
  };

  const insertTemplate = () => {
    setYaml(templates[resourceType]);
  };

  const addLineNumbers = (content: string) => {
    return content.split('\n').map((line, index) => {
      const lineNum = (index + 1).toString().padStart(3, ' ');
      return `${lineNum} | ${line}`;
    }).join('\n');
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <YamlIcon />
          {title}
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Insert template">
            <Button
              size="small"
              variant="outlined"
              onClick={insertTemplate}
              disabled={readonly}
            >
              Template
            </Button>
          </Tooltip>
          
          <Tooltip title="Copy to clipboard">
            <IconButton onClick={handleCopy}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download YAML">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          {!readonly && (
            <>
              <Tooltip title="Upload YAML file">
                <IconButton component="label">
                  <UploadIcon />
                  <input
                    type="file"
                    accept=".yaml,.yml"
                    hidden
                    onChange={handleUpload}
                  />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!validation.isValid || isSaving}
                size="small"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              
              {onApply && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<ApplyIcon />}
                  onClick={handleApply}
                  disabled={!validation.isValid || isApplying}
                  size="small"
                >
                  {isApplying ? "Applying..." : "Apply"}
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Validation Status */}
      <Box sx={{ mb: 2 }}>
        {validation.isValid ? (
          <Alert severity="success" icon={<ValidIcon />}>
            <Typography variant="body2">
              YAML is valid and ready to use
            </Typography>
          </Alert>
        ) : (
          <Alert severity="error" icon={<ErrorIcon />}>
            <Typography variant="body2">
              YAML has {validation.errors.filter(e => e.severity === "error").length} error(s) 
              and {validation.errors.filter(e => e.severity === "warning").length} warning(s)
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Editor Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Editor Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoValidate}
                    onChange={(e) => setAutoValidate(e.target.checked)}
                  />
                }
                label="Auto-validate YAML"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={lineNumbers}
                    onChange={(e) => setLineNumbers(e.target.checked)}
                  />
                }
                label="Show line numbers"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={resourceType}
                  label="Resource Type"
                  disabled={readonly}
                >
                  <MenuItem value="Gateway">Gateway</MenuItem>
                  <MenuItem value="HTTPRoute">HTTPRoute</MenuItem>
                  <MenuItem value="SecurityPolicy">SecurityPolicy</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* YAML Editor */}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <TextField
          ref={textareaRef}
          fullWidth
          multiline
          minRows={20}
          maxRows={30}
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          disabled={readonly}
          placeholder={`Enter your ${resourceType} YAML configuration here...`}
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            },
            '& .MuiInputBase-input': {
              padding: '16px !important',
            }
          }}
          InputProps={{
            style: {
              backgroundColor: '#f8f9fa',
              border: 'none'
            }
          }}
        />
      </Paper>

      {/* Validation Results */}
      {(validation.errors.length > 0 || validation.suggestions.length > 0) && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Validation Results ({validation.errors.length} issues, {validation.suggestions.length} suggestions)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {validation.errors.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Issues:
                </Typography>
                <List dense>
                  {validation.errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {error.severity === "error" ? 
                          <ErrorIcon color="error" /> : 
                          <WarningIcon color="warning" />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary={error.message}
                        secondary={`Line ${error.line}, Column ${error.column}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {validation.suggestions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Suggestions:
                </Typography>
                <List dense>
                  {validation.suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>YAML Preview</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
            <Typography component="pre" sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {lineNumbers ? addLineNumbers(yaml) : yaml}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          <Button onClick={handleCopy} startIcon={<CopyIcon />}>
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};