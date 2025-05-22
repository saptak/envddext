import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

interface PodStatusIndicatorProps {
  pod: any;
}

export const PodStatusIndicator: React.FC<PodStatusIndicatorProps> = ({ pod }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  const podName = pod.metadata?.name || 'unknown';
  const podPhase = pod.status?.phase || 'Unknown';
  const containerStatuses = pod.status?.containerStatuses || [];
  const conditions = pod.status?.conditions || [];
  const events = pod.events || [];
  
  const getStatusColor = (phase: string) => {
    switch (phase) {
      case 'Running':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Failed':
      case 'Unknown':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getStatusIcon = (phase: string) => {
    switch (phase) {
      case 'Running':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'Pending':
        return <HourglassEmptyIcon fontSize="small" color="warning" />;
      case 'Failed':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'Unknown':
        return <WarningIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };
  
  const getContainerReadiness = () => {
    const readyCount = containerStatuses.filter((cs: any) => cs.ready).length;
    return {
      ready: readyCount,
      total: containerStatuses.length,
      percent: containerStatuses.length > 0 
        ? Math.round((readyCount / containerStatuses.length) * 100) 
        : 0
    };
  };
  
  const containerReadiness = getContainerReadiness();
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 1 }}>
            {getStatusIcon(podPhase)}
          </Box>
          <Typography variant="body2" fontWeight="medium">
            {podName}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Chip 
              label={podPhase} 
              size="small" 
              color={getStatusColor(podPhase) as any} 
              variant="outlined" 
              sx={{ mr: 1 }}
            />
            <IconButton 
              size="small" 
              onClick={handleToggleExpand}
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s',
                padding: 0.5
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" display="block" gutterBottom>
            Container Readiness: {containerReadiness.ready}/{containerReadiness.total}
          </Typography>
          <Tooltip title={`${containerReadiness.percent}% ready`}>
            <LinearProgress 
              variant="determinate" 
              value={containerReadiness.percent} 
              color={containerReadiness.percent === 100 ? "success" : "primary"}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Tooltip>
        </Box>
      </Box>
      
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5 }}>
          {containerStatuses.length > 0 && (
            <>
              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                Containers:
              </Typography>
              <List dense disablePadding>
                {containerStatuses.map((cs: any, index: number) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {cs.ready ? (
                        <CheckCircleIcon fontSize="small" color="success" />
                      ) : cs.state?.waiting ? (
                        <HourglassEmptyIcon fontSize="small" color="warning" />
                      ) : cs.state?.terminated ? (
                        <ErrorIcon fontSize="small" color="error" />
                      ) : (
                        <InfoIcon fontSize="small" color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={cs.name}
                      secondary={
                        cs.ready ? 'Ready' : 
                        cs.state?.waiting ? `Waiting: ${cs.state.waiting.reason}` :
                        cs.state?.terminated ? `Terminated: ${cs.state.terminated.reason}` :
                        'Unknown state'
                      }
                      primaryTypographyProps={{ variant: 'caption' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          
          {conditions.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                Conditions:
              </Typography>
              <List dense disablePadding>
                {conditions.map((condition: any, index: number) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {condition.status === 'True' ? (
                        <CheckCircleIcon fontSize="small" color="success" />
                      ) : (
                        <ErrorIcon fontSize="small" color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={condition.type}
                      secondary={condition.message || condition.reason || condition.status}
                      primaryTypographyProps={{ variant: 'caption' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          
          {events.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                Recent Events:
              </Typography>
              <List dense disablePadding>
                {events.slice(0, 3).map((event: any, index: number) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {event.type === 'Normal' ? (
                        <InfoIcon fontSize="small" color="info" />
                      ) : (
                        <WarningIcon fontSize="small" color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={event.reason}
                      secondary={`${event.message} (${new Date(event.lastTimestamp).toLocaleTimeString()})`}
                      primaryTypographyProps={{ variant: 'caption' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
