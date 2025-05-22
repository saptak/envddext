import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Collapse,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { getDetailedDeploymentStatus, getPodDetails, getServiceEndpoints } from '../helper/kubernetes';
import { PodStatusIndicator } from './PodStatusIndicator';
import { DeploymentTroubleshooter } from './DeploymentTroubleshooter';

interface DeploymentStatusMonitorProps {
  ddClient: any;
  namespace: string;
  deploymentName: string;
  serviceName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DeploymentStatusMonitor: React.FC<DeploymentStatusMonitorProps> = ({
  ddClient,
  namespace,
  deploymentName,
  serviceName,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [podDetails, setPodDetails] = useState<any[]>([]);
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get detailed deployment status
      const status = await getDetailedDeploymentStatus(ddClient, namespace, deploymentName);
      setDeploymentStatus(status);
      
      // Get pod details if deployment exists
      if (status && status.status !== 'not_found') {
        const pods = await getPodDetails(ddClient, namespace, `app=${deploymentName}`);
        setPodDetails(pods);
        
        // Get service info if service name is provided
        if (serviceName) {
          const svcInfo = await getServiceEndpoints(ddClient, namespace, serviceName);
          setServiceInfo(svcInfo);
        }
      } else {
        setPodDetails([]);
        setServiceInfo(null);
      }
      
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Error fetching deployment status:', err);
      setError(typeof err === 'string' ? err : JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStatus();
    
    // Setup auto-refresh if enabled
    if (autoRefresh) {
      const timer = setInterval(fetchStatus, refreshInterval);
      setRefreshTimer(timer);
    }
    
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [namespace, deploymentName, serviceName, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    fetchStatus();
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'pending':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'failed':
      case 'not_found':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'not_found':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && !deploymentStatus) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading deployment status...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography variant="subtitle1">Error fetching deployment status</Typography>
        <Typography variant="body2">{error}</Typography>
        <Button 
          variant="contained" 
          size="small" 
          onClick={handleRefresh}
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  if (!deploymentStatus || deploymentStatus.status === 'not_found') {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1">
          Deployment not found: {deploymentName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The deployment may have been deleted or has not been created yet.
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mt: 1 }}
        >
          Refresh
        </Button>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStatusIcon(deploymentStatus.status)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {deploymentName}
            </Typography>
            <Chip 
              label={deploymentStatus.status.toUpperCase()} 
              size="small" 
              color={getStatusColor(deploymentStatus.status) as any} 
              variant="outlined" 
              sx={{ ml: 2 }}
            />
          </Box>
          <Box>
            <Tooltip title={`Last refreshed: ${lastRefreshed.toLocaleTimeString()}`}>
              <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <IconButton 
              size="small" 
              onClick={handleToggleExpand}
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s' 
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            Namespace: <strong>{namespace}</strong>
          </Typography>
          <Typography variant="body2">
            Replicas: <strong>{deploymentStatus.readyReplicas}/{deploymentStatus.desiredReplicas}</strong>
            {deploymentStatus.age && ` • Age: ${deploymentStatus.age}`}
          </Typography>
          {deploymentStatus.message && (
            <Typography 
              variant="body2" 
              color={deploymentStatus.status === 'ready' ? 'success.main' : 'text.secondary'}
              sx={{ mt: 0.5 }}
            >
              {deploymentStatus.message}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pod Status {podDetails.length > 0 && `(${podDetails.length})`}
          </Typography>
          
          {podDetails.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No pods found for this deployment.
            </Typography>
          ) : (
            <Box>
              {podDetails.map((pod, index) => (
                <PodStatusIndicator key={index} pod={pod} />
              ))}
            </Box>
          )}
          
          {serviceInfo && serviceInfo.found && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Service Endpoints
              </Typography>
              
              {serviceInfo.endpoints && serviceInfo.endpoints.length > 0 ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Service <strong>{serviceName}</strong> has the following endpoints:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default' }}>
                    {serviceInfo.endpoints.map((endpoint: string, index: number) => (
                      <Typography key={index} variant="body2" component="div" fontFamily="monospace">
                        {endpoint}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Service <strong>{serviceName}</strong> has no endpoints.
                </Typography>
              )}
            </>
          )}
          
          {deploymentStatus.status !== 'ready' && (
            <>
              <Divider sx={{ my: 2 }} />
              <DeploymentTroubleshooter 
                deploymentStatus={deploymentStatus} 
                podDetails={podDetails} 
              />
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
