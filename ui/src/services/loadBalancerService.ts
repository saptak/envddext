import { v1 } from "@docker/extension-api-client-types";

export interface LoadBalancerStatus {
  isConfigured: boolean;
  provider?: 'metallb' | 'cloud' | 'unknown';
  version?: string;
  ipPools?: Array<{
    name: string;
    addresses: string[];
  }>;
  error?: string;
}

export interface LoadBalancerConfiguration {
  provider: 'metallb';
  ipRange: string;
  autoDetectRange: boolean;
}

/**
 * Service for managing LoadBalancer configuration in Kubernetes clusters
 */
export class LoadBalancerService {
  private ddClient: v1.DockerDesktopClient;

  constructor(ddClient: v1.DockerDesktopClient) {
    this.ddClient = ddClient;
  }

  /**
   * Check if a LoadBalancer controller is configured and working
   */
  async checkLoadBalancerStatus(): Promise<LoadBalancerStatus> {
    try {
      console.log('LoadBalancerService: ===== STARTING LOADBALANCER DETECTION =====');

      // SIMPLIFIED APPROACH: Quickly check if MetalLB namespace exists first
      console.log('LoadBalancerService: Quick check for MetalLB namespace...');
      const quickMetalLBCheck = await this.quickCheckMetalLBNamespace();
      
      if (quickMetalLBCheck) {
        console.log('LoadBalancerService: MetalLB namespace found - now checking services...');
        
        // If MetalLB exists, check if services are working
        const servicesStatus = await this.checkLoadBalancerServices();
        console.log('LoadBalancerService: Services check result:', servicesStatus);
        
        if (servicesStatus.isConfigured) {
          console.log('LoadBalancerService: MetalLB is working with services having external IPs!');
          return {
            isConfigured: true,
            provider: 'metallb'
          };
        } else {
          console.log('LoadBalancerService: MetalLB namespace exists - checking detailed status');
          // If namespace exists but services check failed, try detailed MetalLB check
          const metallbStatus = await this.checkMetalLBStatus();
          if (metallbStatus.provider === 'metallb') {
            return metallbStatus; // Return MetalLB status (could be configured or have errors)
          }
        }
      }

      // If no MetalLB, check for working LoadBalancer services anyway
      console.log('LoadBalancerService: No MetalLB found, checking for any working LoadBalancer services...');
      const servicesStatus = await this.checkLoadBalancerServices();
      console.log('LoadBalancerService: Services check result:', servicesStatus);
      
      if (servicesStatus.isConfigured) {
        console.log('LoadBalancerService: Found working LoadBalancer services (cloud provider?)');
        return {
          isConfigured: true,
          provider: 'unknown'
        };
      }

      console.log('LoadBalancerService: No LoadBalancer controller found');
      return {
        isConfigured: false
      };

    } catch (error: any) {
      console.error('LoadBalancerService: Error checking LoadBalancer status:', error);
      return {
        isConfigured: false,
        error: typeof error === 'string' ? error : error.message || 'Unknown error'
      };
    }
  }

  /**
   * Quick check if MetalLB namespace exists
   */
  private async quickCheckMetalLBNamespace(): Promise<boolean> {
    try {
      if (!this.ddClient?.extension?.vm?.service) {
        return false;
      }

      // Simple namespace check
      const response = await this.ddClient.extension.vm.service.post('/kubectl', {
        args: ['get', 'ns', 'metallb-system', '--ignore-not-found']
      }) as any;

      return response?.success && response.data && response.data.includes('metallb-system');
    } catch (error) {
      console.error('Quick MetalLB namespace check failed:', error);
      return false;
    }
  }

