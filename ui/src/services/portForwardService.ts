import { createDockerDesktopClient } from '@docker/extension-api-client';

const ddClient = createDockerDesktopClient();

export interface PortForwardRequest {
  serviceName: string;
  namespace: string;
  servicePort: number;
  localPort: number;
  resourceType?: string; // "service", "pod", "deployment"
}

export interface PortForwardStatus {
  isRunning: boolean;
  serviceName: string;
  namespace: string;
  servicePort: number;
  localPort: number;
  resourceType: string;
  pid?: string;
  url?: string;
}

export class PortForwardService {
  /**
   * Start port forwarding for a service
   */
  async startPortForward(request: PortForwardRequest): Promise<PortForwardStatus> {
    try {
      console.log(`Starting port forward: ${request.namespace}/${request.serviceName}:${request.servicePort} -> localhost:${request.localPort}`);
      
      const response = await ddClient.extension.vm?.service?.post('/start-port-forward', {
        serviceName: request.serviceName,
        namespace: request.namespace,
        servicePort: request.servicePort,
        localPort: request.localPort,
        resourceType: request.resourceType || 'service'
      }) as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to start port forward');
      }

      console.log('Port forward started successfully:', response.data);
      return response.data as PortForwardStatus;

    } catch (error) {
      console.error('Failed to start port forward:', error);
      throw new Error(`Failed to start port forward: ${error}`);
    }
  }

  /**
   * Stop port forwarding for a service
   */
  async stopPortForward(
    serviceName: string, 
    namespace: string, 
    servicePort: number, 
    localPort: number
  ): Promise<void> {
    try {
      console.log(`Stopping port forward: ${namespace}/${serviceName}:${servicePort} -> localhost:${localPort}`);
      
      const response = await ddClient.extension.vm?.service?.post('/stop-port-forward', {
        serviceName,
        namespace,
        servicePort,
        localPort
      }) as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to stop port forward');
      }

      console.log('Port forward stopped successfully');

    } catch (error) {
      console.error('Failed to stop port forward:', error);
      throw new Error(`Failed to stop port forward: ${error}`);
    }
  }

  /**
   * Get port forward status for a specific service
   */
  async getPortForwardStatus(
    serviceName: string,
    namespace: string,
    servicePort: number,
    localPort: number
  ): Promise<PortForwardStatus> {
    try {
      const params = new URLSearchParams({
        serviceName,
        namespace,
        servicePort: servicePort.toString(),
        localPort: localPort.toString()
      });

      const response = await ddClient.extension.vm?.service?.get(`/port-forward-status?${params}`) as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get port forward status');
      }

      return response.data as PortForwardStatus;

    } catch (error) {
      console.error('Failed to get port forward status:', error);
      throw new Error(`Failed to get port forward status: ${error}`);
    }
  }

  /**
   * List all active port forwards
   */
  async listPortForwards(): Promise<PortForwardStatus[]> {
    try {
      const response = await ddClient.extension.vm?.service?.get('/list-port-forwards') as any;

      if (!response.success) {
        throw new Error(response.error || 'Failed to list port forwards');
      }

      return response.data as PortForwardStatus[];

    } catch (error) {
      console.error('Failed to list port forwards:', error);
      throw new Error(`Failed to list port forwards: ${error}`);
    }
  }

  /**
   * Find an available local port
   */
  async findAvailablePort(startPort: number = 8080): Promise<number> {
    try {
      const activeForwards = await this.listPortForwards();
      const usedPorts = activeForwards
        .filter(pf => pf.isRunning)
        .map(pf => pf.localPort);

      let port = startPort;
      while (usedPorts.includes(port)) {
        port++;
      }

      return port;
    } catch (error) {
      console.error('Failed to find available port:', error);
      // Fallback to simple increment
      return startPort;
    }
  }

  /**
   * Create a localhost URL for a forwarded service
   */
  async getLocalUrl(serviceName: string, namespace: string, servicePort: number, localPort: number, path: string = ''): Promise<string | null> {
    try {
      const status = await this.getPortForwardStatus(serviceName, namespace, servicePort, localPort);
      
      if (!status.isRunning) {
        return null;
      }

      const basePath = path.startsWith('/') ? path : `/${path}`;
      return `http://localhost:${status.localPort}${basePath}`;
    } catch (error) {
      console.error('Failed to get local URL:', error);
      return null;
    }
  }

  /**
   * Suggest port forward for a gateway service
   */
  async suggestGatewayPortForward(gatewayName: string, namespace: string = 'envoy-gateway-system'): Promise<{
    serviceName: string;
    namespace: string;
    servicePort: number;
    localPort: number;
    url: string;
  } | null> {
    try {
      // Find available local port
      const localPort = await this.findAvailablePort(8080);
      
      // Common gateway service configurations
      const gatewayConfigs = [
        { serviceName: 'envoy-gateway-lb', servicePort: 80 },
        { serviceName: `${gatewayName}-lb`, servicePort: 80 },
        { serviceName: gatewayName, servicePort: 80 },
        { serviceName: 'envoy-gateway', servicePort: 8080 }
      ];

      // Try each configuration
      for (const config of gatewayConfigs) {
        try {
          const status = await this.getPortForwardStatus(
            config.serviceName,
            namespace,
            config.servicePort,
            localPort
          );

          return {
            serviceName: config.serviceName,
            namespace,
            servicePort: config.servicePort,
            localPort,
            url: `http://localhost:${localPort}`
          };
        } catch (error) {
          // Continue to next configuration
          continue;
        }
      }

      // Default suggestion
      return {
        serviceName: 'envoy-gateway-lb',
        namespace,
        servicePort: 80,
        localPort,
        url: `http://localhost:${localPort}`
      };

    } catch (error) {
      console.error('Failed to suggest gateway port forward:', error);
      return null;
    }
  }

  /**
   * Get port forward configuration for common demo services
   */
  getDemoServiceConfig(serviceName: string, namespace: string = 'demo'): PortForwardRequest {
    const commonConfigs: Record<string, Partial<PortForwardRequest>> = {
      'echo-service': { servicePort: 80 },
      'echo-service-v1': { servicePort: 80 },
      'echo-service-v2': { servicePort: 80 },
      'envoy-gateway-lb': { servicePort: 80, namespace: 'envoy-gateway-system' }
    };

    const config = commonConfigs[serviceName] || { servicePort: 80 };
    
    return {
      serviceName,
      namespace: config.namespace || namespace,
      servicePort: config.servicePort || 80,
      localPort: 8080, // Default, will be updated to available port
      resourceType: 'service'
    };
  }

  /**
   * Quick start port forward for gateway testing
   */
  async quickStartGatewayForward(gatewayName?: string): Promise<PortForwardStatus> {
    const localPort = await this.findAvailablePort(8080);
    
    const request: PortForwardRequest = {
      serviceName: 'envoy-gateway-lb',
      namespace: 'envoy-gateway-system',
      servicePort: 80,
      localPort,
      resourceType: 'service'
    };

    return await this.startPortForward(request);
  }
}

// Create singleton instance
export const portForwardService = new PortForwardService();