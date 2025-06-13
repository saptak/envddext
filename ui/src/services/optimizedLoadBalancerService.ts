import { v1 } from "@docker/extension-api-client-types";
import { ApiCallManager } from "../utils/performanceUtils";

export interface LoadBalancerStatus {
  isConfigured: boolean;
  provider?: "metallb" | "cloud" | "unknown";
  version?: string;
  ipPools?: Array<{
    name: string;
    addresses: string[];
  }>;
  servicesWithIPs?: Array<{
    name: string;
    namespace: string;
    externalIP: string;
    ports: string;
  }>;
  error?: string;
}

export interface LoadBalancerConfiguration {
  provider: "metallb";
  ipRange: string;
  autoDetectRange: boolean;
}

/**
 * Optimized LoadBalancer Service with caching, batching, and performance improvements
 */
export class OptimizedLoadBalancerService {
  private ddClient: v1.DockerDesktopClient;
  private apiManager: ApiCallManager;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 15000; // 15 seconds cache

  constructor(ddClient: v1.DockerDesktopClient) {
    this.ddClient = ddClient;
    this.apiManager = ApiCallManager.getInstance();
  }

  /**
   * Optimized status check with caching and parallel operations
   */
  async checkLoadBalancerStatus(): Promise<LoadBalancerStatus> {
    const cacheKey = 'loadbalancer-status';
    
    return this.apiManager.call(cacheKey, async () => {
      console.log("OptimizedLoadBalancerService: Starting status check");

      try {
        // Run checks in parallel for better performance
        const [
          metallbNamespaceExists,
          servicesWithIPs,
          cloudLoadBalancer
        ] = await Promise.all([
          this.quickCheckMetalLBNamespace(),
          this.checkLoadBalancerServices(),
          this.checkCloudLoadBalancer()
        ]);

        if (metallbNamespaceExists) {
          const metallbStatus = await this.checkMetalLBStatus();
          return {
            isConfigured: metallbStatus.isConfigured,
            provider: "metallb",
            version: metallbStatus.version,
            ipPools: metallbStatus.ipPools,
            servicesWithIPs,
            error: metallbStatus.error
          };
        }

        if (cloudLoadBalancer.isConfigured) {
          return {
            isConfigured: true,
            provider: "cloud",
            servicesWithIPs,
            error: cloudLoadBalancer.error
          };
        }

        return {
          isConfigured: false,
          provider: "unknown",
          servicesWithIPs,
          error: "No LoadBalancer provider detected"
        };

      } catch (error) {
        console.error("OptimizedLoadBalancerService: Error checking status:", error);
        return {
          isConfigured: false,
          error: `LoadBalancer status check failed: ${error}`
        };
      }
    });
  }

  /**
   * Cached MetalLB namespace check
   */
  private async quickCheckMetalLBNamespace(): Promise<boolean> {
    return this.apiManager.call('metallb-namespace', async () => {
      try {
        const result = await this.ddClient.extension.host?.cli.exec("kubectl", [
          "get", "namespace", "metallb-system", "--ignore-not-found", "-o", "name"
        ]);
        if (!result) {
          throw new Error("CLI execution failed");
        }
        return result.stdout.trim() !== "";
      } catch (error) {
        console.error("Error checking MetalLB namespace:", error);
        return false;
      }
    });
  }

  /**
   * Optimized MetalLB status check with batched operations
   */
  private async checkMetalLBStatus(): Promise<{
    isConfigured: boolean;
    version?: string;
    ipPools?: Array<{ name: string; addresses: string[] }>;
    error?: string;
  }> {
    return this.apiManager.call('metallb-status', async () => {
      try {
        // Batch multiple kubectl calls for efficiency
        const [deploymentResult, ipPoolResult] = await Promise.all([
          this.ddClient.extension.host?.cli.exec("kubectl", [
            "get", "deployment", "controller", "-n", "metallb-system",
            "-o", "jsonpath={.status.readyReplicas}/{.status.replicas}"
          ]).catch(() => ({ stdout: "0/0" })),
          
          this.ddClient.extension.host?.cli.exec("kubectl", [
            "get", "ipaddresspool", "-n", "metallb-system", "-o", "json"
          ]).catch(() => ({ stdout: '{"items":[]}' }))
        ]);

        const [readyReplicas, totalReplicas] = (deploymentResult?.stdout || "0/0").trim().split('/').map(Number);
        const isControllerReady = readyReplicas > 0 && readyReplicas === totalReplicas;

        const ipPoolData = JSON.parse(ipPoolResult?.stdout || '{"items":[]}');
        const ipPools = ipPoolData.items?.map((pool: any) => ({
          name: pool.metadata?.name || "unknown",
          addresses: pool.spec?.addresses || []
        })) || [];

        const hasActivePools = ipPools.length > 0;
        const isConfigured = isControllerReady && hasActivePools;

        return {
          isConfigured,
          ipPools,
          error: !isControllerReady ? "MetalLB controller not ready" : 
                 !hasActivePools ? "No IP address pools configured" : undefined
        };

      } catch (error) {
        console.error("Error checking MetalLB status:", error);
        return {
          isConfigured: false,
          error: `MetalLB status check failed: ${error}`
        };
      }
    });
  }

