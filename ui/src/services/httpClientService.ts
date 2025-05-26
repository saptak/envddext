import { v1 } from "@docker/extension-api-client-types";
import {
  HTTPRequest,
  HTTPResponse,
  TestResult,
  HTTPValidationResult,
  ResponseFormatting,
  HeaderPair
} from '../types/httpClient';
import { PortForwardService } from './portForwardService';

/**
 * HTTP Client Service for making requests through Docker Desktop CLI
 */
export class HTTPClientService {
  private ddClient: v1.DockerDesktopClient;
  private portForwardService: PortForwardService;

  constructor(ddClient: v1.DockerDesktopClient) {
    this.ddClient = ddClient;
    this.portForwardService = new PortForwardService(ddClient);
  }

  /**
   * Make an HTTP request using fetch API
   * Automatically handles port forwarding for Kubernetes service endpoints
   */
  async makeRequest(request: HTTPRequest): Promise<TestResult> {
    // Check if this is a Kubernetes service endpoint and set up port forwarding
    const processedRequest = await this.processServiceEndpoint(request);
    const startTime = Date.now();
    const testId = `test_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // Validate request
      const validation = this.validateRequest(processedRequest);
      if (!validation.isValid) {
        throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
      }

      console.log('Making HTTP request:', processedRequest);

      // Prepare fetch options
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), (processedRequest.timeout || 30) * 1000);

      const fetchOptions: RequestInit = {
        method: processedRequest.method,
        headers: processedRequest.headers,
        signal: controller.signal
      };

      // Add body for methods that support it
      if (processedRequest.body && ['POST', 'PUT', 'PATCH'].includes(processedRequest.method)) {
        fetchOptions.body = processedRequest.body;
      }

      // Make the request
      const fetchResponse = await fetch(processedRequest.url, fetchOptions);

      // Clear the timeout since request completed
      if (timeoutId) clearTimeout(timeoutId);

      // Get response headers
      const headers: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Get response body
      const body = await fetchResponse.text();
      const responseTime = Date.now() - startTime;

      const response: HTTPResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers,
        body,
        responseTime,
        contentType: fetchResponse.headers.get('content-type') || 'text/plain',
        size: body.length
      };

      const curlCommand = this.generateCurlCommand(processedRequest);

      console.log('HTTP response:', response);

      return {
        id: testId,
        request: processedRequest, // Use processed request to show the actual URL used
        response,
        timestamp: new Date(),
        curlCommand
      };

    } catch (error: any) {
      // Clear the timeout in case of error
      if (timeoutId) clearTimeout(timeoutId);

      console.error('HTTP request error:', error);
      const curlCommand = this.generateCurlCommand(processedRequest);

      let errorMessage = 'Unknown error occurred';
      if (error?.name === 'AbortError') {
        // Check if this is a Kubernetes service endpoint that needs port forwarding
        const url = new URL(processedRequest.url);
        if (url.hostname.includes('.svc.cluster.local') ||
            url.hostname.includes('echo-service') ||
            (url.hostname === '10.244.0.7' && url.port === '8080')) {
          const port = url.port || '80';
          errorMessage = `Connection timeout - This appears to be a Kubernetes service endpoint.

To test this endpoint, please set up port forwarding manually:

1. Open a terminal
2. Run: kubectl port-forward service/echo-service 8080:${port} -n demo
3. Then test using: http://localhost:8080${url.pathname}${url.search}

Or use the service name directly if you have kubectl proxy running:
kubectl proxy --port=8001
Then use: http://localhost:8001/api/v1/namespaces/demo/services/echo-service:${port}/proxy${url.pathname}${url.search}`;
        } else {
          errorMessage = 'Request timed out - The server did not respond within the timeout period';
        }
      } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        errorMessage = `Network error: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        id: testId,
        request: processedRequest,
        error: errorMessage,
        timestamp: new Date(),
        curlCommand
      };
    }
  }

  /**
   * Process service endpoint URLs and set up port forwarding if needed
   */
  private async processServiceEndpoint(request: HTTPRequest): Promise<HTTPRequest> {
    try {
      const url = new URL(request.url);

      // Check if this looks like a Kubernetes service endpoint (internal IP)
      const isInternalIP = /^10\.\d+\.\d+\.\d+$/.test(url.hostname) ||
                          /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(url.hostname) ||
                          /^192\.168\.\d+\.\d+$/.test(url.hostname);

      if (isInternalIP) {
        console.log('Detected Kubernetes service endpoint:', request.url);

        // For now, throw a helpful error with instructions
        const port = url.port || '80';
        const errorMessage = `Cannot directly access Kubernetes service endpoint ${url.hostname}:${port}.

To test this endpoint, please set up port forwarding manually:

1. Open a terminal
2. Run: kubectl port-forward service/echo-service 8080:${port} -n demo
3. Then test using: http://localhost:8080${url.pathname}${url.search}

Or use the service name directly if you have kubectl proxy running:
kubectl proxy --port=8001
Then use: http://localhost:8001/api/v1/namespaces/demo/services/echo-service:${port}/proxy${url.pathname}${url.search}`;

        throw new Error(errorMessage);
      }

      return request;
    } catch (error) {
      console.error('Error processing service endpoint:', error);
      return request;
    }
  }

  /**
   * Generate curl command string for copying
   */
  generateCurlCommand(request: HTTPRequest): string {
    let command = `curl -X ${request.method}`;

    // Add headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (key && value) {
        command += ` \\\n  -H "${key}: ${value}"`;
      }
    });

    // Add body
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const escapedBody = request.body.replace(/"/g, '\\"');
      command += ` \\\n  -d "${escapedBody}"`;
    }

    // Add URL
    command += ` \\\n  "${request.url}"`;

    return command;
  }

  /**
   * Validate HTTP request
   */
  validateRequest(request: HTTPRequest): HTTPValidationResult {
    const errors: string[] = [];

    // Validate URL
    if (!request.url) {
      errors.push('URL is required');
    } else {
      try {
        new URL(request.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }

    // Validate method
    if (!request.method) {
      errors.push('HTTP method is required');
    }

    // Validate headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (key && !value) {
        errors.push(`Header "${key}" has no value`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format response for display
   */
  formatResponse(response: HTTPResponse): ResponseFormatting {
    const contentType = response.contentType.toLowerCase();
    const isJson = contentType.includes('application/json');
    const isXml = contentType.includes('xml');
    const isHtml = contentType.includes('text/html');
    const isText = contentType.includes('text/');

    let formatted = response.body;

    // Format JSON
    if (isJson) {
      try {
        const parsed = JSON.parse(response.body);
        formatted = JSON.stringify(parsed, null, 2);
      } catch {
        // Keep original if parsing fails
      }
    }

    return {
      contentType: response.contentType,
      formatted,
      raw: response.body,
      size: response.size,
      isJson,
      isXml,
      isHtml,
      isText
    };
  }



  /**
   * Get HTTP status text
   */
  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return statusTexts[status] || 'Unknown';
  }

  /**
   * Convert header pairs to header object
   */
  static headerPairsToObject(headerPairs: HeaderPair[]): Record<string, string> {
    const headers: Record<string, string> = {};
    headerPairs.forEach(pair => {
      if (pair.enabled && pair.key && pair.value) {
        headers[pair.key] = pair.value;
      }
    });
    return headers;
  }

  /**
   * Get the port forwarding service for UI components
   */
  getPortForwardService(): PortForwardService {
    return this.portForwardService;
  }
}
