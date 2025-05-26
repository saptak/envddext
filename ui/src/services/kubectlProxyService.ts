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
      console.log(`Starting kubectl proxy on port ${port}...`);

      // First, check if proxy is already running
      const currentStatus = await this.checkProxyStatus();
      if (currentStatus.isRunning) {
        console.log('Kubectl proxy is already running');
        return currentStatus;
      }

      // Stop any existing proxy first
      await this.stopProxy();

      // Start the proxy using Docker Desktop CLI
      const output = await this.ddClient.extension.host?.cli.exec("kubectl", [
        "proxy",
        "--port=" + port.toString(),
        "--accept-hosts=^localhost$,^127\\.0\\.0\\.1$,^\\[::1\\]$"
      ]);

      if (output?.stderr && !output.stderr.includes("Starting to serve")) {
        throw new Error(`Failed to start kubectl proxy: ${output.stderr}`);
      }

      // Update status
      this.proxyStatus = {
        isRunning: true,
        port: port,
        startTime: new Date()
      };

      // Start status monitoring
      this.startStatusMonitoring();

      console.log(`Kubectl proxy started successfully on port ${port}`);
      return this.proxyStatus;

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
      console.log('Stopping kubectl proxy...');

      // Stop status monitoring
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
        this.statusCheckInterval = undefined;
      }

      // Try to find and kill kubectl proxy processes
      // Note: This is a simplified approach. In production, we'd want to track the actual PID
      try {
        const killOutput = await this.ddClient.extension.host?.cli.exec("pkill", [
          "-f",
          "kubectl proxy"
        ]);
        console.log('Kubectl proxy processes killed:', killOutput?.stdout);
      } catch (killError) {
        // It's okay if pkill fails - the process might not be running
        console.log('No kubectl proxy processes found to kill');
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
      // Try to make a simple request to the proxy endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(`http://localhost:${this.proxyStatus.port}/api/v1`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.proxyStatus.isRunning = true;
        this.proxyStatus.error = undefined;
      } else {
        this.proxyStatus.isRunning = false;
        this.proxyStatus.error = `Proxy responded with status ${response.status}`;
      }
    } catch (error: any) {
      this.proxyStatus.isRunning = false;
      if (error.name === 'AbortError') {
        this.proxyStatus.error = 'Proxy connection timeout';
      } else {
        this.proxyStatus.error = 'Proxy not responding';
      }
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
      const status = await this.checkProxyStatus();

      if (!status.isRunning) {
        return {
          success: false,
          message: 'Kubectl proxy is not running'
        };
      }

      // Try to access the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`http://localhost:${this.proxyStatus.port}/api/v1`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          message: 'Kubectl proxy is working correctly'
        };
      } else {
        return {
          success: false,
          message: `Proxy returned status ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Proxy connectivity test failed: ${error.message || 'Unknown error'}`
      };
    }
  }
}
