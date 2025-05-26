import { v1 } from "@docker/extension-api-client-types";

export interface PortForwardInfo {
  serviceName: string;
  namespace: string;
  servicePort: number;
  localPort: number;
  isActive: boolean;
  pid?: number;
}

export class PortForwardService {
  private ddClient: v1.DockerDesktopClient;
  private activeForwards: Map<string, PortForwardInfo> = new Map();

  constructor(ddClient: v1.DockerDesktopClient) {
    this.ddClient = ddClient;
  }

  /**
   * Start port forwarding for a service
   * Note: This is a simplified implementation that assumes port forwarding
   * For a production implementation, you'd want to use kubectl proxy or similar
   */
  async startPortForward(
    serviceName: string,
    namespace: string,
    servicePort: number,
    localPort?: number
  ): Promise<PortForwardInfo> {
    const key = `${namespace}/${serviceName}`;

    // Check if already forwarding
    if (this.activeForwards.has(key)) {
      const existing = this.activeForwards.get(key)!;
      if (existing.isActive) {
        return existing;
      }
    }

    // Use provided local port or find an available one
    const targetLocalPort = localPort || await this.findAvailablePort();

    try {
      console.log(`Setting up port forward: ${serviceName}.${namespace}:${servicePort} -> localhost:${targetLocalPort}`);

      // For now, we'll simulate the port forward setup
      // In a real implementation, you'd start a background process
      // or use kubectl proxy with proper process management

      const forwardInfo: PortForwardInfo = {
        serviceName,
        namespace,
        servicePort,
        localPort: targetLocalPort,
        isActive: true
      };

      this.activeForwards.set(key, forwardInfo);

      // Log the kubectl command that would be used
      console.log(`Would run: kubectl port-forward service/${serviceName} ${targetLocalPort}:${servicePort} -n ${namespace}`);

      return forwardInfo;

    } catch (error) {
      console.error('Failed to start port forward:', error);
      throw new Error(`Failed to start port forward: ${error}`);
    }
  }

  /**
   * Stop port forwarding for a service
   */
  async stopPortForward(serviceName: string, namespace: string): Promise<void> {
    const key = `${namespace}/${serviceName}`;
    const forwardInfo = this.activeForwards.get(key);

    if (!forwardInfo) {
      return;
    }

    try {
      // Kill the port-forward process
      // Note: This is a simplified approach. In a real implementation,
      // we'd need to track the actual process ID and kill it properly.
      console.log(`Stopping port forward for ${serviceName}.${namespace}`);

      // Mark as inactive
      forwardInfo.isActive = false;
      this.activeForwards.delete(key);

    } catch (error) {
      console.error('Failed to stop port forward:', error);
    }
  }

  /**
   * Get active port forwards
   */
  getActiveForwards(): PortForwardInfo[] {
    return Array.from(this.activeForwards.values()).filter(f => f.isActive);
  }

  /**
   * Get port forward info for a specific service
   */
  getPortForward(serviceName: string, namespace: string): PortForwardInfo | undefined {
    const key = `${namespace}/${serviceName}`;
    return this.activeForwards.get(key);
  }

  /**
   * Find an available local port
   */
  private async findAvailablePort(startPort: number = 8080): Promise<number> {
    // Simple implementation - in a real app, you'd check if ports are actually available
    const usedPorts = Array.from(this.activeForwards.values()).map(f => f.localPort);

    let port = startPort;
    while (usedPorts.includes(port)) {
      port++;
    }

    return port;
  }

  /**
   * Create a localhost URL for a forwarded service
   */
  getLocalUrl(serviceName: string, namespace: string, path: string = ''): string | null {
    const forwardInfo = this.getPortForward(serviceName, namespace);
    if (!forwardInfo || !forwardInfo.isActive) {
      return null;
    }

    const basePath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:${forwardInfo.localPort}${basePath}`;
  }

  /**
   * Auto-detect and suggest port forward for a service endpoint
   */
  async suggestPortForward(serviceEndpoint: string): Promise<{
    serviceName: string;
    namespace: string;
    port: number;
    localUrl: string;
  } | null> {
    // Parse service endpoint like "10.244.0.7:8080"
    const match = serviceEndpoint.match(/^(\d+\.\d+\.\d+\.\d+):(\d+)$/);
    if (!match) {
      return null;
    }

    const [, ip, port] = match;
    const servicePort = parseInt(port);

    try {
      // Try to find the service that matches this endpoint
      const result = await this.ddClient.extension.host?.cli.exec('kubectl', [
        'get', 'services', '--all-namespaces', '-o', 'json'
      ]);

      if (result?.stdout) {
        const services = JSON.parse(result.stdout);

        // Look for a service that might match this endpoint
        for (const service of services.items) {
          const serviceName = service.metadata.name;
          const namespace = service.metadata.namespace;

          // Check if this service has a port that matches
          if (service.spec.ports) {
            for (const portSpec of service.spec.ports) {
              if (portSpec.port === servicePort || portSpec.targetPort === servicePort) {
                // Found a potential match
                const localPort = await this.findAvailablePort();
                return {
                  serviceName,
                  namespace,
                  port: servicePort,
                  localUrl: `http://localhost:${localPort}`
                };
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to suggest port forward:', error);
    }

    return null;
  }
}
