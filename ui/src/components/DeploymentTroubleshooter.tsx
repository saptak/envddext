import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';

interface DeploymentTroubleshooterProps {
  deploymentStatus: any;
  podDetails: any[];
}

export const DeploymentTroubleshooter: React.FC<DeploymentTroubleshooterProps> = ({
  deploymentStatus,
  podDetails
}) => {
  // Identify common issues
  const issues = identifyIssues(deploymentStatus, podDetails);
  
  if (issues.length === 0) {
    return null;
  }
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Troubleshooting
      </Typography>
      
      {issues.map((issue, index) => (
        <Accordion key={index} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {issue.severity === 'error' ? (
                <ErrorIcon color="error" sx={{ mr: 1 }} />
              ) : (
                <WarningIcon color="warning" sx={{ mr: 1 }} />
              )}
              <Typography variant="body2" fontWeight="medium">
                {issue.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              {issue.description}
            </Typography>
            
            {issue.steps && (
              <>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Suggested steps:
                </Typography>
                <List dense disablePadding>
                  {issue.steps.map((step, stepIndex) => (
                    <ListItem key={stepIndex} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <BuildIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={step}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            
            {issue.docs && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Documentation:
                </Typography>
                <List dense disablePadding>
                  {issue.docs.map((doc, docIndex) => (
                    <ListItem key={docIndex} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <HelpIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Link href={doc.url} target="_blank" rel="noopener">
                            {doc.title}
                          </Link>
                        }
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

interface Issue {
  severity: 'warning' | 'error';
  title: string;
  description: string;
  steps?: string[];
  docs?: { title: string; url: string }[];
}

const identifyIssues = (deploymentStatus: any, podDetails: any[]): Issue[] => {
  const issues: Issue[] = [];
  
  // Check if deployment exists
  if (deploymentStatus.status === 'not_found') {
    issues.push({
      severity: 'error',
      title: 'Deployment not found',
      description: 'The deployment could not be found in the specified namespace.',
      steps: [
        'Verify that you have applied the template correctly',
        'Check if the namespace exists',
        'Check if the deployment was deleted'
      ],
      docs: [
        {
          title: 'Kubernetes Deployments',
          url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/'
        }
      ]
    });
    return issues;
  }
  
  // Check for insufficient replicas
  if (deploymentStatus.readyReplicas < deploymentStatus.desiredReplicas) {
    issues.push({
      severity: 'warning',
      title: 'Insufficient ready replicas',
      description: `Only ${deploymentStatus.readyReplicas} of ${deploymentStatus.desiredReplicas} desired replicas are ready.`,
      steps: [
        'Check pod status for more details',
        'Verify that resources (CPU/memory) are available in the cluster',
        'Check for pod scheduling issues'
      ]
    });
  }
  
  // Check for pod issues
  for (const pod of podDetails) {
    const podPhase = pod.status?.phase;
    const containerStatuses = pod.status?.containerStatuses || [];
    
    // Check for pending pods
    if (podPhase === 'Pending') {
      issues.push({
        severity: 'warning',
        title: `Pod ${pod.metadata.name} is pending`,
        description: 'The pod is in Pending state and not yet running.',
        steps: [
          'Check if there are sufficient resources in the cluster',
          'Verify that the pod can be scheduled (no taints preventing scheduling)',
          'Check events for more details'
        ]
      });
    }
    
    // Check for failed pods
    if (podPhase === 'Failed') {
      issues.push({
        severity: 'error',
        title: `Pod ${pod.metadata.name} has failed`,
        description: 'The pod is in Failed state.',
        steps: [
          'Check the pod logs for error messages',
          'Verify that the container image exists and is accessible',
          'Check if the container is crashing on startup'
        ]
      });
    }
    
    // Check for container issues
    for (const cs of containerStatuses) {
      if (!cs.ready) {
        if (cs.state?.waiting) {
          const reason = cs.state.waiting.reason;
          const message = cs.state.waiting.message;
          
          issues.push({
            severity: reason === 'ContainerCreating' ? 'warning' : 'error',
            title: `Container ${cs.name} is waiting: ${reason}`,
            description: message || `The container is waiting due to: ${reason}`,
            steps: getStepsForContainerIssue(reason)
          });
        } else if (cs.state?.terminated) {
          const reason = cs.state.terminated.reason;
          const exitCode = cs.state.terminated.exitCode;
          
          issues.push({
            severity: 'error',
            title: `Container ${cs.name} terminated: ${reason} (Exit code: ${exitCode})`,
            description: `The container has terminated with exit code ${exitCode}.`,
            steps: [
              'Check the container logs for error messages',
              'Verify that the application inside the container is configured correctly',
              `Research the specific exit code ${exitCode} for your application`
            ]
          });
        }
      }
    }
  }
  
  // Check for events that indicate issues
  const errorEvents = podDetails.flatMap(pod => 
    (pod.events || []).filter((event: any) => event.type === 'Warning')
  );
  
  for (const event of errorEvents) {
    issues.push({
      severity: 'warning',
      title: `Event: ${event.reason}`,
      description: event.message,
      steps: getStepsForEventIssue(event.reason)
    });
  }
  
  return issues;
};

const getStepsForContainerIssue = (reason: string): string[] => {
  switch (reason) {
    case 'ImagePullBackOff':
    case 'ErrImagePull':
      return [
        'Verify that the image name is correct',
        'Check if the image exists in the registry',
        'Ensure that the cluster has access to the image registry',
        'If using a private registry, check that pull secrets are configured'
      ];
    case 'CrashLoopBackOff':
      return [
        'Check the container logs for error messages',
        'Verify that the application inside the container is configured correctly',
        'Ensure the container has the resources it needs',
        'Check if the container is exiting immediately after starting'
      ];
    case 'ContainerCreating':
      return [
        'Wait for the container to finish creating',
        'Check if there are resource constraints',
        'Verify that volumes can be mounted correctly'
      ];
    default:
      return [
        'Check the pod events for more details',
        'Inspect the container logs',
        'Verify the deployment configuration'
      ];
  }
};

const getStepsForEventIssue = (reason: string): string[] => {
  switch (reason) {
    case 'FailedScheduling':
      return [
        'Check if there are sufficient resources in the cluster',
        'Verify that there are no node taints preventing scheduling',
        'Ensure that node selectors or affinity rules can be satisfied'
      ];
    case 'FailedMount':
      return [
        'Verify that the referenced volumes exist',
        'Check permissions on the volumes',
        'Ensure that PersistentVolumeClaims are bound'
      ];
    default:
      return [
        'Check the pod events for more details',
        'Inspect the container logs',
        'Verify the deployment configuration'
      ];
  }
};
