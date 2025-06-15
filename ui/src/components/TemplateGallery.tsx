import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Alert,
  Chip,
  Snackbar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  CardMedia,
  Tabs,
  Tab,
  CircularProgress
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  Code as CodeIcon,
  PlayArrow as DeployIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  CloudDownload as DownloadIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  Check as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Delete as UndeployIcon,
  Refresh as RefreshIcon,
  Person as AuthorIcon,
  Tag as TagIcon,
  Security as SecurityIcon,
  Hub as HubIcon,
  Router as RouterIcon,
  Speed as SpeedIcon
} from "@mui/icons-material";
import { createDockerDesktopClient } from "@docker/extension-api-client";

const ddClient = createDockerDesktopClient();

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  author: string;
  version: string;
  tags: string[];
  yamlUrl: string;
  documentationUrl?: string;
  prerequisites: string[];
  estimatedTime: string;
  featured: boolean;
  downloads: number;
  rating: number;
  lastUpdated: string;
  thumbnail?: string;
  examples?: Array<{
    title: string;
    description: string;
    yamlContent: string;
  }>;
}

interface TemplateGalleryProps {
  onTemplateSelect?: (template: Template) => void;
  onTemplateApply?: (template: Template) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onTemplateSelect,
  onTemplateApply
}) => {
  const [templates, setTemplates] = React.useState<Template[]>([
    {
      id: "basic-http-routing",
      name: "Basic HTTP Routing",
      description: "Simple HTTP routing with echo service for testing and learning",
      category: "Basic",
      subcategory: "Routing",
      difficulty: "Beginner",
      author: "Envoy Gateway Team",
      version: "1.0.0",
      tags: ["http", "routing", "beginner", "echo"],
      yamlUrl: "https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/templates/basic-http/echo-service.yaml",
      prerequisites: ["Kubernetes cluster", "Envoy Gateway installed"],
      estimatedTime: "5 minutes",
      featured: true,
      downloads: 1250,
      rating: 4.8,
      lastUpdated: "2025-06-10"
    },
    {
      id: "tls-termination",
      name: "TLS Termination",
      description: "HTTPS Gateway with TLS certificate management and secure routing",
      category: "Security",
      subcategory: "TLS",
      difficulty: "Intermediate",
      author: "Security Team",
      version: "2.1.0",
      tags: ["tls", "https", "security", "certificates"],
      yamlUrl: "https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/templates/tls-termination/tls-termination.yaml",
      documentationUrl: "https://gateway.envoyproxy.io/latest/user/tls-termination/",
      prerequisites: ["cert-manager", "TLS certificates"],
      estimatedTime: "15 minutes",
      featured: true,
      downloads: 890,
      rating: 4.6,
      lastUpdated: "2025-06-08"
    },
    {
      id: "traffic-splitting",
      name: "Traffic Splitting",
      description: "Canary deployments and A/B testing with weighted traffic distribution",
      category: "Traffic Management",
      subcategory: "Load Balancing",
      difficulty: "Advanced",
      author: "Platform Team",
      version: "1.5.0",
      tags: ["canary", "traffic-splitting", "a-b-testing", "deployment"],
      yamlUrl: "https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/templates/traffic-splitting/traffic-splitting.yaml",
      documentationUrl: "https://gateway.envoyproxy.io/latest/user/traffic-splitting/",
      prerequisites: ["Multiple service versions", "LoadBalancer"],
      estimatedTime: "20 minutes",
      featured: false,
      downloads: 456,
      rating: 4.4,
      lastUpdated: "2025-06-05"
    },
    {
      id: "basic-auth-security",
      name: "Basic Authentication",
      description: "HTTP Basic Authentication with username/password protection",
      category: "Security",
      subcategory: "Authentication",
      difficulty: "Intermediate",
      author: "Security Team",
      version: "1.2.0",
      tags: ["authentication", "basic-auth", "security", "credentials"],
      yamlUrl: "https://raw.githubusercontent.com/envoyproxy/gateway/main/examples/kubernetes/quickstart.yaml",
      prerequisites: ["Kubernetes Secrets", "HTTPRoute"],
      estimatedTime: "10 minutes",
      featured: false,
      downloads: 678,
      rating: 4.3,
      lastUpdated: "2025-06-07"
    },
    {
      id: "cors-policy",
      name: "CORS Configuration",
      description: "Cross-Origin Resource Sharing policy for web applications",
      category: "Security",
      subcategory: "CORS",
      difficulty: "Beginner",
      author: "Web Team",
      version: "1.0.0",
      tags: ["cors", "web", "api", "cross-origin"],
      yamlUrl: "https://raw.githubusercontent.com/envoyproxy/gateway/main/examples/kubernetes/quickstart.yaml",
      prerequisites: ["HTTPRoute", "Web application"],
      estimatedTime: "8 minutes",
      featured: false,
      downloads: 543,
      rating: 4.5,
      lastUpdated: "2025-06-09"
    },
    {
      id: "rate-limiting",
      name: "Rate Limiting",
      description: "Request rate limiting and throttling policies for API protection",
      category: "Traffic Management",
      subcategory: "Rate Limiting",
      difficulty: "Advanced",
      author: "API Team",
      version: "2.0.0",
      tags: ["rate-limiting", "throttling", "api", "protection"],
      yamlUrl: "https://raw.githubusercontent.com/envoyproxy/gateway/main/examples/kubernetes/quickstart.yaml",
      documentationUrl: "https://gateway.envoyproxy.io/latest/user/rate-limiting/",
      prerequisites: ["Rate limit service", "Redis"],
      estimatedTime: "25 minutes",
      featured: false,
      downloads: 334,
      rating: 4.2,
      lastUpdated: "2025-06-06"
    }
  ]);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("featured");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [currentTab, setCurrentTab] = React.useState(0);
  const [deployingTemplate, setDeployingTemplate] = React.useState<string | null>(null);
  const [deploymentError, setDeploymentError] = React.useState<string | null>(null);
  const [deploymentSuccess, setDeploymentSuccess] = React.useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = React.useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = React.useState(false);
  const [undeployingTemplate, setUndeployingTemplate] = React.useState<string | null>(null);
  const [undeployDialog, setUndeployDialog] = React.useState<{
    open: boolean;
    template: Template | null;
    resources: string[];
  }>({ open: false, template: null, resources: [] });
  const [deployedTemplates, setDeployedTemplates] = React.useState<Set<string>>(new Set());

  const itemsPerPage = 6;

  const categories = ["All", ...Array.from(new Set(templates.map(t => t.category)))];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || template.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    }).sort((a, b) => {
      switch (sortBy) {
        case "featured":
          return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating - a.rating;
        case "recent":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [templates, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const paginatedTemplates = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTemplates.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTemplates, currentPage]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setDetailsOpen(true);
    setDeploymentError(null);
  };

  const handleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  // Check if a template is deployed by checking for its unique resources
  const checkTemplateDeployment = React.useCallback(async (template: Template) => {
    try {
      if (!ddClient?.extension?.host?.cli) return false;

      // Special handling for basic-http-routing template
      if (template.id === 'basic-http-routing') {
        return await checkBasicHttpRoutingDeployment();
      }

      // Get the template YAML to parse resources
      const response = await fetch(template.yamlUrl);
      if (!response.ok) return false;
      
      const yamlContent = await response.text();
      
      // Parse YAML to find resource names and types
      const resources = parseTemplateResources(yamlContent);
      
      // Get unique resources for this template (exclude common ones like namespace)
      const uniqueResources = getUniqueResourcesForTemplate(template.id, resources);
      
      if (uniqueResources.length === 0) return false;
      
      // Check if ALL unique resources exist in the cluster
      let existingCount = 0;
      for (const resource of uniqueResources) {
        try {
          const result = await ddClient.extension.host?.cli.exec('kubectl', [
            'get',
            resource.kind.toLowerCase(),
            resource.name,
            '-n',
            resource.namespace || 'demo',
            '--ignore-not-found'
          ]) as any;
          
          if (result?.stdout?.trim()) {
            existingCount++;
          }
        } catch (e) {
          // Resource doesn't exist or error checking
          continue;
        }
      }
      
      // Template is considered deployed only if ALL unique resources exist
      return existingCount === uniqueResources.length;
    } catch (error) {
      console.error('Error checking template deployment:', error);
      return false;
    }
  }, [ddClient]);

  // Special check for basic-http-routing template
  const checkBasicHttpRoutingDeployment = async () => {
    try {
      // Check if echo-service deployment exists
      const echoResult = await ddClient.extension.host?.cli.exec('kubectl', [
        'get', 'deployment', 'echo-service', '-n', 'demo', '--ignore-not-found'
      ]) as any;
      
      const hasEchoService = !!echoResult?.stdout?.trim();
      
      // Check if echo-service-v1 deployment does NOT exist (this would indicate traffic splitting)
      const v1Result = await ddClient.extension.host?.cli.exec('kubectl', [
        'get', 'deployment', 'echo-service-v1', '-n', 'demo', '--ignore-not-found'
      ]) as any;
      
      const hasV1Service = !!v1Result?.stdout?.trim();
      
      // Check if Certificate does NOT exist (this would indicate TLS termination)
      const certResult = await ddClient.extension.host?.cli.exec('kubectl', [
        'get', 'certificate', 'demo-cert', '-n', 'demo', '--ignore-not-found'
      ]) as any;
      
      const hasCertificate = !!certResult?.stdout?.trim();
      
      // Basic HTTP routing is deployed only if:
      // - echo-service exists AND
      // - echo-service-v1 does NOT exist AND  
      // - demo-cert does NOT exist
      return hasEchoService && !hasV1Service && !hasCertificate;
      
    } catch (error) {
      console.error('Error checking basic HTTP routing deployment:', error);
      return false;
    }
  };

  // Get unique resources that identify each template specifically
  const getUniqueResourcesForTemplate = (templateId: string, resources: Array<{kind: string, name: string, namespace?: string}>) => {
    // Filter out common resources that multiple templates share
    const commonResources = ['Namespace'];
    const filteredResources = resources.filter(r => !commonResources.includes(r.kind));
    
    // For basic-http-routing, we need special logic since it shares names with others
    if (templateId === 'basic-http-routing') {
      // Basic template is deployed if echo-service exists but echo-service-v1/v2 do NOT exist
      return filteredResources.filter(resource => 
        resource.name === 'echo-service' && resource.kind === 'Deployment'
      );
    }
    
    // Define unique identifiers for other templates
    const templateUniqueResources: Record<string, string[]> = {
      'traffic-splitting': ['echo-service-v1', 'echo-service-v2'], // Only traffic splitting has v1/v2 services
      'tls-termination': ['demo-cert'], // TLS template has Certificate resource
      'basic-auth-security': ['basic-auth-secret'], // Basic auth template would have auth secrets
      'cors-policy': ['cors-policy'], // CORS template would have CORS policy
      'rate-limiting': ['rate-limit-policy'], // Rate limiting template would have rate limit policy
    };
    
    const uniqueNames = templateUniqueResources[templateId];
    if (!uniqueNames) {
      // For templates without specific unique resources defined, use all non-common resources
      return filteredResources;
    }
    
    // Return only resources that match the unique identifiers for this template
    return filteredResources.filter(resource => 
      uniqueNames.some(uniqueName => resource.name.includes(uniqueName))
    );
  };

  // Parse YAML content to extract resource information
  const parseTemplateResources = (yamlContent: string) => {
    const resources: Array<{kind: string, name: string, namespace?: string}> = [];
    
    // Split YAML documents by ---
    const documents = yamlContent.split(/^---$/m);
    
    for (const doc of documents) {
      const lines = doc.trim().split('\n');
      let kind = '';
      let name = '';
      let namespace = '';
      
      for (const line of lines) {
        if (line.startsWith('kind:')) {
          kind = line.replace('kind:', '').trim();
        } else if (line.trim().startsWith('name:') && !name) {
          name = line.replace(/.*name:/, '').trim();
        } else if (line.trim().startsWith('namespace:')) {
          namespace = line.replace(/.*namespace:/, '').trim();
        }
      }
      
      if (kind && name) {
        resources.push({ kind, name, namespace: namespace || 'demo' });
      }
    }
    
    return resources;
  };

  // Update deployment status for all templates
  const updateDeploymentStatus = React.useCallback(async () => {
    const deployedSet = new Set<string>();
    
    for (const template of templates) {
      const isDeployed = await checkTemplateDeployment(template);
      if (isDeployed) {
        deployedSet.add(template.id);
      }
    }
    
    setDeployedTemplates(deployedSet);
  }, [templates, checkTemplateDeployment]);

  // Check deployment status on component mount and when templates change
  React.useEffect(() => {
    updateDeploymentStatus();
  }, [updateDeploymentStatus]);

  const handleApply = async (template: Template) => {
    try {
      setDeployingTemplate(template.id);
      setDeploymentError(null);
      setDeploymentSuccess(null);
      
      if (!ddClient?.extension?.host?.cli) {
        throw new Error('Docker Desktop extension host CLI not available');
      }
      
      // Use host CLI execution to apply template
      const result = await ddClient.extension.host?.cli.exec('kubectl', [
        'apply', 
        '-f', 
        template.yamlUrl,
        '--validate=false'
      ]) as any;
      
      // Check if kubectl command was successful
      const stdout = result?.stdout || '';
      const stderr = result?.stderr || '';
      const combinedOutput = (stdout + stderr).toLowerCase();
      const successKeywords = ['created', 'configured', 'unchanged', 'applied'];
      const isSuccess = successKeywords.some(keyword => combinedOutput.includes(keyword));
      
      if (isSuccess) {
        // Count the number of resources that were affected
        const lines = stdout.split('\n').filter((line: string) => line.trim());
        const resourceCount = lines.filter((line: string) => 
          successKeywords.some(keyword => line.toLowerCase().includes(keyword))
        ).length;
        
        const successMsg = `Successfully deployed "${template.name}" with ${resourceCount} resources`;
        setDeploymentSuccess(successMsg);
        setShowSuccessSnackbar(true);
        
        // Update deployment status
        setDeployedTemplates(prev => new Set([...prev, template.id]));
        
        // Notify parent component of successful deployment
        if (onTemplateApply) {
          onTemplateApply(template);
        }
        setDetailsOpen(false);
      } else {
        throw new Error(`Deployment failed: ${stderr || stdout || 'Unknown error'}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to deploy template';
      setDeploymentError(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setDeployingTemplate(null);
    }
  };

  // Handle undeploy button click - show confirmation dialog
  const handleUndeployClick = async (template: Template) => {
    try {
      // Get template resources for confirmation dialog
      const response = await fetch(template.yamlUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch template resources');
      }
      
      const yamlContent = await response.text();
      const resources = parseTemplateResources(yamlContent);
      const resourceList = resources.map(r => `${r.kind}: ${r.name} (${r.namespace})`);
      
      setUndeployDialog({
        open: true,
        template,
        resources: resourceList
      });
    } catch (error: any) {
      setDeploymentError(`Failed to prepare undeploy: ${error.message}`);
      setShowErrorSnackbar(true);
    }
  };

  // Actually perform the undeployment
  const handleConfirmUndeploy = async () => {
    const { template } = undeployDialog;
    if (!template) return;

    try {
      setUndeployingTemplate(template.id);
      setUndeployDialog({ open: false, template: null, resources: [] });
      
      if (!ddClient?.extension?.host?.cli) {
        throw new Error('Docker Desktop extension host CLI not available');
      }
      
      // Use kubectl delete with the template URL
      const result = await ddClient.extension.host?.cli.exec('kubectl', [
        'delete', 
        '-f', 
        template.yamlUrl,
        '--ignore-not-found=true'
      ]) as any;
      
      // Check if kubectl command was successful
      const stdout = result?.stdout || '';
      const stderr = result?.stderr || '';
      const combinedOutput = (stdout + stderr).toLowerCase();
      const successKeywords = ['deleted', 'not found'];
      const isSuccess = successKeywords.some(keyword => combinedOutput.includes(keyword));
      
      if (isSuccess || (!stderr && !stdout)) {
        // Count deleted resources
        const lines = stdout.split('\n').filter((line: string) => line.trim());
        const deletedCount = lines.filter((line: string) => 
          line.toLowerCase().includes('deleted')
        ).length;
        
        const successMsg = `Successfully undeployed "${template.name}" (${deletedCount} resources removed)`;
        setDeploymentSuccess(successMsg);
        setShowSuccessSnackbar(true);
        
        // Update deployment status
        setDeployedTemplates(prev => {
          const newSet = new Set(prev);
          newSet.delete(template.id);
          return newSet;
        });
        
      } else {
        throw new Error(`Undeploy failed: ${stderr || stdout || 'Unknown error'}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to undeploy template';
      setDeploymentError(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setUndeployingTemplate(null);
    }
  };

  const handleCancelUndeploy = () => {
    setUndeployDialog({ open: false, template: null, resources: [] });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "success";
      case "Intermediate": return "warning";
      case "Advanced": return "error";
      default: return "default";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "security":
        return <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />;
      case "traffic management":
        return <RouterIcon sx={{ fontSize: 40, color: 'warning.main' }} />;
      case "basic":
        return <HubIcon sx={{ fontSize: 40, color: 'success.main' }} />;
      default:
        return <CodeIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CategoryIcon />
            Template Gallery
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discover and deploy pre-built configurations for common Envoy Gateway use cases.
            Choose from our curated collection of production-ready templates.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={updateDeploymentStatus}
          sx={{ ml: 2 }}
        >
          Refresh Status
        </Button>
      </Box>


      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                label="Difficulty"
              >
                {difficulties.map(difficulty => (
                  <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
              >
                <MenuItem value="featured">Featured</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="recent">Recently Updated</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </Typography>
          </Grid>
        </Grid>
      </Paper>


      {/* Template Grid */}
      <Grid container spacing={3}>
        {paginatedTemplates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card 
              variant="outlined"
              sx={{ 
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 3
                }
              }}
            >
              {template.thumbnail ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={template.thumbnail}
                  alt={template.name}
                  onError={(e) => {
                    // Hide the image if it fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 140,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  {getCategoryIcon(template.category)}
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    {template.category}
                  </Typography>
                </Box>
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {deployedTemplates.has(template.id) && (
                      <Chip size="small" label="Deployed" color="success" />
                    )}
                    {template.featured && (
                      <Chip size="small" label="Featured" color="primary" />
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(template.id);
                      }}
                    >
                      {favorites.includes(template.id) ? (
                        <StarIcon color="warning" />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {template.description}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <Chip 
                    size="small" 
                    label={template.difficulty}
                    color={getDifficultyColor(template.difficulty) as any}
                  />
                  <Chip size="small" label={template.category} variant="outlined" />
                  {template.subcategory && (
                    <Chip size="small" label={template.subcategory} variant="outlined" />
                  )}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                    <Typography variant="caption">
                      {template.rating.toFixed(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <DownloadIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      {template.downloads.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ClockIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      {template.estimatedTime}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                  {template.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      size="small"
                      label={tag}
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                  ))}
                  {template.tags.length > 3 && (
                    <Chip
                      size="small"
                      label={`+${template.tags.length - 3}`}
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Button 
                  size="small" 
                  startIcon={<ViewIcon />}
                  onClick={() => handleTemplateClick(template)}
                >
                  View Details
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {deployedTemplates.has(template.id) && (
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={undeployingTemplate === template.id ? <CircularProgress size={16} /> : <UndeployIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUndeployClick(template);
                      }}
                      disabled={deployingTemplate !== null || undeployingTemplate !== null}
                      type="button"
                    >
                      {undeployingTemplate === template.id ? 'Undeploying...' : 'Undeploy'}
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    variant="contained"
                    startIcon={deployingTemplate === template.id ? <CircularProgress size={16} /> : <DeployIcon />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleApply(template);
                    }}
                    disabled={deployingTemplate !== null || undeployingTemplate !== null}
                    type="button"
                  >
                    {deployingTemplate === template.id ? 'Deploying...' : 'Deploy'}
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CategoryIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Try adjusting your search criteria or browse all templates.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
              setSelectedDifficulty("All");
            }}
          >
            Clear Filters
          </Button>
        </Paper>
      )}

      {/* Template Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{selectedTemplate.name}</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip 
                    size="small" 
                    label={selectedTemplate.difficulty}
                    color={getDifficultyColor(selectedTemplate.difficulty) as any}
                  />
                  {selectedTemplate.featured && (
                    <Chip size="small" label="Featured" color="primary" />
                  )}
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {deploymentError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {deploymentError}
                </Alert>
              )}
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                <Tab label="Overview" />
                <Tab label="Prerequisites" />
                <Tab label="Installation" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                {currentTab === 0 && (
                  <Box>
                    <Typography variant="body1" paragraph>
                      {selectedTemplate.description}
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Author:</Typography>
                        <Typography variant="body1">{selectedTemplate.author}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Version:</Typography>
                        <Typography variant="body1">{selectedTemplate.version}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Category:</Typography>
                        <Typography variant="body1">{selectedTemplate.category}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Estimated Time:</Typography>
                        <Typography variant="body1">{selectedTemplate.estimatedTime}</Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom>
                      Tags:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                      {selectedTemplate.tags.map((tag) => (
                        <Chip key={tag} size="small" label={tag} variant="outlined" />
                      ))}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StarIcon sx={{ color: "warning.main" }} />
                        <Typography variant="body2">
                          {selectedTemplate.rating.toFixed(1)} rating
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <DownloadIcon />
                        <Typography variant="body2">
                          {selectedTemplate.downloads.toLocaleString()} downloads
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {currentTab === 1 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Prerequisites:
                    </Typography>
                    <List>
                      {selectedTemplate.prerequisites.map((prereq, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={prereq} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {currentTab === 2 && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        This template will be deployed to your Kubernetes cluster. 
                        Make sure you have the required prerequisites installed.
                      </Typography>
                    </Alert>
                    
                    <Typography variant="body2" paragraph>
                      Click "Deploy Template" to apply this configuration to your cluster.
                      You can review the YAML configuration before applying.
                    </Typography>

                    {selectedTemplate.documentationUrl && (
                      <Button
                        variant="outlined"
                        href={selectedTemplate.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<InfoIcon />}
                        sx={{ mt: 1 }}
                      >
                        View Documentation
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedTemplate && deployedTemplates.has(selectedTemplate.id) && (
                  <Button
                    color="error"
                    startIcon={undeployingTemplate === selectedTemplate?.id ? <CircularProgress size={16} /> : <UndeployIcon />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectedTemplate && handleUndeployClick(selectedTemplate);
                    }}
                    disabled={deployingTemplate !== null || undeployingTemplate !== null}
                    type="button"
                  >
                    {undeployingTemplate === selectedTemplate?.id ? 'Undeploying...' : 'Undeploy Template'}
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={deployingTemplate === selectedTemplate?.id ? <CircularProgress size={16} /> : <DeployIcon />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedTemplate && handleApply(selectedTemplate);
                  }}
                  disabled={deployingTemplate !== null || undeployingTemplate !== null}
                  type="button"
                >
                  {deployingTemplate === selectedTemplate?.id ? 'Deploying...' : 'Deploy Template'}
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Undeploy Confirmation Dialog */}
      <Dialog
        open={undeployDialog.open}
        onClose={handleCancelUndeploy}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UndeployIcon color="error" />
            Confirm Template Undeployment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This will permanently delete all resources deployed by the "{undeployDialog.template?.name}" template.
              This action cannot be undone.
            </Typography>
          </Alert>
          
          {undeployDialog.resources.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                The following resources will be deleted:
              </Typography>
              <List dense>
                {undeployDialog.resources.map((resource, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <UndeployIcon color="error" sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={resource}
                      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUndeploy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmUndeploy}
            startIcon={<UndeployIcon />}
          >
            Confirm Undeploy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          variant="filled"
          icon={<SuccessIcon />}
          sx={{ width: '100%' }}
        >
          {deploymentSuccess}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={8000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowErrorSnackbar(false)} 
          severity="error" 
          variant="filled"
          icon={<ErrorIcon />}
          sx={{ width: '100%' }}
        >
          {deploymentError}
        </Alert>
      </Snackbar>
    </Box>
  );
};