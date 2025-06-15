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
   * Make an HTTP request using the backend service
   * This bypasses CORS and DNS issues by using the backend
   */
  async makeRequest(request: HTTPRequest): Promise<TestResult> {
    const startTime = Date.now();
    const testId = `test_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
      }

      console.log('Making HTTP request via backend:', request);

      // Prepare request data for backend
      const backendRequest = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body || undefined,
        timeout: request.timeout || 30
      };

      // Make request to backend HTTP proxy endpoint
      const backendResponse = await this.ddClient.extension.vm?.service?.post('/http-request', backendRequest) as any;

      if (!backendResponse) {
        throw new Error(`No response from backend service. Request was: ${JSON.stringify(backendRequest, null, 2)}`);
      }

      // Handle nested response structure from Docker Desktop VM service
      const actualResponse = backendResponse.data || backendResponse;
      
      if (!actualResponse.success) {
        const debugInfo = `
Backend Error Details:
- Error: ${actualResponse.error || 'Unknown error'}
- Request: ${JSON.stringify(backendRequest, null, 2)}
- Backend Response: ${JSON.stringify(backendResponse, null, 2)}
- Actual Response: ${JSON.stringify(actualResponse, null, 2)}`;
        throw new Error(debugInfo);
      }

      const responseData = actualResponse.data;
      const response: HTTPResponse = {
        status: responseData.status,
        statusText: responseData.statusText,
        headers: responseData.headers,
        body: responseData.body,
        responseTime: responseData.responseTime,
        contentType: responseData.contentType || 'text/plain',
        size: responseData.size
      };

      const curlCommand = this.generateCurlCommand(request);

      console.log('HTTP response via backend:', response);

      return {
        id: testId,
        request,
        response,
        timestamp: new Date(),
        curlCommand
      };

    } catch (error: any) {
      console.error('HTTP request error:', error);
      const curlCommand = this.generateCurlCommand(request);

      let errorMessage = 'Unknown error occurred';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Provide helpful guidance for common issues
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error')) {
        const url = new URL(request.url);
        if (url.hostname.includes('local') || url.hostname.includes('echo')) {
          errorMessage += `

This appears to be testing a local service. Try these options:

1. **Gateway External IP**: Check if your Gateway has an external IP:
   - Go to Infrastructure > Gateways
   - Use the external IP instead of '${url.hostname}'

2. **kubectl proxy**: Start kubectl proxy and use:
   - http://localhost:8001/api/v1/namespaces/demo/services/echo-service:80/proxy/

3. **Port forwarding**: Set up port forwarding:
   - kubectl port-forward service/echo-service 8080:80 -n demo
   - Then use: http://localhost:8080/`;
        }
      }

      return {
        id: testId,
        request,
        error: errorMessage,
        timestamp: new Date(),
        curlCommand
      };
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
