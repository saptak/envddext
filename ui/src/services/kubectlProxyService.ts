import { v1 } from "@docker/extension-api-client-types";

export interface ProxyStatus {
  isRunning: boolean;
  port: number;
  pid?: number;
  error?: string;
  startTime?: Date;
}

export interface ServiceEndpoint {
  serviceName: string;
  namespace: string;
  port: number;
  path?: string;
}

/**
 * Service for managing kubectl proxy functionality
 */
export class KubectlProxyService {
  private ddClient: v1.DockerDesktopClient;
  private proxyStatus: ProxyStatus;
  private statusCheckInterval?: NodeJS.Timeout;
  private readonly DEFAULT_PROXY_PORT = 8001;

  constructor(ddClient: v1.DockerDesktopClient) {
    this.ddClient = ddClient;
    this.proxyStatus = {
      isRunning: false,
      port: this.DEFAULT_PROXY_PORT
    };
  }

  /**
   * Start kubectl proxy
   */
  async startProxy(port: number = this.DEFAULT_PROXY_PORT): Promise<ProxyStatus> {
    try {
      console.log(`Starting kubectl proxy on port ${port} via backend...`);

      // First, check if proxy is already running
      const currentStatus = await this.checkProxyStatus();
      if (currentStatus.isRunning) {
        console.log('Kubectl proxy is already running');
        return currentStatus;
      }

      // Use the VM backend to start the proxy
      const response = await this.ddClient.extension.vm?.service?.post('/start-proxy', { port }) as any;

      if (response?.success) {
        this.proxyStatus = {
          isRunning: response.data?.isRunning || true,
          port: response.data?.port || port,
          startTime: new Date(),
          pid: response.data?.pid
        };

        // Start status monitoring
        this.startStatusMonitoring();

        console.log(`Kubectl proxy started successfully on port ${port}`);
        return this.proxyStatus;
      } else {
        throw new Error(response?.error || 'Unknown error starting proxy');
      }

    } catch (error: any) {
      console.error('Failed to start kubectl proxy:', error);
      this.proxyStatus = {
        isRunning: false,
        port: port,
        error: typeof error === 'string' ? error : error.message || 'Unknown error'
      };
      return this.proxyStatus;
    }
  }

