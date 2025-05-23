// Gateway API Types and Interfaces

export interface GatewayListener {
  name: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'UDP' | 'TLS';
  hostname?: string;
  tls?: {
    mode?: 'Terminate' | 'Passthrough';
    certificateRefs?: Array<{
      name: string;
      namespace?: string;
    }>;
  };
  allowedRoutes?: {
    namespaces?: {
      from: 'All' | 'Same' | 'Selector';
      selector?: any;
    };
    kinds?: Array<{
      group?: string;
      kind: string;
    }>;
  };
}

export interface GatewaySpec {
  gatewayClassName: string;
  listeners: GatewayListener[];
  addresses?: Array<{
    type?: string;
    value: string;
  }>;
}

export interface GatewayStatus {
  addresses?: Array<{
    type?: string;
    value: string;
  }>;
  conditions?: Array<{
    type: string;
    status: 'True' | 'False' | 'Unknown';
    reason: string;
    message: string;
    lastTransitionTime: string;
  }>;
  listeners?: Array<{
    name: string;
    supportedKinds?: Array<{
      group?: string;
      kind: string;
    }>;
    attachedRoutes: number;
    conditions?: Array<{
      type: string;
      status: 'True' | 'False' | 'Unknown';
      reason: string;
      message: string;
      lastTransitionTime: string;
    }>;
  }>;
}

export interface Gateway {
  apiVersion: 'gateway.networking.k8s.io/v1';
  kind: 'Gateway';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    uid?: string;
  };
  spec: GatewaySpec;
  status?: GatewayStatus;
}

export interface GatewayClass {
  apiVersion: 'gateway.networking.k8s.io/v1';
  kind: 'GatewayClass';
  metadata: {
    name: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    controllerName: string;
    parametersRef?: {
      group: string;
      kind: string;
      name: string;
      namespace?: string;
    };
    description?: string;
  };
  status?: {
    conditions?: Array<{
      type: string;
      status: 'True' | 'False' | 'Unknown';
      reason: string;
      message: string;
      lastTransitionTime: string;
    }>;
  };
}

// Form data interfaces for creating Gateways
export interface GatewayFormData {
  name: string;
  namespace: string;
  gatewayClassName: string;
  listeners: GatewayListenerFormData[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface GatewayListenerFormData {
  name: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'UDP' | 'TLS';
  hostname?: string;
  tlsMode?: 'Terminate' | 'Passthrough';
  certificateName?: string;
  certificateNamespace?: string;
  allowedRoutesFrom: 'All' | 'Same' | 'Selector';
  allowedRouteKinds: string[];
}

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface GatewayValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Status monitoring interfaces
export interface GatewayStatusInfo {
  name: string;
  namespace: string;
  status: 'ready' | 'pending' | 'failed' | 'unknown';
  message?: string;
  addresses?: string[];
  listeners?: Array<{
    name: string;
    status: 'ready' | 'pending' | 'failed';
    attachedRoutes: number;
    message?: string;
  }>;
  conditions?: Array<{
    type: string;
    status: 'True' | 'False' | 'Unknown';
    reason: string;
    message: string;
    lastTransitionTime: string;
  }>;
  age?: string;
}

// Default values and constants
export const DEFAULT_GATEWAY_FORM_DATA: GatewayFormData = {
  name: '',
  namespace: 'default',
  gatewayClassName: 'envoy-gateway',
  listeners: [
    {
      name: 'http',
      port: 80,
      protocol: 'HTTP',
      allowedRoutesFrom: 'Same',
      allowedRouteKinds: ['HTTPRoute']
    }
  ]
};

export const SUPPORTED_PROTOCOLS = ['HTTP', 'HTTPS', 'TCP', 'UDP', 'TLS'] as const;
export const SUPPORTED_TLS_MODES = ['Terminate', 'Passthrough'] as const;
export const ALLOWED_ROUTES_FROM_OPTIONS = ['All', 'Same', 'Selector'] as const;
export const SUPPORTED_ROUTE_KINDS = ['HTTPRoute', 'GRPCRoute', 'TCPRoute', 'UDPRoute', 'TLSRoute'] as const;
