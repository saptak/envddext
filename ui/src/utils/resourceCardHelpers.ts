import { Gateway, HTTPRoute } from '../types/gateway';

export interface ResourceCardData {
  type: 'Gateway' | 'HTTPRoute';
  name: string;
  namespace: string;
  status?: {
    condition?: string;
    ready?: boolean;
    message?: string;
  };
  details: {
    [key: string]: string | number | string[];
  };
}

export const extractGatewayCardData = (gateway: Gateway): ResourceCardData => {
  const conditions = gateway.status?.conditions || [];
  const readyCondition = conditions.find(c => c.type === 'Ready' || c.type === 'Accepted');
  const addresses = gateway.status?.addresses?.map(addr => addr.value) || [];
  
  // Extract listener information
  const listeners = gateway.spec.listeners;
  const listenerSummary = listeners.map(l => `${l.name}:${l.port}/${l.protocol}`);
  
  // Calculate attached routes across all listeners
  const totalAttachedRoutes = gateway.status?.listeners?.reduce((sum, listener) => 
    sum + (listener.attachedRoutes || 0), 0) || 0;

  return {
    type: 'Gateway',
    name: gateway.metadata.name,
    namespace: gateway.metadata.namespace,
    status: {
      condition: readyCondition?.reason || readyCondition?.type || 'Unknown',
      ready: readyCondition?.status === 'True',
      message: readyCondition?.message,
    },
    details: {
      'Gateway Class': gateway.spec.gatewayClassName,
      'Listeners': listenerSummary,
      'Addresses': addresses.length > 0 ? addresses : ['Not assigned'],
      'Attached Routes': totalAttachedRoutes,
      'Age': gateway.metadata.creationTimestamp ? 
        formatAge(gateway.metadata.creationTimestamp) : 'Unknown',
    },
  };
};

export const extractHTTPRouteCardData = (httpRoute: HTTPRoute): ResourceCardData => {
  const conditions = httpRoute.status?.parents?.[0]?.conditions || [];
  const acceptedCondition = conditions.find(c => c.type === 'Accepted');
  const resolvedRefsCondition = conditions.find(c => c.type === 'ResolvedRefs');
  
  // Determine overall status
  const isAccepted = acceptedCondition?.status === 'True';
  const isResolved = resolvedRefsCondition?.status === 'True';
  const ready = isAccepted && isResolved;
  
  const statusMessage = !isAccepted ? acceptedCondition?.message : 
                       !isResolved ? resolvedRefsCondition?.message : 
                       'Route is ready';
  
  // Extract parent gateway information
  const parentRefs = httpRoute.spec.parentRefs;
  const parentGateways = parentRefs.map(ref => 
    `${ref.name}${ref.namespace ? ` (${ref.namespace})` : ''}`);
  
  // Extract hostnames
  const hostnames = httpRoute.spec.hostnames || ['*'];
  
  // Extract rules summary
  const rules = httpRoute.spec.rules || [];
  const pathSummary = rules.flatMap(rule => 
    rule.matches?.map(match => match.path?.value || '/') || ['/']
  );
  
  // Extract backend services
  const backends = rules.flatMap(rule => 
    rule.backendRefs?.map(ref => `${ref.name}:${ref.port}`) || []
  );

  return {
    type: 'HTTPRoute',
    name: httpRoute.metadata.name,
    namespace: httpRoute.metadata.namespace,
    status: {
      condition: ready ? 'Ready' : (isAccepted ? 'Accepted' : 'Failed'),
      ready,
      message: statusMessage,
    },
    details: {
      'Parent Gateways': parentGateways,
      'Hostnames': hostnames,
      'Paths': Array.from(new Set(pathSummary)), // Remove duplicates
      'Backend Services': Array.from(new Set(backends)), // Remove duplicates
      'Rules': rules.length,
      'Age': httpRoute.metadata.creationTimestamp ? 
        formatAge(httpRoute.metadata.creationTimestamp) : 'Unknown',
    },
  };
};

// Helper function to format age from creation timestamp
const formatAge = (creationTimestamp: string): string => {
  const created = new Date(creationTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Just now';
};