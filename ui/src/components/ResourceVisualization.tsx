import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  Divider,
} from "@mui/material";
import {
  AccountTree,
  Router,
  Hub,
  ArrowForward,
  Info,
  CheckCircle,
  Error,
  Warning,
  Language,
  Storage,
  Timeline,
} from "@mui/icons-material";
import { Gateway, HTTPRoute } from "../types/gateway";

interface ResourceVisualizationProps {
  gateways: Gateway[];
  httpRoutes: HTTPRoute[];
  onResourceClick?: (type: "Gateway" | "HTTPRoute", name: string, namespace: string) => void;
}

interface VisualizationNode {
  id: string;
  type: "Gateway" | "HTTPRoute";
  name: string;
  namespace: string;
  status: "ready" | "warning" | "error" | "unknown";
  details: string[];
  connectedTo: string[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ready":
      return <CheckCircle color="success" fontSize="small" />;
    case "warning":
      return <Warning color="warning" fontSize="small" />;
    case "error":
      return <Error color="error" fontSize="small" />;
    default:
      return <Info color="info" fontSize="small" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ready":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "info";
  }
};

export const ResourceVisualization: React.FC<ResourceVisualizationProps> = ({
  gateways,
  httpRoutes,
  onResourceClick,
}) => {
  // Build connection mapping
  const buildConnectionMap = () => {
    const connections: { [routeId: string]: string[] } = {};
    
    httpRoutes.forEach((route) => {
      const routeId = `${route.metadata.namespace}/${route.metadata.name}`;
      connections[routeId] = route.spec.parentRefs.map(ref => 
        `${ref.namespace || route.metadata.namespace}/${ref.name}`
      );
    });
    
    return connections;
  };

  const connections = buildConnectionMap();

  // Enhanced Gateway Card Component
  const GatewayCard: React.FC<{ gateway: Gateway }> = ({ gateway }) => {
    const conditions = gateway.status?.conditions || [];
    const readyCondition = conditions.find(c => c.type === 'Ready' || c.type === 'Accepted');
    const addresses = gateway.status?.addresses?.map(addr => addr.value) || [];
    const listeners = gateway.spec.listeners;
    const attachedRoutes = gateway.status?.listeners?.reduce((sum, listener) => 
      sum + (listener.attachedRoutes || 0), 0) || 0;

    const isReady = readyCondition?.status === 'True';
    const hasAddress = addresses.length > 0;

    return (
      <Card
        sx={{
          mb: 2,
          cursor: onResourceClick ? "pointer" : "default",
          transition: "all 0.2s ease-in-out",
          border: isReady ? "2px solid #4caf50" : "2px solid #ff9800",
          "&:hover": onResourceClick ? {
            transform: "translateY(-2px)",
            boxShadow: 4,
          } : {},
        }}
        onClick={() => onResourceClick?.("Gateway", gateway.metadata.name, gateway.metadata.namespace)}
      >
        <CardContent sx={{ pb: "16px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: isReady ? "success.main" : "warning.main", width: 40, height: 40 }}>
              <Hub />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                {gateway.metadata.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gateway • {gateway.metadata.namespace}
              </Typography>
            </Box>
            {isReady ? (
              <CheckCircle color="success" />
            ) : (
              <Warning color="warning" />
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<Language />}
              label={`${listeners.length} Listeners`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<Timeline />}
              label={`${attachedRoutes} Routes`}
              size="small"
              variant="outlined"
              color={attachedRoutes > 0 ? "primary" : "default"}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Storage fontSize="small" color={hasAddress ? "success" : "disabled"} />
            <Typography variant="body2" color={hasAddress ? "text.primary" : "text.secondary"}>
              {hasAddress ? addresses[0] : "No address assigned"}
            </Typography>
          </Box>

          {listeners.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Listeners:
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {listeners.map((listener, index) => (
                  <Chip
                    key={index}
                    label={`${listener.protocol}:${listener.port}`}
                    size="small"
                    sx={{ fontSize: "0.7rem" }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Enhanced HTTPRoute Card Component
  const HTTPRouteCard: React.FC<{ route: HTTPRoute }> = ({ route }) => {
    const conditions = route.status?.parents?.[0]?.conditions || [];
    const acceptedCondition = conditions.find(c => c.type === 'Accepted');
    const resolvedRefsCondition = conditions.find(c => c.type === 'ResolvedRefs');
    
    const isAccepted = acceptedCondition?.status === 'True';
    const isResolved = resolvedRefsCondition?.status === 'True';
    const isReady = isAccepted && isResolved;

    const parentGateways = route.spec.parentRefs;
    const hostnames = route.spec.hostnames || ['*'];
    const rules = route.spec.rules || [];
    const paths = rules.flatMap(rule => 
      rule.matches?.map(match => match.path?.value || '/') || ['/']
    );

    // Find connected gateways
    const routeId = `${route.metadata.namespace}/${route.metadata.name}`;
    const connectedGateways = connections[routeId] || [];

    return (
      <Card
        sx={{
          mb: 2,
          cursor: onResourceClick ? "pointer" : "default",
          transition: "all 0.2s ease-in-out",
          border: isReady ? "2px solid #4caf50" : 
                  isAccepted ? "2px solid #ff9800" : "2px solid #f44336",
          "&:hover": onResourceClick ? {
            transform: "translateY(-2px)",
            boxShadow: 4,
          } : {},
        }}
        onClick={() => onResourceClick?.("HTTPRoute", route.metadata.name, route.metadata.namespace)}
      >
        <CardContent sx={{ pb: "16px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: isReady ? "success.main" : isAccepted ? "warning.main" : "error.main",
              width: 40, 
              height: 40 
            }}>
              <Router />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                {route.metadata.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                HTTPRoute • {route.metadata.namespace}
              </Typography>
            </Box>
            {isReady ? (
              <CheckCircle color="success" />
            ) : isAccepted ? (
              <Warning color="warning" />
            ) : (
              <Error color="error" />
            )}
          </Box>

          {connectedGateways.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Connected to:
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {connectedGateways.map((gwId, index) => {
                  const gwName = gwId.split('/')[1];
                  return (
                    <Chip
                      key={index}
                      icon={<ArrowForward />}
                      label={gwName}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              label={`${rules.length} Rules`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${hostnames.length} Hosts`}
              size="small"
              variant="outlined"
            />
          </Box>

          {hostnames.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Hosts: {hostnames.slice(0, 2).join(", ")}
                {hostnames.length > 2 && ` +${hostnames.length - 2} more`}
              </Typography>
            </Box>
          )}

          {paths.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Paths: {Array.from(new Set(paths)).slice(0, 3).join(", ")}
                {paths.length > 3 && ` +${paths.length - 3} more`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Connection Flow Visualization
  const ConnectionFlow: React.FC = () => {
    if (gateways.length === 0 || httpRoutes.length === 0) return null;

    return (
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        py: 2,
        background: "linear-gradient(90deg, transparent 0%, rgba(33, 150, 243, 0.1) 50%, transparent 100%)"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Hub color="primary" />
          <ArrowForward color="primary" />
          <Router color="secondary" />
          <ArrowForward color="primary" />
          <Language color="action" />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          Gateway → Route → Service
        </Typography>
      </Box>
    );
  };

  if (gateways.length === 0 && httpRoutes.length === 0) {
    return (
      <Paper sx={{ 
        p: 4, 
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)"
      }}>
        <Timeline sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Resource Connections
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
          Create Gateways and HTTP Routes to visualize how they connect and route traffic 
          to your services. The visualization will show the complete request flow.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Timeline color="primary" />
        <Typography variant="h6">Traffic Flow Visualization</Typography>
        <Tooltip title="Interactive visualization showing how traffic flows from Gateways through HTTPRoutes to your services">
          <IconButton size="small">
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <ConnectionFlow />

      <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
        {/* Gateways Section */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1, 
            mb: 2,
            p: 2,
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            borderRadius: 1,
            border: "1px solid rgba(76, 175, 80, 0.3)"
          }}>
            <Hub color="success" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
              Gateways ({gateways.length})
            </Typography>
          </Box>
          
          {gateways.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No gateways configured
              </Typography>
            </Paper>
          ) : (
            gateways.map((gateway) => (
              <GatewayCard key={gateway.metadata.uid} gateway={gateway} />
            ))
          )}
        </Box>

        {/* HTTPRoutes Section */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1, 
            mb: 2,
            p: 2,
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            borderRadius: 1,
            border: "1px solid rgba(33, 150, 243, 0.3)"
          }}>
            <Router color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
              HTTP Routes ({httpRoutes.length})
            </Typography>
          </Box>
          
          {httpRoutes.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No HTTP routes configured
              </Typography>
            </Paper>
          ) : (
            httpRoutes.map((route) => (
              <HTTPRouteCard key={route.metadata.uid} route={route} />
            ))
          )}
        </Box>
      </Box>

      {/* Enhanced Legend */}
      <Box sx={{ 
        mt: 4, 
        p: 3, 
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        borderRadius: 2,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Legend
        </Typography>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle color="success" fontSize="small" />
            <Typography variant="body2">Ready & Healthy</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Warning color="warning" fontSize="small" />
            <Typography variant="body2">Partially Ready</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Error color="error" fontSize="small" />
            <Typography variant="body2">Failed or Error</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ArrowForward color="primary" fontSize="small" />
            <Typography variant="body2">Route Connection</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Language color="action" fontSize="small" />
            <Typography variant="body2">External Traffic</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};