  /**
   * Optimized services check with LoadBalancer type filtering
   */
  private async checkLoadBalancerServices(): Promise<Array<{
    name: string;
    namespace: string;
    externalIP: string;
    ports: string;
  }>> {
    return this.apiManager.call('lb-services', async () => {
      try {
        const result = await this.ddClient.extension.host?.cli.exec("kubectl", [
          "get", "services", "--all-namespaces",
          "--field-selector", "spec.type=LoadBalancer",
          "-o", "json"
        ]);

        const servicesData = JSON.parse(result?.stdout || '{"items":[]}');
        return servicesData.items
          ?.filter((svc: any) => {
            const ingress = svc.status?.loadBalancer?.ingress;
            return ingress && ingress.length > 0 && (ingress[0].ip || ingress[0].hostname);
          })
          .map((svc: any) => {
            const ingress = svc.status.loadBalancer.ingress[0];
            const externalIP = ingress.ip || ingress.hostname || "unknown";
            const ports = svc.spec.ports?.map((p: any) => `${p.port}/${p.protocol}`).join(", ") || "unknown";
            
            return {
              name: svc.metadata.name,
              namespace: svc.metadata.namespace,
              externalIP,
              ports
            };
          }) || [];

      } catch (error) {
        console.error("Error checking LoadBalancer services:", error);
        return [];
      }
    });
  }

  /**
   * Cloud LoadBalancer detection (optimized)
   */
  private async checkCloudLoadBalancer(): Promise<{ isConfigured: boolean; error?: string }> {
    return this.apiManager.call('cloud-lb', async () => {
      try {
        // Quick check for cloud provider indicators
        const nodeResult = await this.ddClient.extension.host?.cli.exec("kubectl", [
          "get", "nodes", "-o", "jsonpath={.items[0].spec.providerID}"
        ]);

        const providerID = nodeResult?.stdout?.trim() || "";
        const hasCloudProvider = Boolean(providerID && !providerID.includes("docker-desktop") && !providerID.includes("kind"));

        return { isConfigured: hasCloudProvider };
      } catch (error) {
        return { isConfigured: false, error: `Cloud detection failed: ${error}` };
      }
    });
  }

