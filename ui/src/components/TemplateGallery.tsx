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
  Tab
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
  Person as AuthorIcon,
  Tag as TagIcon
} from "@mui/icons-material";

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
      yamlUrl: "https://github.com/saptak/envoygatewaytemplates/raw/main/basic-http-echo.yaml",
      prerequisites: ["Kubernetes cluster", "Envoy Gateway installed"],
      estimatedTime: "5 minutes",
      featured: true,
      downloads: 1250,
      rating: 4.8,
      lastUpdated: "2025-06-10",
      thumbnail: "/api/placeholder/300/200"
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
      yamlUrl: "https://github.com/saptak/envoygatewaytemplates/raw/main/tls-gateway.yaml",
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
      yamlUrl: "https://github.com/saptak/envoygatewaytemplates/raw/main/traffic-splitting.yaml",
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
      yamlUrl: "https://github.com/saptak/envoygatewaytemplates/raw/main/basic-auth.yaml",
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
      yamlUrl: "https://github.com/saptak/envoygatewaytemplates/raw/main/cors-policy.yaml",
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
      yamlUrl: "https://github.com/saptak/envoygatewaytemplates/raw/main/rate-limiting.yaml",
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
  };

  const handleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleApply = (template: Template) => {
    if (onTemplateApply) {
      onTemplateApply(template);
    }
    setDetailsOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "success";
      case "Intermediate": return "warning";
      case "Advanced": return "error";
      default: return "default";
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
              {template.thumbnail && (
                <CardMedia
                  component="img"
                  height="140"
                  image={template.thumbnail}
                  alt={template.name}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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

              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<ViewIcon />}
                  onClick={() => handleTemplateClick(template)}
                >
                  View Details
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  startIcon={<DeployIcon />}
                  onClick={() => handleApply(template)}
                >
                  Deploy
                </Button>
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
              <Button
                variant="contained"
                startIcon={<DeployIcon />}
                onClick={() => handleApply(selectedTemplate)}
              >
                Deploy Template
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};