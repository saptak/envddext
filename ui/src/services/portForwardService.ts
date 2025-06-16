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

      // Handle nested response structure from Docker Desktop VM service
      const actualResponse = response?.data || response;
      
      if (!actualResponse || !actualResponse.success) {
        const backendError = actualResponse?.error || 'Backend returned no error message';
        throw new Error(`Backend error: ${backendError}`);
      }

      console.log('Port forward started successfully:', actualResponse.data);
      return actualResponse.data as PortForwardStatus;

    } catch (error) {
      console.error('Failed to start port forward:', error);
      throw error; // Re-throw the original error
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

      // Handle nested response structure from Docker Desktop VM service
      const actualResponse = response?.data || response;

      if (!actualResponse.success) {
        throw new Error(actualResponse.error || 'Failed to get port forward status');
      }

      return actualResponse.data as PortForwardStatus;

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

      // Handle nested response structure from Docker Desktop VM service
      const actualResponse = response?.data || response;
      
      if (!actualResponse.success) {
        throw new Error(actualResponse.error || 'Failed to list port forwards');
      }

      return actualResponse.data as PortForwardStatus[];

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
   * List available services in a namespace
   */
  async listServices(namespace: string = 'default', serviceType?: string): Promise<{name: string, type: string, ports: number[]}[]> {
    try {
      const args = ['get', 'services', '-n', namespace, '-o', 'json'];
      if (serviceType) {
        args.push(`--field-selector=spec.type=${serviceType}`);
      }
      
      const response = await ddClient.extension.vm?.service?.post('/kubectl', {
        args
      }) as any;
      
      const actualResponse = response?.data || response;
      const outputData = actualResponse?.data?.output || actualResponse?.output;
      
      if (actualResponse?.success && outputData) {
        const services = JSON.parse(outputData);
        if (services.items) {
          return services.items.map((service: any) => ({
            name: service.metadata.name,
            type: service.spec.type || 'ClusterIP',
            ports: service.spec.ports?.map((port: any) => port.port) || []
          }));
        }
      }
      
      return [];
    } catch (error) {
      console.error('Failed to list services:', error);
      return [];
    }
  }

  /**
   * Quick start port forward for gateway testing
   */
  async quickStartGatewayForward(gatewayName?: string): Promise<PortForwardStatus> {
    const localPort = await this.findAvailablePort(8080);
    
    // Find the actual gateway LoadBalancer service dynamically
    let serviceName: string | null = null;
    let debugInfo = '';
    
    try {
      // Discover LoadBalancer services in envoy-gateway-system namespace
      const response = await ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['get', 'services', '-n', 'envoy-gateway-system', '--field-selector=spec.type=LoadBalancer', '-o', 'json']
      }) as any;
      
      const actualResponse = response?.data || response;
      debugInfo += `Service discovery response: ${actualResponse?.success ? 'success' : 'failed'}\n`;
      
      // Handle nested response structure - data might be wrapped in another data object
      const outputData = actualResponse?.data?.output || actualResponse?.output;
      
      if (actualResponse?.success && outputData) {
        try {
          const services = JSON.parse(outputData);
          debugInfo += `Parsed services: found ${services.items?.length || 0} items\n`;
          if (services.items && services.items.length > 0) {
            // Use the first LoadBalancer service found
            const gatewayService = services.items[0];
            serviceName = gatewayService.metadata.name;
            debugInfo += `Found LoadBalancer service: ${serviceName}\n`;
            console.log('Auto-discovered gateway service:', serviceName);
          } else {
            debugInfo += `No LoadBalancer services found in envoy-gateway-system\n`;
          }
        } catch (parseError) {
          debugInfo += `JSON parse error: ${parseError}\n`;
          debugInfo += `Raw output: ${outputData}\n`;
        }
      } else {
        debugInfo += `kubectl error: ${actualResponse?.error || 'Unknown error'}\n`;
        debugInfo += `actualResponse.success: ${actualResponse?.success}\n`;
        debugInfo += `actualResponse.output exists: ${!!actualResponse?.output}\n`;
      }
    } catch (error) {
      debugInfo += `Service discovery failed: ${error}\n`;
      console.warn('Service discovery failed:', error);
    }
    
    // If no service found, throw an error instead of falling back to hardcoded values
    if (!serviceName) {
      throw new Error(`No LoadBalancer services found in envoy-gateway-system namespace.\n\nPlease ensure you have:\n1. Deployed a Gateway resource\n2. The Gateway has a LoadBalancer service\n3. The service is in envoy-gateway-system namespace\n\nDebug info:\n${debugInfo}`);
    }
    
    const request: PortForwardRequest = {
      serviceName,
      namespace: 'envoy-gateway-system',
      servicePort: 80,
      localPort,
      resourceType: 'service'
    };

    debugInfo += `Port forward request: ${JSON.stringify(request, null, 2)}\n`;
    console.log('Starting port forward with request:', request);
    
    try {
      return await this.startPortForward(request);
    } catch (error) {
      // Show the actual error first, then minimal debug info
      const shortError = new Error(`${error}\n\nUsing service: ${serviceName}`);
      throw shortError;
    }
  }
}

// Create singleton instance
export const portForwardService = new PortForwardService();