  /**
   * Optimized MetalLB configuration with better error handling
   */
  async configureMetalLB(config: LoadBalancerConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("OptimizedLoadBalancerService: Starting MetalLB configuration");

      let ipRange = config.ipRange;
      
      if (config.autoDetectRange) {
        const detectedRange = await this.detectDockerNetworkRange();
        if (!detectedRange) {
          return { success: false, error: "Could not auto-detect Docker network range" };
        }
        ipRange = detectedRange;
      }

      // Clear cache before configuration
      this.apiManager.clearCache();

      // Step 1: Install MetalLB manifest
      const installResult = await this.installMetalLBManifest();
      if (!installResult.success) {
        return installResult;
      }

      // Step 2: Wait for MetalLB pods to be ready
      const waitResult = await this.waitForMetalLBPods();
      if (!waitResult.success) {
        return waitResult;
      }

      // Step 3: Configure IP pool
      const poolResult = await this.createIPAddressPool(ipRange);
      if (!poolResult.success) {
        return poolResult;
      }

      // Step 4: Create L2Advertisement
      const advResult = await this.createL2Advertisement();
      if (!advResult.success) {
        return advResult;
      }

      // Clear cache after successful configuration
      this.apiManager.clearCache();

      return { success: true };

    } catch (error) {
      console.error("OptimizedLoadBalancerService: Configuration error:", error);
      return { success: false, error: `Configuration failed: ${error}` };
    }
  }

  /**
   * Optimized network range detection
   */
  private async detectDockerNetworkRange(): Promise<string | null> {
    return this.apiManager.call('docker-network-range', async () => {
      try {
        // Get Docker Desktop's network configuration
        const result = await this.ddClient.extension.host?.cli.exec("kubectl", [
          "get", "nodes", "-o", "jsonpath={.items[0].status.addresses[?(@.type=='InternalIP')].address}"
        ]);

        const nodeIP = result?.stdout?.trim() || "";
        if (!nodeIP) {
          throw new Error("Could not determine node IP");
        }

        // Convert to CIDR range (assuming /24 subnet)
        const ipParts = nodeIP.split('.');
        if (ipParts.length !== 4) {
          throw new Error("Invalid IP format");
        }

        // Create a small range for LoadBalancer IPs
        const baseIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
        return `${baseIP}.200-${baseIP}.250`;

      } catch (error) {
        console.error("Error detecting Docker network range:", error);
        return null;
      }
    });
  }

  /**
   * Install MetalLB manifest with optimized error handling
   */
  private async installMetalLBManifest(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.ddClient.extension.host?.cli.exec("kubectl", [
        "apply", "-f", "https://raw.githubusercontent.com/metallb/metallb/v0.13.7/config/manifests/metallb-native.yaml",
        "--validate=false"
      ]);

      const isSuccess = (result?.stderr || "") === "" || 
                       (result?.stdout || "").includes("created") || 
                       (result?.stdout || "").includes("configured") ||
                       (result?.stdout || "").includes("unchanged");

      return { 
        success: isSuccess,
        error: isSuccess ? undefined : `Installation failed: ${result?.stderr || result?.stdout || "Unknown error"}`
      };

    } catch (error) {
      return { success: false, error: `Manifest installation failed: ${error}` };
    }
  }

  /**
   * Wait for MetalLB pods with timeout
   */
  private async waitForMetalLBPods(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.ddClient.extension.host?.cli.exec("kubectl", [
        "wait", "--for=condition=ready", "pod", "-l", "app=metallb",
        "-n", "metallb-system", "--timeout=60s"
      ]);

      return { success: (result?.stderr || "") === "" };

    } catch (error) {
      return { success: false, error: `Pod wait failed: ${error}` };
    }
  }

  /**
   * Create IP address pool using backend service
   */
  private async createIPAddressPool(ipRange: string): Promise<{ success: boolean; error?: string }> {
    try {
      const ipPoolYaml = `
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: docker-desktop-pool
  namespace: metallb-system
spec:
  addresses:
  - ${ipRange}
`;

      const response = await this.ddClient.extension.vm?.service?.post('/apply-yaml', {
        yaml: ipPoolYaml
      }) as any;

      return { 
        success: response?.data?.success || false,
        error: response?.data?.success ? undefined : `IP pool creation failed: ${response?.data?.error || 'Unknown error'}`
      };

    } catch (error) {
      return { success: false, error: `IP pool creation failed: ${error}` };
    }
  }

  /**
   * Create L2Advertisement using backend service
   */
  private async createL2Advertisement(): Promise<{ success: boolean; error?: string }> {
    try {
      const l2AdvYaml = `
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: docker-desktop-l2adv
  namespace: metallb-system
spec:
  ipAddressPools:
  - docker-desktop-pool
`;

      const response = await this.ddClient.extension.vm?.service?.post('/apply-yaml', {
        yaml: l2AdvYaml
      }) as any;

      return { 
        success: response?.data?.success || false,
        error: response?.data?.success ? undefined : `L2Advertisement creation failed: ${response?.data?.error || 'Unknown error'}`
      };

    } catch (error) {
      return { success: false, error: `L2Advertisement creation failed: ${error}` };
    }
  }

  /**
   * Remove MetalLB with optimized cleanup
   */
  async removeMetalLB(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear cache before removal
      this.apiManager.clearCache();

      // Remove MetalLB resources
      const result = await this.ddClient.extension.host?.cli.exec("kubectl", [
        "delete", "-f", "https://raw.githubusercontent.com/metallb/metallb/v0.13.7/config/manifests/metallb-native.yaml",
        "--ignore-not-found=true"
      ]);

      const isSuccess = (result?.stderr || "") === "" || (result?.stdout || "").includes("deleted");

      if (isSuccess) {
        // Clear cache after successful removal
        this.apiManager.clearCache();
      }

      return { 
        success: isSuccess,
        error: isSuccess ? undefined : `Removal failed: ${result?.stderr || result?.stdout || "Unknown error"}`
      };

    } catch (error) {
      return { success: false, error: `MetalLB removal failed: ${error}` };
    }
  }

  /**
   * Get performance metrics for the service
   */
  getPerformanceMetrics() {
    return {
      cacheHitRate: 0, // TODO: Implement in ApiCallManager
      totalApiCalls: 0, // TODO: Implement in ApiCallManager  
      averageResponseTime: 0 // TODO: Implement in ApiCallManager
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.apiManager.clearCache();
  }
}