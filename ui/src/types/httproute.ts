// HTTPRoute API Types and Interfaces

export interface HTTPRouteMatch {
  path?: {
    type: 'Exact' | 'PathPrefix' | 'RegularExpression';
    value: string;
  };
  headers?: Array<{
    type: 'Exact' | 'RegularExpression';
    name: string;
    value: string;
  }>;
  queryParams?: Array<{
    type: 'Exact' | 'RegularExpression';
    name: string;
    value: string;
  }>;
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
}

export interface HTTPBackendRef {
  group?: string;
  kind?: string;
  name: string;
  namespace?: string;
  port?: number;
  weight?: number;
}

export interface HTTPRouteFilter {
  type: 'RequestHeaderModifier' | 'ResponseHeaderModifier' | 'RequestMirror' | 'RequestRedirect' | 'URLRewrite' | 'ExtensionRef';
  requestHeaderModifier?: {
    set?: Array<{ name: string; value: string }>;
    add?: Array<{ name: string; value: string }>;
    remove?: string[];
  };
  responseHeaderModifier?: {
    set?: Array<{ name: string; value: string }>;
    add?: Array<{ name: string; value: string }>;
    remove?: string[];
  };
  requestRedirect?: {
    scheme?: string;
    hostname?: string;
    path?: {
      type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
      replaceFullPath?: string;
      replacePrefixMatch?: string;
    };
    port?: number;
    statusCode?: number;
  };
  urlRewrite?: {
    hostname?: string;
    path?: {
      type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
      replaceFullPath?: string;
      replacePrefixMatch?: string;
    };
  };
}

export interface HTTPRouteTimeouts {
  request?: string;
  backendRequest?: string;
}

export interface HTTPRouteRule {
  name?: string;
  matches?: HTTPRouteMatch[];
  filters?: HTTPRouteFilter[];
  backendRefs?: HTTPBackendRef[];
  timeouts?: HTTPRouteTimeouts;
}

export interface HTTPRouteSpec {
  parentRefs: Array<{
    group?: string;
    kind?: string;
    name: string;
    namespace?: string;
    sectionName?: string;
    port?: number;
  }>;
  hostnames?: string[];
  rules?: HTTPRouteRule[];
}

export interface HTTPRouteStatus {
  parents?: Array<{
    parentRef: {
      group?: string;
      kind?: string;
      name: string;
      namespace?: string;
      sectionName?: string;
      port?: number;
    };
    controllerName: string;
    conditions: Array<{
      type: string;
      status: 'True' | 'False' | 'Unknown';
      reason: string;
      message: string;
      lastTransitionTime: string;
    }>;
  }>;
}

export interface HTTPRoute {
  apiVersion: 'gateway.networking.k8s.io/v1';
  kind: 'HTTPRoute';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    uid?: string;
  };
  spec: HTTPRouteSpec;
  status?: HTTPRouteStatus;
}

// Form data interfaces for UI components
export interface HTTPRouteMatchFormData {
  pathType: 'Exact' | 'PathPrefix' | 'RegularExpression';
  pathValue: string;
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
  headers: Array<{
    type: 'Exact' | 'RegularExpression';
    name: string;
    value: string;
  }>;
  queryParams: Array<{
    type: 'Exact' | 'RegularExpression';
    name: string;
    value: string;
  }>;
}

export interface HTTPBackendRefFormData {
  name: string;
  namespace?: string;
  port: number;
  weight: number;
}

export interface HTTPRouteRuleFormData {
  name?: string;
  matches: HTTPRouteMatchFormData[];
  backendRefs: HTTPBackendRefFormData[];
  requestTimeout?: string;
  backendRequestTimeout?: string;
}

export interface HTTPRouteFormData {
  name: string;
  namespace: string;
  parentGateway: string;
  parentGatewayNamespace?: string;
  hostnames: string[];
  rules: HTTPRouteRuleFormData[];
}

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface HTTPRouteValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Status monitoring interfaces
export interface HTTPRouteStatusInfo {
  name: string;
  namespace: string;
  status: 'ready' | 'pending' | 'failed' | 'unknown';
  message?: string;
  parentGateways?: Array<{
    name: string;
    namespace: string;
    status: 'accepted' | 'pending' | 'failed';
    message?: string;
  }>;
  backendServices?: Array<{
    name: string;
    namespace: string;
    status: 'available' | 'unavailable' | 'unknown';
    endpoints?: number;
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
export const DEFAULT_HTTPROUTE_FORM_DATA: HTTPRouteFormData = {
  name: '',
  namespace: 'default',
  parentGateway: '',
  parentGatewayNamespace: 'default',
  hostnames: [],
  rules: [
    {
      matches: [
        {
          pathType: 'PathPrefix',
          pathValue: '/',
          headers: [],
          queryParams: []
        }
      ],
      backendRefs: [
        {
          name: '',
          port: 80,
          weight: 100
        }
      ]
    }
  ]
};

export const SUPPORTED_PATH_TYPES = ['Exact', 'PathPrefix', 'RegularExpression'] as const;
export const SUPPORTED_HEADER_TYPES = ['Exact', 'RegularExpression'] as const;
export const SUPPORTED_HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'] as const;
export const SUPPORTED_FILTER_TYPES = ['RequestHeaderModifier', 'ResponseHeaderModifier', 'RequestRedirect', 'URLRewrite'] as const;
