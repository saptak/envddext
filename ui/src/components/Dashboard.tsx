import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Collapse,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Dashboard as DashboardIcon,
  AccountTree as ResourceIcon,
  Settings as DeploymentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { ResourceCard } from './ResourceCard';
import { ResourceVisualization } from './ResourceVisualization';
import { DeploymentStatusMonitor } from './DeploymentStatusMonitor';
import { extractGatewayCardData, extractHTTPRouteCardData } from '../utils/resourceCardHelpers';

interface DashboardProps {
  gateways: any[];
  routes: any[];
  deployedServices: {
    namespace: string;
    deploymentName: string;
    serviceName: string;
  }[];
  loading: boolean;
  onRefresh: () => void;
  onResourceAction: (action: "delete" | "viewYaml", resourceType: "Gateway" | "HTTPRoute", resourceName: string, resourceNamespace: string) => void;
  ddClient: any;
}

export const Dashboard: React.FC<DashboardProps> = ({
  gateways,
  routes,
  deployedServices,
  loading,
  onRefresh,
  onResourceAction,
  ddClient
}) => {
  const [showDeployments, setShowDeployments] = useState(true);
  const [showVisualization, setShowVisualization] = useState(true);

  // Calculate overall system health
  const getSystemHealth = () => {
    const totalResources = gateways.length + routes.length;
    if (totalResources === 0) {
      return { status: 'empty', message: 'No resources deployed', color: 'info' };
    }

    // Check for failed gateways (those without external IP)
    const failedGateways = gateways.filter(gw => {
      const status = gw.status?.addresses?.length > 0 ? 'ready' : 'failed';
      return status === 'failed';
    });

    // Check for failed routes (those not accepted)
    const failedRoutes = routes.filter(rt => {
      const conditions = rt.status?.parents?.[0]?.conditions || [];
      const accepted = conditions.find((c: any) => c.type === 'Accepted')?.status === 'True';
      return !accepted;
    });

    const totalFailed = failedGateways.length + failedRoutes.length;
    const totalSuccessful = totalResources - totalFailed;

    if (totalFailed === 0) {
      return { status: 'healthy', message: `All ${totalResources} resources healthy`, color: 'success' };
    } else if (totalSuccessful > totalFailed) {
      return { status: 'warning', message: `${totalFailed} of ${totalResources} resources need attention`, color: 'warning' };
    } else {
      return { status: 'critical', message: `${totalFailed} of ${totalResources} resources failed`, color: 'error' };
    }
  };

  const systemHealth = getSystemHealth();

  return (
    <Box sx={{ p: 3 }}>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <LinearProgress sx={{ width: 20, height: 20 }} /> : <RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh All"}
        </Button>
      </Box>

      {/* System Health Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {gateways.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gateways
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="secondary">
                  {routes.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  HTTP Routes
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="info.main">
                  {deployedServices.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Services
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Alert 
              severity={systemHealth.color as any}
              icon={
                systemHealth.status === 'healthy' ? <CheckCircleIcon /> :
                systemHealth.status === 'warning' ? <WarningIcon /> :
                systemHealth.status === 'critical' ? <ErrorIcon /> :
                <InfoIcon />
              }
            >
              {systemHealth.message}
            </Alert>
          </Box>
        </CardContent>
      </Card>

      {/* Resources Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ResourceIcon color="primary" />
              <Typography variant="h6">
                Gateway Resources
              </Typography>
              <Chip 
                label={`${gateways.length + routes.length} total`} 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Box>

          {/* Gateways */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Gateways ({gateways.length})
            </Typography>
            {gateways.length === 0 ? (
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  No gateways found. Create your first gateway in the Gateway Management tab.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {gateways.map((gw: any) => {
                  const cardData = extractGatewayCardData(gw);
                  return (
                    <ResourceCard
                      key={gw.metadata.uid}
                      {...cardData}
                      onRefresh={onRefresh}
                      onViewYaml={() => onResourceAction('viewYaml', 'Gateway', gw.metadata.name, gw.metadata.namespace)}
                      onDelete={() => onResourceAction('delete', 'Gateway', gw.metadata.name, gw.metadata.namespace)}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {/* HTTPRoutes */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              HTTP Routes ({routes.length})
            </Typography>
            {routes.length === 0 ? (
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  No HTTP routes found. Create your first route in the HTTPRoute Management tab.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {routes.map((rt: any) => {
                  const cardData = extractHTTPRouteCardData(rt);
                  return (
                    <ResourceCard
                      key={rt.metadata.uid}
                      {...cardData}
                      onRefresh={onRefresh}
                      onViewYaml={() => onResourceAction('viewYaml', 'HTTPRoute', rt.metadata.name, rt.metadata.namespace)}
                      onDelete={() => onResourceAction('delete', 'HTTPRoute', rt.metadata.name, rt.metadata.namespace)}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Resource Visualization */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Resource Relationships
              </Typography>
              <IconButton
                onClick={() => setShowVisualization(!showVisualization)}
                size="small"
              >
                {showVisualization ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={showVisualization}>
              <ResourceVisualization
                gateways={gateways}
                httpRoutes={routes}
                onResourceClick={(type, name, namespace) => {
                  onResourceAction('viewYaml', type, name, namespace);
                }}
              />
            </Collapse>
          </Box>
        </CardContent>
      </Card>

      {/* Deployment Status Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeploymentIcon color="secondary" />
              <Typography variant="h6">
                Deployment Status
              </Typography>
              <Chip 
                label={`${deployedServices.length} services`} 
                size="small" 
                variant="outlined"
                color="secondary"
              />
            </Box>
            <IconButton
              onClick={() => setShowDeployments(!showDeployments)}
              size="small"
            >
              {showDeployments ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Monitor the status of your deployed services with real-time pod and container information.
          </Typography>

          <Collapse in={showDeployments}>
            {deployedServices.length === 0 ? (
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  No services are being monitored. Deploy templates to see service status here.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {deployedServices.map((service, index) => (
                  <DeploymentStatusMonitor
                    key={`${service.namespace}-${service.deploymentName}-${index}`}
                    ddClient={ddClient}
                    namespace={service.namespace}
                    deploymentName={service.deploymentName}
                    serviceName={service.serviceName}
                    autoRefresh={true}
                    refreshInterval={5000}
                  />
                ))}
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};