  /**
   * Check MetalLB installation and configuration
   */
  private async checkMetalLBStatus(): Promise<LoadBalancerStatus> {
    try {
      console.log('LoadBalancerService: Checking MetalLB namespace...');
      
      // Check if the extension service is available
      if (!this.ddClient?.extension?.vm?.service) {
        console.error('LoadBalancerService: Extension VM service not available for MetalLB check');
        return { isConfigured: false, error: 'Extension service not available' };
      }

      // Check if MetalLB namespace exists
      const response = await this.ddClient.extension.vm.service.post('/kubectl', {
        args: ['get', 'namespace', 'metallb-system', '--ignore-not-found', '-o', 'json']
      }) as any;

      console.log('LoadBalancerService: MetalLB namespace check response:', response);

      if (!response?.success) {
        console.log('LoadBalancerService: MetalLB namespace check failed:', response?.error);
        return { isConfigured: false, error: response?.error || 'Namespace check failed' };
      }

      // Handle empty response data
      if (!response.data || response.data.trim() === '') {
        return { isConfigured: false };
      }

      let namespaceData;
      try {
        namespaceData = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse namespace response:', response.data);
        return { isConfigured: false };
      }

      if (!namespaceData || !namespaceData.metadata) {
        return { isConfigured: false };
      }

      console.log('LoadBalancerService: MetalLB namespace found, provider identified as metallb');

      // If namespace exists, MetalLB is at least partially installed
      console.log('MetalLB namespace found, checking controller deployment...');

      // Check if MetalLB controller is running
      const deploymentResponse = await this.ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['get', 'deployment', '-n', 'metallb-system', 'controller', '--ignore-not-found', '-o', 'json']
      }) as any;

      if (!deploymentResponse?.success) {
        // Namespace exists but controller deployment missing - still identify provider
        return {
          isConfigured: false,
          provider: 'metallb',
          error: 'MetalLB namespace exists but controller deployment not found'
        };
      }

      // Handle empty deployment response
      if (!deploymentResponse.data || deploymentResponse.data.trim() === '') {
        return {
          isConfigured: false,
          provider: 'metallb', 
          error: 'MetalLB namespace exists but controller deployment not found'
        };
      }

      let deploymentData;
      try {
        deploymentData = JSON.parse(deploymentResponse.data);
      } catch (e) {
        console.warn('Failed to parse deployment response:', deploymentResponse.data);
        return {
          isConfigured: false,
          provider: 'metallb',
          error: 'MetalLB namespace exists but controller deployment data is invalid'
        };
      }

      if (!deploymentData || !deploymentData.metadata) {
        // Same case - namespace exists but no controller
        return {
          isConfigured: false,
          provider: 'metallb', 
          error: 'MetalLB namespace exists but controller deployment not found'
        };
      }

      // Check if deployment has any ready replicas
      const readyReplicas = deploymentData.status?.readyReplicas || 0;
      const desiredReplicas = deploymentData.spec?.replicas || 0;

      // If readyReplicas is 0, check if there are any running pods before declaring failure
      if (readyReplicas === 0) {
        console.log('MetalLB deployment shows 0 ready replicas, checking individual pods...');
        
        // Check if any controller pods are actually running
        const podsResponse = await this.ddClient.extension.vm?.service?.post('/kubectl', {
          args: ['get', 'pods', '-n', 'metallb-system', '-l', 'app=metallb,component=controller', '-o', 'json']
        }) as any;

        if (podsResponse?.success && podsResponse.data) {
          try {
            const podsData = JSON.parse(podsResponse.data);
            const runningPods = (podsData.items || []).filter((pod: any) => {
              if (pod.status?.phase !== 'Running') {
                return false;
              }
              
              // Check if pod is ready
              const readyCondition = pod.status?.conditions?.find((cond: any) => cond.type === 'Ready');
              if (readyCondition?.status === 'True') {
                return true;
              }
              
              // If not ready, check if containers are ready (sometimes pod ready lags behind)
              const containersReadyCondition = pod.status?.conditions?.find((cond: any) => cond.type === 'ContainersReady');
              if (containersReadyCondition?.status === 'True') {
                console.log('MetalLB pod has ready containers but pod not marked ready yet');
                return true;
              }
              
              return false;
            });

            if (runningPods.length > 0) {
              console.log(`Found ${runningPods.length} running MetalLB controller pods`);
              // Pods are running even if deployment shows 0 ready replicas
              // This can happen during deployment rollouts or other edge cases
            } else {
              // No running pods - MetalLB is truly not working
              return {
                isConfigured: false,
                provider: 'metallb',
                error: `MetalLB controller not ready: ${readyReplicas}/${desiredReplicas} replicas running`
              };
            }
          } catch (e) {
            console.warn('Failed to parse pods response:', e);
          }
        }
      }

