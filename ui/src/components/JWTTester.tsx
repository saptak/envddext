import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Tooltip
} from "@mui/material";
import {
  PlayArrow as TestIcon,
  Security as JWTIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Refresh as GenerateIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Info as InfoIcon,
  Code as TokenIcon,
  Key as KeyIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

// JWT Testing interfaces
interface JWTTestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  token: string;
  validateSignature: boolean;
  checkExpiration: boolean;
  expectedIssuer?: string;
  expectedAudience?: string;
  headers: Array<{ key: string; value: string }>;
}

interface JWTTestResult {
  valid: boolean;
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  body: string;
  tokenAnalysis: {
    header: any;
    payload: any;
    signature: string;
    isExpired: boolean;
    issuer?: string;
    audience?: string | string[];
    subject?: string;
    expiresAt?: string;
    issuedAt?: string;
    notBefore?: string;
  };
  extractedClaims: Record<string, any>;
  validationErrors: string[];
}

interface JWTGeneratorConfig {
  issuer: string;
  audience: string;
  subject: string;
  expirationMinutes: number;
  customClaims: Record<string, any>;
}

interface JWTTesterProps {
  onTestComplete?: (result: JWTTestResult) => void;
}

export const JWTTester: React.FC<JWTTesterProps> = ({ onTestComplete }) => {
  const [config, setConfig] = React.useState<JWTTestConfig>({
    url: "",
    method: "GET",
    token: "",
    validateSignature: false,
    checkExpiration: true,
    headers: []
  });

  const [generatorConfig, setGeneratorConfig] = React.useState<JWTGeneratorConfig>({
    issuer: "https://example.auth0.com/",
    audience: "api.example.com",
    subject: "user123",
    expirationMinutes: 60,
    customClaims: {}
  });

  const [testResult, setTestResult] = React.useState<JWTTestResult | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [currentTab, setCurrentTab] = React.useState(0);

  // Sample JWT tokens for testing
  const sampleTokens = {
    valid: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5hdXRoMC5jb20vIiwiYXVkIjoiYXBpLmV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    expired: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjIsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5hdXRoMC5jb20vIiwiYXVkIjoiYXBpLmV4YW1wbGUuY29tIn0.Gf7_VN8wL7Xr_RiNbWJZ4L5KkKJ7N8L3RL6kM5K4dZo"
  };

  const parseJWT = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const signature = parts[2];

      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      return {
        header,
        payload,
        signature,
        isExpired,
        issuer: payload.iss,
        audience: payload.aud,
        subject: payload.sub,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
        notBefore: payload.nbf ? new Date(payload.nbf * 1000).toISOString() : undefined
      };
    } catch (err) {
      throw new Error('Failed to parse JWT token');
    }
  };

  const validateJWT = (token: string): string[] => {
    const errors: string[] = [];
    
    try {
      const analysis = parseJWT(token);
      
      if (config.checkExpiration && analysis.isExpired) {
        errors.push('Token has expired');
      }
      
      if (config.expectedIssuer && analysis.issuer !== config.expectedIssuer) {
        errors.push(`Invalid issuer. Expected: ${config.expectedIssuer}, Got: ${analysis.issuer}`);
      }
      
      if (config.expectedAudience) {
        const audiences = Array.isArray(analysis.audience) ? analysis.audience : [analysis.audience];
        if (!audiences.includes(config.expectedAudience)) {
          errors.push(`Invalid audience. Expected: ${config.expectedAudience}, Got: ${audiences.join(', ')}`);
        }
      }
      
      if (!analysis.subject) {
        errors.push('Token missing subject (sub) claim');
      }
      
    } catch (err) {
      errors.push(`Invalid JWT format: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    
    return errors;
  };

  const generateSampleJWT = async () => {
    setGenerating(true);
    try {
      // This is a mock implementation - in real scenarios, you'd use a proper JWT library
      const header = {
        alg: "HS256",
        typ: "JWT"
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: generatorConfig.issuer,
        aud: generatorConfig.audience,
        sub: generatorConfig.subject,
        iat: now,
        exp: now + (generatorConfig.expirationMinutes * 60),
        ...generatorConfig.customClaims
      };

      // Mock signing - in real implementation, use proper JWT library
      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const signature = "mock_signature_" + Math.random().toString(36).substr(2, 9);
      
      const token = `${encodedHeader}.${encodedPayload}.${signature}`;
      
      setConfig(prev => ({ ...prev, token }));
      setSuccess("Sample JWT token generated successfully");
    } catch (err) {
      setError("Failed to generate JWT token");
      console.error("Error generating JWT:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleJWTTest = async () => {
    if (!config.url || !config.token) {
      setError("URL and JWT token are required");
      return;
    }

    setTesting(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      
      // Parse and validate JWT
      const tokenAnalysis = parseJWT(config.token);
      const validationErrors = validateJWT(config.token);
      
      // Simulate HTTP request with JWT
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      };
      
      // Add custom headers
      config.headers.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });

      // Mock HTTP request - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const responseTime = Date.now() - startTime;
      const statusCode = validationErrors.length > 0 ? 401 : 200;
      
      // Mock response
      const mockResponse = {
        message: validationErrors.length > 0 ? "Unauthorized" : "Success",
        userId: tokenAnalysis.subject,
        scope: tokenAnalysis.payload.scope || "read:api"
      };

      // Extract claims for header mapping
      const extractedClaims = {
        sub: tokenAnalysis.subject,
        iss: tokenAnalysis.issuer,
        aud: tokenAnalysis.audience,
        exp: tokenAnalysis.expiresAt,
        iat: tokenAnalysis.issuedAt,
        ...Object.keys(tokenAnalysis.payload)
          .filter(key => !['sub', 'iss', 'aud', 'exp', 'iat', 'nbf'].includes(key))
          .reduce((acc, key) => ({ ...acc, [key]: tokenAnalysis.payload[key] }), {})
      };

      const result: JWTTestResult = {
        valid: validationErrors.length === 0,
        statusCode,
        responseTime,
        headers: {
          'Content-Type': 'application/json',
          'X-JWT-Subject': tokenAnalysis.subject || '',
          'X-JWT-Issuer': tokenAnalysis.issuer || '',
          ...(statusCode === 200 && { 'X-User-ID': tokenAnalysis.subject || '' })
        },
        body: JSON.stringify(mockResponse, null, 2),
        tokenAnalysis,
        extractedClaims,
        validationErrors
      };

      setTestResult(result);
      
      if (onTestComplete) {
        onTestComplete(result);
      }
      
      if (validationErrors.length === 0) {
        setSuccess("JWT validation successful");
      } else {
        setError(`JWT validation failed: ${validationErrors.join(', ')}`);
      }
      
    } catch (err) {
      setError(`JWT test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error("Error testing JWT:", err);
    } finally {
      setTesting(false);
    }
  };

  const addHeader = () => {
    setConfig(prev => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "" }]
    }));
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      )
    }));
  };

  const removeHeader = (index: number) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess("Copied to clipboard");
    }).catch(() => {
      setError("Failed to copy to clipboard");
    });
  };

  const useSampleToken = (type: "valid" | "expired") => {
    setConfig(prev => ({ ...prev, token: sampleTokens[type] }));
    setSuccess(`${type === "valid" ? "Valid" : "Expired"} sample token loaded`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <JWTIcon sx={{ color: "primary.main", fontSize: 32 }} />
        <Box>
          <Typography variant="h6">JWT Token Testing</Typography>
          <Typography variant="body2" color="text.secondary">
            Test JWT authentication with token validation and claim extraction
          </Typography>
        </Box>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Token Testing" />
          <Tab label="Token Generator" />
        </Tabs>
      </Box>

      {/* Token Testing Tab */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {/* Configuration Panel */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TokenIcon />
                  Test Configuration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Endpoint URL"
                      value={config.url}
                      onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="http://localhost:8080/api/protected"
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>HTTP Method</InputLabel>
                      <Select
                        value={config.method}
                        onChange={(e) => setConfig(prev => ({ ...prev, method: e.target.value as any }))}
                      >
                        <MenuItem value="GET">GET</MenuItem>
                        <MenuItem value="POST">POST</MenuItem>
                        <MenuItem value="PUT">PUT</MenuItem>
                        <MenuItem value="DELETE">DELETE</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="JWT Token"
                      value={config.token}
                      onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      required
                    />
                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => useSampleToken("valid")}
                      >
                        Use Valid Sample
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => useSampleToken("expired")}
                      >
                        Use Expired Sample
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CopyIcon />}
                        onClick={() => copyToClipboard(config.token)}
                        disabled={!config.token}
                      >
                        Copy Token
                      </Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">Validation Options</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={config.validateSignature}
                                  onChange={(e) => setConfig(prev => ({ ...prev, validateSignature: e.target.checked }))}
                                />
                              }
                              label="Validate Signature (requires JWKS endpoint)"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={config.checkExpiration}
                                  onChange={(e) => setConfig(prev => ({ ...prev, checkExpiration: e.target.checked }))}
                                />
                              }
                              label="Check Token Expiration"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Expected Issuer (Optional)"
                              value={config.expectedIssuer || ""}
                              onChange={(e) => setConfig(prev => ({ ...prev, expectedIssuer: e.target.value }))}
                              placeholder="https://example.auth0.com/"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Expected Audience (Optional)"
                              value={config.expectedAudience || ""}
                              onChange={(e) => setConfig(prev => ({ ...prev, expectedAudience: e.target.value }))}
                              placeholder="api.example.com"
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  <Grid item xs={12}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          Custom Headers ({config.headers.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {config.headers.map((header, index) => (
                            <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                              <Grid item xs={5}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Header Name"
                                  value={header.key}
                                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                                  placeholder="X-Custom-Header"
                                />
                              </Grid>
                              <Grid item xs={5}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Header Value"
                                  value={header.value}
                                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                                  placeholder="custom-value"
                                />
                              </Grid>
                              <Grid item xs={2}>
                                <IconButton
                                  color="error"
                                  onClick={() => removeHeader(index)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          ))}
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={addHeader}
                            sx={{ mt: 1 }}
                          >
                            Add Header
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<TestIcon />}
                      onClick={handleJWTTest}
                      disabled={testing || !config.url || !config.token}
                    >
                      {testing ? "Testing..." : "Test JWT Authentication"}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Panel */}
          <Grid item xs={12} lg={6}>
            {testing && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Testing JWT Authentication...
                  </Typography>
                  <LinearProgress />
                </CardContent>
              </Card>
            )}

            {testResult && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {testResult.valid ? (
                      <ValidIcon sx={{ color: "success.main" }} />
                    ) : (
                      <InvalidIcon sx={{ color: "error.main" }} />
                    )}
                    Test Results
                  </Typography>

                  {/* Test Summary */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 1, textAlign: "center" }}>
                        <Typography variant="h6" color={testResult.valid ? "success.main" : "error.main"}>
                          {testResult.statusCode}
                        </Typography>
                        <Typography variant="caption">Status</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 1, textAlign: "center" }}>
                        <Typography variant="h6" color="info.main">
                          {testResult.responseTime}ms
                        </Typography>
                        <Typography variant="caption">Response Time</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 1, textAlign: "center" }}>
                        <Typography variant="h6" color={testResult.tokenAnalysis.isExpired ? "error.main" : "success.main"}>
                          {testResult.tokenAnalysis.isExpired ? "Expired" : "Valid"}
                        </Typography>
                        <Typography variant="caption">Token Status</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 1, textAlign: "center" }}>
                        <Typography variant="h6" color="primary.main">
                          {Object.keys(testResult.extractedClaims).length}
                        </Typography>
                        <Typography variant="caption">Claims</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Validation Errors */}
                  {testResult.validationErrors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Validation Errors:</Typography>
                      {testResult.validationErrors.map((error, index) => (
                        <Typography key={index} variant="body2">• {error}</Typography>
                      ))}
                    </Alert>
                  )}

                  {/* Token Analysis */}
                  <Accordion sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">JWT Token Analysis</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Token Header</Typography>
                          <Paper sx={{ p: 1, bgcolor: "grey.50" }}>
                            <pre style={{ fontSize: "12px", margin: 0, overflow: "auto" }}>
                              {JSON.stringify(testResult.tokenAnalysis.header, null, 2)}
                            </pre>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Token Payload</Typography>
                          <Paper sx={{ p: 1, bgcolor: "grey.50" }}>
                            <pre style={{ fontSize: "12px", margin: 0, overflow: "auto" }}>
                              {JSON.stringify(testResult.tokenAnalysis.payload, null, 2)}
                            </pre>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>Token Details</Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell><strong>Issuer</strong></TableCell>
                                  <TableCell>{testResult.tokenAnalysis.issuer || "N/A"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Subject</strong></TableCell>
                                  <TableCell>{testResult.tokenAnalysis.subject || "N/A"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Audience</strong></TableCell>
                                  <TableCell>
                                    {Array.isArray(testResult.tokenAnalysis.audience) 
                                      ? testResult.tokenAnalysis.audience.join(", ")
                                      : testResult.tokenAnalysis.audience || "N/A"}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Expires At</strong></TableCell>
                                  <TableCell>{testResult.tokenAnalysis.expiresAt || "N/A"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Issued At</strong></TableCell>
                                  <TableCell>{testResult.tokenAnalysis.issuedAt || "N/A"}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  {/* Extracted Claims */}
                  <Accordion sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Extracted Claims</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Claims that would be mapped to HTTP headers for downstream services:
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Claim</TableCell>
                              <TableCell>Value</TableCell>
                              <TableCell>Type</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(testResult.extractedClaims).map(([claim, value]) => (
                              <TableRow key={claim}>
                                <TableCell><code>{claim}</code></TableCell>
                                <TableCell>{String(value)}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={typeof value} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>

                  {/* Response Details */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">HTTP Response</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Response Headers</Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableBody>
                                {Object.entries(testResult.headers).map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell><code>{key}</code></TableCell>
                                    <TableCell>{value}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Response Body</Typography>
                          <Paper sx={{ p: 1, bgcolor: "grey.50" }}>
                            <pre style={{ fontSize: "12px", margin: 0, overflow: "auto" }}>
                              {testResult.body}
                            </pre>
                          </Paper>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Token Generator Tab */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GenerateIcon />
                  JWT Token Generator
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Generate sample JWT tokens for testing purposes
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Issuer"
                      value={generatorConfig.issuer}
                      onChange={(e) => setGeneratorConfig(prev => ({ ...prev, issuer: e.target.value }))}
                      placeholder="https://example.auth0.com/"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Audience"
                      value={generatorConfig.audience}
                      onChange={(e) => setGeneratorConfig(prev => ({ ...prev, audience: e.target.value }))}
                      placeholder="api.example.com"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Subject (User ID)"
                      value={generatorConfig.subject}
                      onChange={(e) => setGeneratorConfig(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="user123"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Expiration (Minutes)"
                      value={generatorConfig.expirationMinutes}
                      onChange={(e) => setGeneratorConfig(prev => ({ ...prev, expirationMinutes: parseInt(e.target.value) || 60 }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<GenerateIcon />}
                      onClick={generateSampleJWT}
                      disabled={generating}
                    >
                      {generating ? "Generating..." : "Generate Sample JWT"}
                    </Button>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> This generates mock JWT tokens for testing purposes only. 
                    In production, use proper JWT libraries with secure signing.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generated Token
                </Typography>
                {config.token ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      value={config.token}
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<CopyIcon />}
                      onClick={() => copyToClipboard(config.token)}
                      sx={{ mr: 1 }}
                    >
                      Copy Token
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentTab(0)}
                    >
                      Test Token
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Generate a token to see it here
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};