  /**
   * Stop kubectl proxy
   */
  async stopProxy(): Promise<void> {
    try {
      console.log('Stopping kubectl proxy via backend...');

      // Stop status monitoring
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
        this.statusCheckInterval = undefined;
      }

      // Use the VM backend to stop the proxy
      const response = await this.ddClient.extension.vm?.service?.post('/stop-proxy', { port: this.proxyStatus.port }) as any;

      if (response?.success) {
        console.log('Kubectl proxy stopped successfully via backend');
      } else {
        console.warn('Backend stop proxy returned error:', response?.error);
        // Continue anyway - we still want to update our local status
      }

      // Update status
      this.proxyStatus = {
        isRunning: false,
        port: this.DEFAULT_PROXY_PORT
      };

      console.log('Kubectl proxy stopped successfully');

    } catch (error: any) {
      console.error('Error stopping kubectl proxy:', error);
      // Still update status to stopped, as we tried our best
      this.proxyStatus = {
        isRunning: false,
        port: this.DEFAULT_PROXY_PORT,
        error: typeof error === 'string' ? error : error.message || 'Error during stop'
      };
    }
  }

  /**
   * Check if kubectl proxy is currently running
   */
  async checkProxyStatus(): Promise<ProxyStatus> {
    try {
      // Use the VM backend to check proxy status
      const response = await this.ddClient.extension.vm?.service?.get(`/proxy-status?port=${this.proxyStatus.port}`) as any;

      if (response?.success && response.data) {
        this.proxyStatus = {
          ...this.proxyStatus,
          isRunning: response.data.isRunning,
          port: response.data.port,
          pid: response.data.pid,
          error: undefined
        };
      } else {
        // Fallback to local check if backend fails
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const httpResponse = await fetch(`http://localhost:${this.proxyStatus.port}/api/v1`, {
            method: 'GET',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (httpResponse.ok) {
            this.proxyStatus.isRunning = true;
            this.proxyStatus.error = undefined;
          } else {
            this.proxyStatus.isRunning = false;
            this.proxyStatus.error = `Proxy responded with status ${httpResponse.status}`;
          }
        } catch (error: any) {
          this.proxyStatus.isRunning = false;
          if (error.name === 'AbortError') {
            this.proxyStatus.error = 'Proxy connection timeout';
          } else {
            this.proxyStatus.error = 'Proxy not responding';
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking proxy status:', error);
      this.proxyStatus.isRunning = false;
      this.proxyStatus.error = 'Backend status check failed';
    }

    return { ...this.proxyStatus };
  }

  /**
   * Get current proxy status
   */
  getProxyStatus(): ProxyStatus {
    return { ...this.proxyStatus };
  }

  /**
   * Generate proxy URL for a Kubernetes service
   */
  generateProxyUrl(serviceName: string, namespace: string, port: number, path: string = ''): string {
    const basePath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:${this.proxyStatus.port}/api/v1/namespaces/${namespace}/services/${serviceName}:${port}/proxy${basePath}`;
  }

  /**
   * Generate proxy URL from service endpoint object
   */
  generateProxyUrlFromEndpoint(endpoint: ServiceEndpoint): string {
    return this.generateProxyUrl(
      endpoint.serviceName,
      endpoint.namespace,
      endpoint.port,
      endpoint.path || ''
    );
  }

  /**
   * Parse a Kubernetes service URL and suggest proxy URL
   */
  suggestProxyUrl(originalUrl: string): string | null {
    try {
      const url = new URL(originalUrl);

      // Check if this looks like a Kubernetes service endpoint
      if (url.hostname.includes('.svc.cluster.local')) {
        // Parse service.namespace.svc.cluster.local format
        const parts = url.hostname.split('.');
        if (parts.length >= 2) {
          const serviceName = parts[0];
          const namespace = parts[1];
          const port = parseInt(url.port) || 80;
          return this.generateProxyUrl(serviceName, namespace, port, url.pathname);
        }
      }

      // Check for common service patterns
      if (url.hostname.includes('echo-service') || url.hostname.includes('demo')) {
        // Assume it's the demo echo service
        const port = parseInt(url.port) || 8080;
        return this.generateProxyUrl('echo-service', 'demo', port, url.pathname);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Start monitoring proxy status
   */
  private startStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }

    this.statusCheckInterval = setInterval(async () => {
      await this.checkProxyStatus();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = undefined;
    }
  }

  /**
   * Get common service endpoints for quick access
   */
  getCommonServiceEndpoints(): ServiceEndpoint[] {
    return [
      {
        serviceName: 'echo-service',
        namespace: 'demo',
        port: 8080,
        path: '/'
      },
      {
        serviceName: 'kubernetes',
        namespace: 'default',
        port: 443,
        path: '/'
      }
    ];
  }

  /**
   * Test proxy connectivity
   */
  async testProxyConnectivity(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing kubectl proxy connectivity via backend...');

      // Use the VM backend to test proxy connectivity
      const response = await this.ddClient.extension.vm?.service?.get(`/test-proxy?port=${this.proxyStatus.port}`) as any;

      if (response?.success && response.data) {
        const testData = response.data;
        
        if (testData.connectivity) {
          return {
            success: true,
            message: testData.message || 'Kubectl proxy is working correctly'
          };
        } else {
          return {
            success: false,
            message: testData.message || 'Proxy connectivity test failed'
          };
        }
      } else {
        return {
          success: false,
          message: response?.error || 'Backend test failed'
        };
      }

    } catch (error: any) {
      console.error('Error testing proxy connectivity:', error);
      return {
        success: false,
        message: `Proxy connectivity test failed: ${error.message || 'Unknown error'}`
      };
    }
  }
}