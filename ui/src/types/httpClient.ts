/**
 * HTTP Client Types for Envoy Gateway Extension Testing Tools
 */

export interface HTTPRequest {
  method: HTTPMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface HTTPResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  contentType: string;
  size: number;
}

export interface TestResult {
  id: string;
  request: HTTPRequest;
  response?: HTTPResponse;
  error?: string;
  timestamp: Date;
  curlCommand: string;
}

export interface HTTPClientState {
  method: HTTPMethod;
  url: string;
  headers: HeaderPair[];
  body: string;
  loading: boolean;
  error: string | null;
  response: HTTPResponse | null;
  history: TestResult[];
}

export interface HeaderPair {
  key: string;
  value: string;
  enabled: boolean;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export const DEFAULT_HEADERS: HeaderPair[] = [
  { key: 'Content-Type', value: 'application/json', enabled: true },
  { key: 'Accept', value: 'application/json', enabled: true },
  { key: 'User-Agent', value: 'Envoy-Gateway-Extension/1.0', enabled: true }
];

export const COMMON_CONTENT_TYPES = [
  'application/json',
  'application/xml',
  'text/plain',
  'text/html',
  'application/x-www-form-urlencoded',
  'multipart/form-data'
];

export interface HTTPClientFormData {
  method: HTTPMethod;
  url: string;
  headers: HeaderPair[];
  body: string;
}

export interface CurlCommandOptions {
  includeHeaders: boolean;
  includeVerbose: boolean;
  includeTiming: boolean;
  includeInsecure: boolean;
}

export interface HTTPTestPreset {
  id: string;
  name: string;
  description: string;
  request: HTTPRequest;
  category: 'health' | 'crud' | 'auth' | 'custom';
}

export const DEFAULT_HTTP_CLIENT_STATE: HTTPClientState = {
  method: 'GET',
  url: '',
  headers: [...DEFAULT_HEADERS],
  body: '',
  loading: false,
  error: null,
  response: null,
  history: []
};

export interface RouteTestingContext {
  routeName: string;
  namespace: string;
  gatewayName?: string;
  gatewayNamespace?: string;
  baseUrl?: string;
  pathPrefix?: string;
}

export interface HTTPValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ResponseFormatting {
  contentType: string;
  formatted: string;
  raw: string;
  size: number;
  isJson: boolean;
  isXml: boolean;
  isHtml: boolean;
  isText: boolean;
}
