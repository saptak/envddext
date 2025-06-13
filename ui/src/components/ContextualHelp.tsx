import React, { useState } from 'react';
import {
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Help as HelpIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

// Help content definitions
export interface HelpContent {
  title: string;
  description: string;
  details?: string;
  tips?: string[];
  relatedLinks?: Array<{ text: string; url: string }>;
  examples?: string[];
}

export const HELP_TOPICS: Record<string, HelpContent> = {
  gateway: {
    title: 'Gateway Configuration',
    description: 'A Gateway defines how external traffic enters your cluster. It specifies listeners, protocols, and routing permissions.',
    details: 'Gateways act as the entry point for all external traffic. They listen on specific ports and protocols (HTTP/HTTPS) and define which routes can attach to them.',
    tips: [
      'Use meaningful names for easy identification',
      'Configure HTTPS listeners for secure communication',
      'Set appropriate route permissions for security',
      'Consider load balancer requirements for external access'
    ],
    relatedLinks: [
      { text: 'Gateway API Specification', url: 'https://gateway-api.sigs.k8s.io/reference/spec/#gateway.networking.k8s.io/v1.Gateway' },
      { text: 'Envoy Gateway Documentation', url: 'https://gateway.envoyproxy.io/docs/' }
    ],
    examples: [
      'HTTP Gateway on port 80 for development',
      'HTTPS Gateway on port 443 with TLS termination',
      'Multi-protocol Gateway for different services'
    ]
  },
  httproute: {
    title: 'HTTPRoute Configuration',
    description: 'HTTPRoutes define how incoming HTTP requests are matched and routed to backend services.',
    details: 'HTTPRoutes contain rules that match incoming requests based on hostname, path, headers, or query parameters, then forward them to appropriate backend services.',
    tips: [
      'Use specific path matching for better performance',
      'Configure hostnames for multi-tenant scenarios',
      'Set appropriate timeouts for backend services',
      'Test routing rules with the built-in HTTP client'
    ],
    relatedLinks: [
      { text: 'HTTPRoute Specification', url: 'https://gateway-api.sigs.k8s.io/reference/spec/#gateway.networking.k8s.io/v1.HTTPRoute' },
      { text: 'Traffic Routing Guide', url: 'https://gateway.envoyproxy.io/docs/user/traffic-routing/' }
    ],
    examples: [
      'Path-based routing: /api/* → api-service',
      'Header-based routing: X-Version: v2 → v2-service',
      'Weighted routing: 90% v1, 10% v2 for canary deployment'
    ]
  },
  tls: {
    title: 'TLS Certificate Management',
    description: 'TLS certificates enable HTTPS communication by encrypting traffic between clients and your gateway.',
    details: 'The extension integrates with cert-manager to automatically generate and manage TLS certificates. Self-signed certificates are perfect for development and testing.',
    tips: [
      'Install cert-manager before creating certificates',
      'Use self-signed certificates for development',
      'Configure proper DNS names for your use case',
      'Monitor certificate expiration dates'
    ],
    relatedLinks: [
      { text: 'cert-manager Documentation', url: 'https://cert-manager.io/docs/' },
      { text: 'TLS Termination Guide', url: 'https://gateway.envoyproxy.io/docs/user/tls-termination/' }
    ],
    examples: [
      'Self-signed certificate for *.local domains',
      'Wildcard certificate for multiple subdomains',
      'Multi-domain certificate for different services'
    ]
  },
  jwt: {
    title: 'JWT Authentication',
    description: 'JWT (JSON Web Token) authentication provides stateless, token-based authentication for modern applications.',
    details: 'Configure JWT providers with issuer information, JWKS endpoints for token validation, and claim-to-header mapping for downstream services.',
    tips: [
      'Always validate JWT signatures in production',
      'Use HTTPS for all JWT-protected endpoints',
      'Configure appropriate token expiration times',
      'Test authentication flows with the built-in JWT tester'
    ],
    relatedLinks: [
      { text: 'JWT.io - Token Debugger', url: 'https://jwt.io/' },
      { text: 'Envoy Gateway JWT Guide', url: 'https://gateway.envoyproxy.io/docs/user/security/jwt-authentication/' }
    ],
    examples: [
      'Auth0 provider with JWKS endpoint',
      'Custom JWT issuer with audience validation',
      'Multi-provider setup for different user types'
    ]
  },
  ratelimit: {
    title: 'Rate Limiting',
    description: 'Rate limiting protects your services from abuse and ensures fair resource usage across clients.',
    details: 'Configure multi-dimensional rate limiting (global, per-IP, per-header, per-user) with burst allowances and enforcement modes.',
    tips: [
      'Start with generous limits and adjust based on traffic patterns',
      'Use burst allowances for legitimate traffic spikes',
      'Test rate limits with the burst testing tools',
      'Monitor 429 responses and adjust accordingly'
    ],
    relatedLinks: [
      { text: 'Rate Limiting Guide', url: 'https://gateway.envoyproxy.io/docs/user/rate-limiting/' },
      { text: 'Envoy Rate Limiting', url: 'https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/rate_limit_filter' }
    ],
    examples: [
      '100 requests per minute globally',
      '10 requests per minute per IP address',
      '1000 requests per hour per API key'
    ]
  },
  loadbalancer: {
    title: 'LoadBalancer Configuration',
    description: 'LoadBalancers assign external IP addresses to your Gateways, making them accessible from outside the cluster.',
    details: 'In Docker Desktop, MetalLB provides LoadBalancer functionality. The extension automatically detects your network configuration and sets up IP pools.',
    tips: [
      'Configure LoadBalancer before creating Gateways',
      'Use auto-detection for Docker Desktop environments',
      'Monitor IP pool utilization',
      'Verify external connectivity after setup'
    ],
    relatedLinks: [
      { text: 'MetalLB Documentation', url: 'https://metallb.universe.tf/concepts/' },
      { text: 'Kubernetes LoadBalancer', url: 'https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer' }
    ],
    examples: [
      'Single IP for development gateway',
      'IP pool range for multiple gateways',
      'Layer 2 advertisement for local networks'
    ]
  }
};

interface ContextualHelpProps {
  topic: keyof typeof HELP_TOPICS;
  variant?: 'tooltip' | 'icon' | 'inline';
  size?: 'small' | 'medium' | 'large';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  content: HelpContent;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose, content }) => {
  const getTopicIcon = (title: string) => {
    if (title.includes('Security') || title.includes('JWT') || title.includes('TLS')) {
      return <SecurityIcon color="primary" />;
    }
    if (title.includes('Rate') || title.includes('Traffic')) {
      return <SpeedIcon color="primary" />;
    }
    return <SettingsIcon color="primary" />;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        {getTopicIcon(content.title)}
        <Typography variant="h6">{content.title}</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
            {content.description}
          </Typography>
          
          {content.details && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {content.details}
            </Typography>
          )}
        </Box>

        {content.tips && content.tips.length > 0 && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon color="warning" fontSize="small" />
                <Typography variant="subtitle2">Best Practices & Tips</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {content.tips.map((tip, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={tip}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {content.examples && content.examples.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="info" fontSize="small" />
                <Typography variant="subtitle2">Common Examples</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {content.examples.map((example, index) => (
                  <Chip 
                    key={index}
                    label={example}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {content.relatedLinks && content.relatedLinks.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LaunchIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">Documentation Links</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {content.relatedLinks.map((link, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LaunchIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText>
                      <Link 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ 
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        <Typography variant="body2" color="primary">
                          {link.text}
                        </Typography>
                      </Link>
                    </ListItemText>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ 
  topic, 
  variant = 'icon',
  size = 'medium',
  placement = 'top'
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const content = HELP_TOPICS[topic];

  if (!content) {
    console.warn(`Help topic '${topic}' not found`);
    return null;
  }

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDialogOpen(true);
  };

  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'medium' : 'small';

  if (variant === 'tooltip') {
    return (
      <>
        <Tooltip 
          title={content.description}
          placement={placement}
          arrow
        >
          <IconButton 
            size={iconSize}
            onClick={handleClick}
            sx={{ 
              ml: 0.5,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <HelpIcon fontSize={iconSize} />
          </IconButton>
        </Tooltip>
        <HelpDialog 
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          content={content}
        />
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <Box sx={{ mt: 1, mb: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <InfoIcon color="info" fontSize="small" />
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {content.description}
          </Typography>
          <Button 
            size="small"
            onClick={handleClick}
            endIcon={<HelpIcon />}
          >
            Learn More
          </Button>
        </Box>
        <HelpDialog 
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          content={content}
        />
      </Box>
    );
  }

  // Default icon variant
  return (
    <>
      <IconButton 
        size={iconSize}
        onClick={handleClick}
        sx={{ 
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' }
        }}
      >
        <HelpIcon fontSize={iconSize} />
      </IconButton>
      <HelpDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        content={content}
      />
    </>
  );
};

// Quick help component for form fields
interface QuickHelpProps {
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const QuickHelp: React.FC<QuickHelpProps> = ({ 
  title, 
  description, 
  placement = 'top' 
}) => {
  return (
    <Tooltip 
      title={
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2">{description}</Typography>
        </Box>
      }
      placement={placement}
      arrow
    >
      <IconButton 
        size="small"
        sx={{ 
          ml: 0.5,
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' }
        }}
      >
        <HelpIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default ContextualHelp;