      // If some replicas are ready but not all, MetalLB is functional but may have issues
      const hasPartialReadiness = readyReplicas < desiredReplicas;
      const statusMessage = hasPartialReadiness 
        ? `MetalLB partially ready: ${readyReplicas}/${desiredReplicas} replicas running`
        : undefined;

      // Check IP address pools
      const poolResponse = await this.ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['get', 'ipaddresspools.metallb.io', '-n', 'metallb-system', '-o', 'json']
      }) as any;

      let ipPools: Array<{ name: string; addresses: string[] }> = [];
      if (poolResponse?.success && poolResponse.data) {
        try {
          const poolData = JSON.parse(poolResponse.data);
          ipPools = (poolData.items || []).map((pool: any) => ({
            name: pool.metadata.name,
            addresses: pool.spec.addresses || []
          }));
        } catch (e) {
          console.warn('Failed to parse IP address pools:', e);
        }
      }

      return {
        isConfigured: true,
        provider: 'metallb',
        version: deploymentData.metadata.labels?.['app.kubernetes.io/version'] || 'unknown',
        ipPools,
        error: statusMessage
      };

    } catch (error: any) {
      console.error('Error checking MetalLB status:', error);
      return { isConfigured: false };
    }
  }

  /**
   * Check if cloud LoadBalancer is available (AWS, GCP, Azure, etc.)
   */
  private async checkCloudLoadBalancer(): Promise<LoadBalancerStatus> {
    try {
      // Check if we're running in a cloud environment by looking at node labels
      const response = await this.ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['get', 'nodes', '-o', 'json']
      }) as any;

      if (!response?.success || !response.data) {
        return { isConfigured: false };
      }

      const nodesData = JSON.parse(response.data);
      const nodes = nodesData.items || [];

      for (const node of nodes) {
        const labels = node.metadata?.labels || {};
        
        // Check for cloud provider labels
        if (labels['node.kubernetes.io/instance-type'] ||
            labels['topology.kubernetes.io/zone'] ||
            labels['kubernetes.io/cloud-provider'] ||
            labels['node.kubernetes.io/cloud-provider']) {
          
          return {
            isConfigured: true,
            provider: 'cloud',
            version: 'cloud-provider'
          };
        }
      }

      return { isConfigured: false };

    } catch (error: any) {
      console.error('Error checking cloud LoadBalancer:', error);
      return { isConfigured: false };
    }
  }

  /**
   * Check if any LoadBalancer services have external IPs assigned
   */
  private async checkLoadBalancerServices(): Promise<LoadBalancerStatus> {
    try {
      console.log('LoadBalancerService: Checking LoadBalancer services via backend...');
      
      // Check if the extension service is available
      if (!this.ddClient?.extension?.vm?.service) {
        console.error('LoadBalancerService: Extension VM service not available for LoadBalancer services check');
        return { isConfigured: false, error: 'Extension service not available' };
      }

      // Get all LoadBalancer services via backend
      const response = await this.ddClient.extension.vm.service.post('/kubectl', {
        args: ['get', 'svc', '-A', '-o', 'json', '--field-selector=spec.type=LoadBalancer']
      }) as any;

      console.log('LoadBalancerService: LoadBalancer services check response:', response);

      if (!response?.success) {
        console.log('LoadBalancerService: LoadBalancer services check failed:', response?.error);
        return { isConfigured: false, error: response?.error || 'Services check failed' };
      }

      // Handle empty response data
      if (!response.data || response.data.trim() === '') {
        console.log('LoadBalancerService: No LoadBalancer services found');
        return { isConfigured: false };
      }

      let servicesData;
      try {
        servicesData = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse services response:', response.data);
        return { isConfigured: false };
      }

      const services = servicesData.items || [];
      console.log(`LoadBalancerService: Found ${services.length} LoadBalancer services via backend`);

      // Check if any LoadBalancer service has an external IP
      const servicesWithIPs = services.filter((svc: any) => {
        const loadBalancer = svc.status?.loadBalancer;
        const ingress = loadBalancer?.ingress || [];
        const hasIP = ingress.length > 0 && (ingress[0].ip || ingress[0].hostname);
        console.log(`LoadBalancerService: Service ${svc.metadata?.name}: ingress=${JSON.stringify(ingress)}, hasIP=${hasIP}`);
        return hasIP;
      });

      console.log(`LoadBalancerService: Found ${servicesWithIPs.length} services with external IPs`);

      if (servicesWithIPs.length > 0) {
        console.log('LoadBalancerService: LoadBalancer is working! Returning configured status');
        return {
          isConfigured: true,
          provider: 'unknown'
        };
      }

      console.log('LoadBalancerService: No LoadBalancer services with external IPs found');
      return { isConfigured: false };

    } catch (error: any) {
      console.error('Error checking LoadBalancer services:', error);
      return { isConfigured: false };
    }
  }

  /**
   * Configure MetalLB LoadBalancer for Docker Desktop
   */
  async configureMetalLB(config: LoadBalancerConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Configuring MetalLB LoadBalancer...');

      // Step 0: Check if MetalLB is already installed
      const currentStatus = await this.checkMetalLBStatus();
      const isAlreadyInstalled = currentStatus.isConfigured || 
                                (currentStatus.provider === 'metallb' && currentStatus.error);

      // Step 1: Install MetalLB (only if not already installed)
      if (!isAlreadyInstalled) {
        console.log('Installing MetalLB...');
        const installResponse = await this.ddClient.extension.vm?.service?.post('/kubectl', {
          args: ['apply', '-f', 'https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml']
        }) as any;

        // MetalLB installation can return success=false even when resources already exist
        // Check if the failure is due to resources already existing
        if (!installResponse?.success) {
          const output = installResponse?.data || '';
          const error = installResponse?.error || '';
          
          // Check if this is actually successful (resources created, updated, or already exist)
          const isSuccessfulOperation = output.includes('unchanged') || 
                                      output.includes('configured') || 
                                      output.includes('created') ||
                                      output.includes('applied');
          
          if (!isSuccessfulOperation) {
            return {
              success: false,
              error: `Failed to install MetalLB: ${error || output || 'Unknown error'}`
            };
          }
          console.log('MetalLB installation completed (resources exist or were updated):', output);
        }
      } else {
        console.log('MetalLB is already installed, skipping installation step');
      }

      // Step 2: Wait for MetalLB to be ready
      console.log('Waiting for MetalLB to be ready...');
      const waitResponse = await this.ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['wait', '--namespace', 'metallb-system', '--for=condition=ready', 'pod', '--selector=app=metallb', '--timeout=90s']
      }) as any;

      if (!waitResponse?.success) {
        console.warn('MetalLB pods may not be ready yet, continuing with configuration...');
      }

      // Step 3: Determine IP range
      let ipRange = config.ipRange;
      if (config.autoDetectRange) {
        const detectedRange = await this.detectDockerNetworkRange();
        if (detectedRange) {
          ipRange = detectedRange;
        }
      }

      if (!ipRange) {
        return {
          success: false,
          error: 'Unable to determine IP range for LoadBalancer'
        };
      }

      // Step 4: Create IP address pool
      console.log(`Creating IP address pool with range: ${ipRange}`);
      const poolYaml = `apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: docker-desktop-pool
  namespace: metallb-system
spec:
  addresses:
  - ${ipRange}`;

      const poolResponse = await this.ddClient.extension.vm?.service?.post('/apply-yaml', {
        yaml: poolYaml
      }) as any;

      if (!poolResponse?.success) {
        // Check if pool creation was actually successful
        const output = poolResponse?.data || '';
        const error = poolResponse?.error || '';
        
        const isSuccessfulOperation = output.includes('unchanged') || 
                                    output.includes('configured') || 
                                    output.includes('created') ||
                                    output.includes('applied') ||
                                    error.includes('already exists');
        
        if (!isSuccessfulOperation) {
          return {
            success: false,
            error: `Failed to create IP address pool: ${error || output || 'Unknown error'}`
          };
        }
        console.log('IP address pool operation completed:', output || error);
      }

      // Step 5: Create L2 advertisement
      console.log('Creating L2 advertisement...');
      const l2Yaml = `apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: docker-desktop-l2
  namespace: metallb-system
spec:
  ipAddressPools:
  - docker-desktop-pool`;

      const l2Response = await this.ddClient.extension.vm?.service?.post('/apply-yaml', {
        yaml: l2Yaml
      }) as any;

      if (!l2Response?.success) {
        // Check if L2 advertisement creation was actually successful
        const output = l2Response?.data || '';
        const error = l2Response?.error || '';
        
        const isSuccessfulOperation = output.includes('unchanged') || 
                                    output.includes('configured') || 
                                    output.includes('created') ||
                                    output.includes('applied') ||
                                    error.includes('already exists');
        
        if (!isSuccessfulOperation) {
          return {
            success: false,
            error: `Failed to create L2 advertisement: ${error || output || 'Unknown error'}`
          };
        }
        console.log('L2 advertisement operation completed:', output || error);
      }

      console.log('MetalLB LoadBalancer configured successfully!');
      return { success: true };

    } catch (error: any) {
      console.error('Error configuring MetalLB:', error);
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Unknown error'
      };
    }
  }

  /**
   * Auto-detect Docker Desktop network range for MetalLB
   */
  private async detectDockerNetworkRange(): Promise<string | null> {
    try {
      // Get node internal IP to determine network range
      const response = await this.ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['get', 'nodes', '-o', 'jsonpath={.items[0].status.addresses[?(@.type=="InternalIP")].address}']
      }) as any;

      if (!response?.success || !response.data) {
        return null;
      }

      const nodeIP = response.data.trim();
      if (!nodeIP) {
        return null;
      }

      // For Docker Desktop, typically uses 172.18.x.x range
      if (nodeIP.startsWith('172.18.')) {
        return '172.18.200.1-172.18.200.100';
      } else if (nodeIP.startsWith('172.')) {
        // Extract network and use .200.x range
        const parts = nodeIP.split('.');
        return `172.${parts[1]}.200.1-172.${parts[1]}.200.100`;
      } else if (nodeIP.startsWith('10.')) {
        // For 10.x networks
        const parts = nodeIP.split('.');
        return `10.${parts[1]}.200.1-10.${parts[1]}.200.100`;
      } else if (nodeIP.startsWith('192.168.')) {
        // For 192.168 networks
        const parts = nodeIP.split('.');
        return `192.168.${parts[2]}.200-192.168.${parts[2]}.250`;
      }

      return null;

    } catch (error: any) {
      console.error('Error detecting Docker network range:', error);
      return null;
    }
  }

  /**
   * Remove MetalLB configuration
   */
  async removeMetalLB(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Removing MetalLB LoadBalancer...');

      // Remove MetalLB installation
      const removeResponse = await this.ddClient.extension.vm?.service?.post('/kubectl', {
        args: ['delete', '-f', 'https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml']
      }) as any;

      if (!removeResponse?.success) {
        return {
          success: false,
          error: `Failed to remove MetalLB: ${removeResponse?.error || 'Unknown error'}`
        };
      }

      console.log('MetalLB LoadBalancer removed successfully!');
      return { success: true };

    } catch (error: any) {
      console.error('Error removing MetalLB:', error);
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Unknown error'
      };
    }
  }
}