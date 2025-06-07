import { v1 } from "@docker/extension-api-client-types";

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
    ports: string; // e.g., "80/TCP, 443/TCP"
  }>;
  error?: string;
  // Add other relevant fields from MetalLB status or other providers
}

export interface LoadBalancerConfiguration {
  provider: "metallb"; // Assuming only MetalLB for now
  ipRange: string;
  autoDetectRange: boolean;
}

export class LoadBalancerService {
  private ddClient: v1.DockerDesktopClient;

  constructor(ddClient: v1.DockerDesktopClient) {
    this.ddClient = ddClient;
  }

  /**
   * Checks the overall LoadBalancer status.
   * Determines if MetalLB is configured and working, or if a cloud provider LB is active.
   */
  async checkLoadBalancerStatus(): Promise<LoadBalancerStatus> {
    try {
      console.log(
        "LoadBalancerService: ===== STARTING LOADBALANCER DETECTION =====",
      );

      const metallbNamespaceExists = await this.quickCheckMetalLBNamespace();
      console.log(
        "LoadBalancerService: MetalLB namespace 'metallb-system' exists (host CLI check):",
        metallbNamespaceExists,
      );

      if (metallbNamespaceExists) {
        const metallbStatus = await this.checkMetalLBStatus();
        console.log(
          "LoadBalancerService: Detailed MetalLB status check result:",
          metallbStatus,
        );
        // If checkMetalLBStatus identifies MetalLB as the provider, its detailed status is returned.
        // This status (metallbStatus.isConfigured) should be true only if MetalLB is fully operational (controller + IP Pools).
        if (metallbStatus.provider === "metallb") {
          return metallbStatus;
        }
        // If metallbNamespaceExists but provider is not 'metallb' from the detailed check (e.g. error in checkMetalLBStatus itself)
        // Treat as MetalLB present but not okay.
        console.log(
          "LoadBalancerService: MetalLB namespace exists, but detailed check didn't confirm functional MetalLB provider.",
        );
        return {
          isConfigured: false,
          provider: "metallb", // Identified by namespace, but not fully functional
          error:
            metallbStatus.error ||
            "MetalLB components found, but status check was inconclusive or indicated issues. Review MetalLB setup.",
        };
      } else {
        // MetalLB namespace NOT found.
        console.log(
          "LoadBalancerService: MetalLB namespace 'metallb-system' not found.",
        );
        // Check for other LoadBalancer services for contextual information, but don't assume configuration.
        const servicesStatus = await this.checkLoadBalancerServices();
        console.log(
          "LoadBalancerService: General LoadBalancer services check result (when MetalLB namespace absent):",
          servicesStatus,
        );

        let errorMsg =
          "MetalLB namespace 'metallb-system' not found. MetalLB must be installed and configured in this namespace for the extension to manage it.";
        if (
          servicesStatus.isConfigured &&
          servicesStatus.servicesWithIPs &&
          servicesStatus.servicesWithIPs.length > 0
        ) {
          errorMsg += ` Found ${servicesStatus.servicesWithIPs.length} existing service(s) with external IPs, but an active controller for new assignments (like MetalLB) was not confirmed.`;
        } else if (servicesStatus.error) {
          errorMsg += ` Additionally, error checking general services: ${servicesStatus.error}`;
        }

        return {
          isConfigured: false, // Explicitly false as the primary local LB provider (MetalLB) is not found.
          provider: "unknown",
          error: errorMsg,
        };
      }
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error in checkLoadBalancerStatus:",
        error,
      );
      return {
        isConfigured: false,
        provider: "unknown",
        error: `Critical error checking LoadBalancer status: ${error.message || JSON.stringify(error)}`,
      };
    }
  }

  /**
   * Quickly checks if the metallb-system namespace exists using host CLI.
   */
  private async quickCheckMetalLBNamespace(): Promise<boolean> {
    try {
      console.log(
        "LoadBalancerService: quickCheckMetalLBNamespace using host CLI...",
      );
      if (!this.ddClient?.extension?.host?.cli) {
        console.error(
          "LoadBalancerService: Host CLI not available for quick MetalLB namespace check",
        );
        return false;
      }
      const result = await this.ddClient.extension.host.cli.exec("kubectl", [
        "get",
        "namespace",
        "metallb-system",
        "--ignore-not-found",
        "-o",
        "name",
      ]);

      if (result.stderr && result.stderr.trim() !== "") {
        console.error(
          "LoadBalancerService: quickCheckMetalLBNamespace (host) encountered an error during kubectl execution. stderr:",
          result.stderr.trim(),
        );
        return false;
      }

      if (
        result.stdout &&
        result.stdout.trim() === "namespace/metallb-system"
      ) {
        console.log(
          "LoadBalancerService: quickCheckMetalLBNamespace (host) successfully found 'metallb-system' namespace.",
        );
        return true;
      } else {
        console.log(
          "LoadBalancerService: quickCheckMetalLBNamespace (host) did NOT find 'metallb-system' namespace. stdout:",
          result.stdout.trim(),
        );
        return false;
      }
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error during quickCheckMetalLBNamespace (host CLI exec):",
        error.stderr || error.message || error,
      );
      return false;
    }
  }

  /**
   * Performs a detailed check of MetalLB components using host CLI.
   */
  private async checkMetalLBStatus(): Promise<LoadBalancerStatus> {
    try {
      console.log(
        "LoadBalancerService: Starting detailed MetalLB status check (using host CLI)...",
      );
      if (!this.ddClient?.extension?.host?.cli) {
        console.error(
          "LoadBalancerService: Host CLI not available for detailed MetalLB check",
        );
        return {
          isConfigured: false,
          error: "Host CLI not available",
          provider: "metallb", // Attempted check for MetalLB
        };
      }

      // Namespace check (redundant if quickCheck already did it, but good for standalone call)
      const nsExists = await this.quickCheckMetalLBNamespace();
      if (!nsExists) {
        return { isConfigured: false, provider: "unknown" }; // No MetalLB namespace means no MetalLB
      }

      // Check MetalLB controller deployment
      const deployResult = await this.ddClient.extension.host.cli.exec(
        "kubectl",
        [
          "get",
          "deployment",
          "-n",
          "metallb-system",
          "controller",
          "--ignore-not-found",
          "-o",
          "json",
        ],
      );

      if (
        deployResult.stderr &&
        deployResult.stderr.trim() !== "" &&
        (!deployResult.stdout ||
          deployResult.stdout.trim() === "" ||
          deployResult.stdout.trim() === "null")
      ) {
        const errorMsg = `Failed to get MetalLB controller deployment: ${deployResult.stderr.trim()}`;
        console.error("LoadBalancerService:", errorMsg);
        return {
          isConfigured: false,
          provider: "metallb",
          error: errorMsg,
        };
      }
      if (
        !deployResult.stdout ||
        deployResult.stdout.trim() === "" ||
        deployResult.stdout.trim() === "null"
      ) {
        const errorMsg = "MetalLB controller deployment not found.";
        console.log("LoadBalancerService:", errorMsg);
        return {
          isConfigured: false,
          provider: "metallb",
          error: errorMsg,
        };
      }

      let deploymentData;
      try {
        deploymentData = JSON.parse(deployResult.stdout);
      } catch (e: any) {
        const errorMsg = `Failed to parse MetalLB controller deployment JSON: ${e.message}`;
        console.warn(
          "LoadBalancerService:",
          errorMsg,
          "JSON:",
          deployResult.stdout,
        );
        return {
          isConfigured: false,
          provider: "metallb",
          error: errorMsg,
        };
      }

      if (!deploymentData?.status) {
        const errorMsg = "MetalLB controller deployment status is missing.";
        console.warn("LoadBalancerService:", errorMsg, "Data:", deploymentData);
        return {
          isConfigured: false,
          provider: "metallb",
          error: errorMsg,
        };
      }

      const readyReplicas = deploymentData.status.readyReplicas || 0;
      const desiredReplicas = deploymentData.spec?.replicas || 0;
      let controllerReady =
        readyReplicas > 0 && readyReplicas >= desiredReplicas;
      let statusMessage: string | undefined = undefined;

      if (!controllerReady && readyReplicas > 0) {
        statusMessage = `MetalLB controller partially ready: ${readyReplicas}/${desiredReplicas} replicas.`;
        // Consider partially ready as "working" for now, admin might be scaling.
        controllerReady = true;
      } else if (!controllerReady) {
        statusMessage = `MetalLB controller not ready: ${readyReplicas}/${desiredReplicas} replicas.`;
      }

      if (!controllerReady) {
        // If controller is definitively not ready (0 replicas or less than desired and not scaling up)
        // we might want to check pods directly as a fallback, but the deployment status is usually authoritative.
        console.log(
          "LoadBalancerService: MetalLB controller deployment not ready. Status:",
          statusMessage,
        );
        // We will proceed to check IP pools, as they might exist even if controller is temporarily down.
      } else {
        console.log(
          "LoadBalancerService: MetalLB controller deployment appears ready or partially ready.",
        );
      }

      // Check IP address pools
      const poolResult = await this.ddClient.extension.host.cli.exec(
        "kubectl",
        [
          "get",
          "ipaddresspools.metallb.io",
          "-n",
          "metallb-system",
          "-o",
          "json",
          "--ignore-not-found",
        ],
      );

      let ipPools: Array<{ name: string; addresses: string[] }> = [];
      if (
        poolResult.stderr &&
        poolResult.stderr.trim() !== "" &&
        (!poolResult.stdout ||
          poolResult.stdout.trim() === "" ||
          poolResult.stdout.trim() === "null")
      ) {
        // Error fetching pools, but controller might still be "configured"
        statusMessage =
          `${statusMessage || ""}. Failed to fetch IPAddressPools: ${poolResult.stderr.trim()}`.trim();
        console.error("LoadBalancerService:", statusMessage);
      } else if (
        poolResult.stdout &&
        poolResult.stdout.trim() !== "" &&
        poolResult.stdout.trim() !== "null"
      ) {
        try {
          const poolData = JSON.parse(poolResult.stdout);
          if (poolData.items && Array.isArray(poolData.items)) {
            ipPools = poolData.items.map((pool: any) => ({
              name: pool.metadata.name,
              addresses: pool.spec.addresses || [],
            }));
          }
        } catch (e: any) {
          const poolParseError = `Failed to parse IPAddressPools JSON: ${e.message}`;
          console.warn(
            "LoadBalancerService:",
            poolParseError,
            "JSON:",
            poolResult.stdout,
          );
          statusMessage = `${statusMessage || ""}. ${poolParseError}`.trim();
        }
      }

      const version =
        deploymentData.metadata?.labels?.["app.kubernetes.io/version"] ||
        "unknown";

      if (controllerReady && ipPools.length > 0) {
        console.log(
          "LoadBalancerService: MetalLB fully configured (controller ready, IP pools exist).",
        );
        return {
          isConfigured: true,
          provider: "metallb",
          version,
          ipPools,
          error: statusMessage, // Contains any partial readiness warnings
        };
      } else {
        let finalError = statusMessage || "";
        if (!controllerReady) {
          finalError = `${finalError} MetalLB controller not ready.`.trim();
        }
        if (ipPools.length === 0) {
          finalError = `${finalError} No IPAddressPools configured.`.trim();
        }
        finalError =
          finalError ||
          "MetalLB components found but not fully operational (check controller and IPAddressPools).";

        console.log(
          "LoadBalancerService: MetalLB not fully configured. Reason:",
          finalError,
        );
        return {
          isConfigured: false,
          provider: "metallb",
          version,
          ipPools,
          error: finalError,
        };
      }
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error in checkMetalLBStatus (host CLI):",
        error.stderr || error.message || error,
      );
      return {
        isConfigured: false,
        provider: "metallb", // Indicates an attempt to check MetalLB
        error: `Critical error checking MetalLB status: ${error.stderr || error.message || error}`,
      };
    }
  }

  /**
   * Check if cloud LoadBalancer is available (AWS, GCP, Azure, etc.) using host CLI.
   */
  private async checkCloudLoadBalancer(): Promise<LoadBalancerStatus> {
    try {
      console.log(
        "LoadBalancerService: Checking for cloud LoadBalancer (using host CLI)...",
      );
      if (!this.ddClient?.extension?.host?.cli) {
        console.error(
          "LoadBalancerService: Host CLI not available for cloud LoadBalancer check",
        );
        return { isConfigured: false, error: "Host CLI not available" };
      }

      const result = await this.ddClient.extension.host.cli.exec("kubectl", [
        "get",
        "nodes",
        "-o",
        "json",
      ]);

      if (
        result.stderr &&
        result.stderr.trim() !== "" &&
        (!result.stdout ||
          result.stdout.trim() === "" ||
          result.stdout.trim() === "null")
      ) {
        const errorMsg = `Failed to get node info for cloud check: ${result.stderr.trim()}`;
        console.error("LoadBalancerService:", errorMsg);
        return { isConfigured: false, error: errorMsg };
      }

      if (
        !result.stdout ||
        result.stdout.trim() === "" ||
        result.stdout.trim() === "null"
      ) {
        console.log(
          "LoadBalancerService: No node data found for cloud check (empty or null stdout).",
        );
        return { isConfigured: false };
      }

      let nodesData;
      try {
        nodesData = JSON.parse(result.stdout);
      } catch (e: any) {
        const errorMsg = `Failed to parse node JSON for cloud check: ${e.message}`;
        console.warn("LoadBalancerService:", errorMsg, "JSON:", result.stdout);
        return { isConfigured: false, error: errorMsg };
      }

      const nodes = nodesData.items || [];
      if (!Array.isArray(nodes)) {
        console.warn(
          "LoadBalancerService: Node data items is not an array for cloud check.",
        );
        return {
          isConfigured: false,
          error: "Invalid node data items format",
        };
      }

      for (const node of nodes) {
        const labels = node.metadata?.labels || {};
        if (
          labels["node.kubernetes.io/instance-type"] ||
          labels["topology.kubernetes.io/zone"] ||
          labels["kubernetes.io/cloud-provider"] ||
          labels["node.kubernetes.io/cloud-provider"]
        ) {
          console.log(
            "LoadBalancerService: Cloud provider labels found on a node.",
          );
          return {
            isConfigured: true,
            provider: "cloud",
            version: "cloud-provider",
          };
        }
      }
      console.log(
        "LoadBalancerService: No cloud provider labels found on any node.",
      );
      return { isConfigured: false };
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error during checkCloudLoadBalancer (host CLI exec):",
        error.stderr || error.message || error,
      );
      return {
        isConfigured: false,
        error: "Critical error checking cloud LoadBalancer",
      };
    }
  }

  /**
   * Checks if any services of type LoadBalancer have external IPs using host CLI.
   */
  private async checkLoadBalancerServices(): Promise<LoadBalancerStatus> {
    try {
      console.log(
        "LoadBalancerService: Checking LoadBalancer services via host CLI...",
      );

      if (!this.ddClient?.extension?.host?.cli) {
        console.error(
          "LoadBalancerService: Host CLI not available for LoadBalancer services check",
        );
        return {
          isConfigured: false,
          error: "Host CLI not available",
        };
      }

      const result = await this.ddClient.extension.host.cli.exec("kubectl", [
        "get",
        "svc",
        "-A", // All namespaces
        "-o",
        "json",
        "--field-selector=spec.type=LoadBalancer",
      ]);

      console.log(
        "LoadBalancerService: LoadBalancer services check (host CLI) result:",
        result,
      );

      if (
        result.stderr &&
        result.stderr.trim() !== "" &&
        (!result.stdout ||
          result.stdout.trim() === "" ||
          result.stdout.trim() === "null")
      ) {
        const errorMsg = `Services check failed: ${result.stderr.trim()}`;
        console.error("LoadBalancerService:", errorMsg);
        return {
          isConfigured: false,
          error: errorMsg,
        };
      }

      if (
        !result.stdout ||
        result.stdout.trim() === "" ||
        result.stdout.trim() === "null"
      ) {
        console.log(
          "LoadBalancerService: No LoadBalancer services found (empty or null stdout from host CLI).",
        );
        return { isConfigured: false };
      }

      let servicesData: any;
      try {
        servicesData = JSON.parse(result.stdout);
      } catch (e: any) {
        const errorMsg = `Failed to parse services JSON response: ${e.message}`;
        console.warn("LoadBalancerService:", errorMsg, "JSON:", result.stdout);
        return {
          isConfigured: false,
          error: errorMsg,
        };
      }

      const services = servicesData.items || [];
      if (!Array.isArray(services)) {
        console.warn(
          "LoadBalancerService: Service data items is not an array.",
        );
        return { isConfigured: false, error: "Invalid service data format" };
      }
      console.log(
        `LoadBalancerService: Found ${services.length} LoadBalancer services via host CLI`,
      );

      const servicesWithIPs = services.filter((svc: any) => {
        const loadBalancer = svc.status?.loadBalancer;
        const ingress = loadBalancer?.ingress || [];
        const hasIP =
          ingress.length > 0 && (ingress[0].ip || ingress[0].hostname);
        console.log(
          `LoadBalancerService: Service ${svc.metadata?.namespace}/${svc.metadata?.name}: ingress=${JSON.stringify(ingress)}, hasIP=${hasIP}`,
        );
        return hasIP;
      });

      console.log(
        `LoadBalancerService: Found ${servicesWithIPs.length} services with external IPs`,
      );

      if (servicesWithIPs.length > 0) {
        console.log(
          "LoadBalancerService: LoadBalancer is working! Returning configured status",
        );
        // Map the found services to the structure expected by servicesWithIPs
        const formattedServicesWithIPs = servicesWithIPs.map((svc: any) => ({
          name: svc.metadata?.name || "Unknown",
          namespace: svc.metadata?.namespace || "Unknown",
          externalIP:
            svc.status?.loadBalancer?.ingress?.[0]?.ip ||
            svc.status?.loadBalancer?.ingress?.[0]?.hostname ||
            "Not Assigned",
          ports: (svc.spec?.ports || [])
            .map((p: any) => `${p.port}/${p.protocol || "TCP"}`)
            .join(", "),
        }));
        return {
          isConfigured: true,
          provider: "unknown", // Can't determine specific provider from this check alone
          servicesWithIPs: formattedServicesWithIPs, // Attach the formatted list
        };
      }

      console.log(
        "LoadBalancerService: No LoadBalancer services with external IPs found",
      );
      return { isConfigured: false };
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error checking LoadBalancer services (host CLI):",
        error.stderr || error.message || error,
      );
      return {
        isConfigured: false,
        error: `Critical error checking LoadBalancer services: ${error.stderr || error.message || error}`,
      };
    }
  }

  /**
   * Configure MetalLB LoadBalancer for Docker Desktop using host CLI for apply operations.
   */
  async configureMetalLB(
    config: LoadBalancerConfiguration,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("LoadBalancerService: Configuring MetalLB LoadBalancer...");

      const namespaceExists = await this.quickCheckMetalLBNamespace();
      const isAlreadyInstalled = namespaceExists;

      if (isAlreadyInstalled) {
        console.log(
          "LoadBalancerService: metallb-system namespace found. Assuming base MetalLB components might exist. Skipping general manifest installation and proceeding to configure/verify specific resources (IPAddressPool, L2Advertisement).",
        );
      } else {
        console.log(
          "LoadBalancerService: metallb-system namespace not found. Proceeding with full MetalLB manifest installation.",
        );
      }

      // Step 1: Install MetalLB (only if not already installed) using host CLI
      if (!isAlreadyInstalled) {
        console.log(
          "LoadBalancerService: Installing MetalLB (applying metallb-native.yaml via host CLI)...",
        );
        const installResult = await this.ddClient.extension.host!.cli.exec(
          "kubectl",
          [
            "apply",
            "--validate=false", // Avoids K8s API calls from within VM for schema validation
            "-f",
            "https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml",
          ],
        );

        const installStdout = installResult.stdout || "";
        const installStderr = installResult.stderr || "";
        const installCombinedOutput = (
          installStdout + installStderr
        ).toLowerCase();
        const installSuccessKeywords = [
          "created",
          "configured",
          "unchanged",
          "applied",
        ];
        let isInstallSuccess = false;
        for (const keyword of installSuccessKeywords) {
          if (installCombinedOutput.includes(keyword)) {
            isInstallSuccess = true;
            break;
          }
        }

        if (!isInstallSuccess) {
          const errorMessage = `Failed to install MetalLB (applying metallb-native.yaml via host CLI). Stdout: [${installStdout}], Stderr: [${installStderr}]`;
          console.error("LoadBalancerService:", errorMessage);
          return { success: false, error: errorMessage };
        }
        console.log(
          "LoadBalancerService: MetalLB manifest application via host CLI deemed successful. Output:",
          installCombinedOutput,
        );
      }

      // Step 2: Wait for MetalLB to be ready using host CLI
      console.log(
        "LoadBalancerService: Waiting for MetalLB to be ready (using host CLI)...",
      );
      const waitResult = await this.ddClient.extension.host!.cli.exec(
        "kubectl",
        [
          "wait",
          "--namespace",
          "metallb-system",
          "--for=condition=ready",
          "pod",
          "--selector=app=metallb",
          "--timeout=120s",
        ],
      );

      if (waitResult.stderr && waitResult.stderr.trim() !== "") {
        console.warn(
          "LoadBalancerService: MetalLB pods may not be fully ready (kubectl wait stderr not empty), continuing with configuration. Stderr:",
          waitResult.stderr,
        );
      } else {
        console.log(
          "LoadBalancerService: MetalLB pods reported as ready or wait timed out. Stdout:",
          waitResult.stdout,
        );
      }

      // Step 3: Determine IP range
      let ipRange = config.ipRange;
      if (config.autoDetectRange) {
        const detectedRange = await this.detectDockerNetworkRange(); // Uses host CLI
        if (detectedRange) {
          ipRange = detectedRange;
        }
      }

      if (!ipRange) {
        return {
          success: false,
          error: "Unable to determine IP range for LoadBalancer",
        };
      }

      // Step 4: Create IP address pool using backend /apply-yaml
      // This assumes backend /apply-yaml can correctly talk to K8s API
      console.log(
        `LoadBalancerService: Creating IP address pool with range: ${ipRange} (using backend /apply-yaml)...`,
      );
      const poolYaml = `apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: docker-desktop-pool
  namespace: metallb-system
spec:
  addresses:
  - ${ipRange}`;

      const poolResponse = (await this.ddClient.extension.vm?.service?.post(
        "/apply-yaml",
        {
          yaml: poolYaml,
        },
      )) as any; // Type casting for simplicity, consider defining backend response type

      if (!poolResponse?.success) {
        const rawDataFromResponse = poolResponse?.data;
        const rawErrorFromResponse = poolResponse?.error;

        let actualBackendError = "";
        let actualBackendDataInfo = "";

        if (
          typeof rawDataFromResponse === "object" &&
          rawDataFromResponse !== null
        ) {
          if (typeof (rawDataFromResponse as any).error === "string") {
            actualBackendError = (rawDataFromResponse as any).error;
          }
          if (typeof (rawDataFromResponse as any).data === "string") {
            actualBackendDataInfo = (rawDataFromResponse as any).data;
          } else if (actualBackendDataInfo === "") {
            // If .data.data wasn't a string and we don't have other data info yet
            actualBackendDataInfo = JSON.stringify(rawDataFromResponse); // Use stringified full object as data info
          }
        } else if (typeof rawDataFromResponse === "string") {
          actualBackendDataInfo = rawDataFromResponse;
        }

        if (typeof rawErrorFromResponse === "string" && rawErrorFromResponse) {
          if (actualBackendError) {
            actualBackendError += ` ; Also, direct error from response: ${rawErrorFromResponse}`;
          } else {
            actualBackendError = rawErrorFromResponse;
          }
        }

        // Fallback stringification if still empty
        if (actualBackendDataInfo === "" && rawDataFromResponse) {
          actualBackendDataInfo = String(rawDataFromResponse);
        }
        if (actualBackendError === "" && rawErrorFromResponse) {
          actualBackendError = String(rawErrorFromResponse);
        }

        const isSuccessfulOperation =
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("unchanged")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("configured")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("created")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("applied")) ||
          (actualBackendError &&
            actualBackendError.toLowerCase().includes("already exists")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.toLowerCase().includes("already exists"));

        if (!isSuccessfulOperation) {
          let userFriendlyDetails = `BackendMsg: [${actualBackendError || "No specific error message from backend."}], BackendData: [${actualBackendDataInfo || "No data from backend."}]`;
          if (
            (actualBackendDataInfo.startsWith("[object Object]") ||
              actualBackendDataInfo === "{}") &&
            (actualBackendError === "" || actualBackendError === "[]")
          ) {
            userFriendlyDetails =
              "The backend encountered an issue interpreting the operation's result. The operation may have succeeded. Please check status after closing.";
          }
          const errorMsg = `Failed to create IP address pool via backend /apply-yaml. ${userFriendlyDetails}`;
          console.error(
            "LoadBalancerService:",
            errorMsg,
            "Raw Pool Response:",
            poolResponse,
          );
          return { success: false, error: errorMsg };
        }
        console.log(
          "LoadBalancerService: IP address pool operation via backend /apply-yaml reported success or acceptable non-failure. BackendMsg:",
          actualBackendError,
          "BackendData:",
          actualBackendDataInfo,
        );
      } else {
        console.log(
          "LoadBalancerService: IPAddressPool application via backend /apply-yaml reported success.",
        );
      }

      // Step 5: Create L2 advertisement using backend /apply-yaml
      console.log(
        "LoadBalancerService: Creating L2 advertisement (using backend /apply-yaml)...",
      );
      const l2Yaml = `apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: docker-desktop-l2
  namespace: metallb-system
spec:
  ipAddressPools:
  - docker-desktop-pool`;

      const l2Response = (await this.ddClient.extension.vm?.service?.post(
        "/apply-yaml",
        {
          yaml: l2Yaml,
        },
      )) as any; // Type casting

      if (!l2Response?.success) {
        const rawDataFromResponse = l2Response?.data;
        const rawErrorFromResponse = l2Response?.error;

        let actualBackendError = "";
        let actualBackendDataInfo = "";

        if (
          typeof rawDataFromResponse === "object" &&
          rawDataFromResponse !== null
        ) {
          if (typeof (rawDataFromResponse as any).error === "string") {
            actualBackendError = (rawDataFromResponse as any).error;
          }
          if (typeof (rawDataFromResponse as any).data === "string") {
            actualBackendDataInfo = (rawDataFromResponse as any).data;
          } else if (actualBackendDataInfo === "") {
            actualBackendDataInfo = JSON.stringify(rawDataFromResponse);
          }
        } else if (typeof rawDataFromResponse === "string") {
          actualBackendDataInfo = rawDataFromResponse;
        }

        if (typeof rawErrorFromResponse === "string" && rawErrorFromResponse) {
          if (actualBackendError) {
            actualBackendError += ` ; Also, direct error from response: ${rawErrorFromResponse}`;
          } else {
            actualBackendError = rawErrorFromResponse;
          }
        }

        if (actualBackendDataInfo === "" && rawDataFromResponse) {
          actualBackendDataInfo = String(rawDataFromResponse);
        }
        if (actualBackendError === "" && rawErrorFromResponse) {
          actualBackendError = String(rawErrorFromResponse);
        }

        const isSuccessfulOperation =
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("unchanged")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("configured")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("created")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.includes("applied")) ||
          (actualBackendError &&
            actualBackendError.toLowerCase().includes("already exists")) ||
          (actualBackendDataInfo &&
            actualBackendDataInfo.toLowerCase().includes("already exists"));

        if (!isSuccessfulOperation) {
          let userFriendlyDetails = `BackendMsg: [${actualBackendError || "No specific error message from backend."}], BackendData: [${actualBackendDataInfo || "No data from backend."}]`;
          if (
            (actualBackendDataInfo.startsWith("[object Object]") ||
              actualBackendDataInfo === "{}") &&
            (actualBackendError === "" || actualBackendError === "[]")
          ) {
            userFriendlyDetails =
              "The backend encountered an issue interpreting the operation's result. The operation may have succeeded. Please check status after closing.";
          }
          const errorMsg = `Failed to create L2 advertisement via backend /apply-yaml. ${userFriendlyDetails}`;
          console.error(
            "LoadBalancerService:",
            errorMsg,
            "Raw L2 Response:",
            l2Response,
          );
          return { success: false, error: errorMsg };
        }
        console.log(
          "LoadBalancerService: L2 advertisement operation via backend /apply-yaml reported success or acceptable non-failure. BackendMsg:",
          actualBackendError,
          "BackendData:",
          actualBackendDataInfo,
        );
      } else {
        console.log(
          "LoadBalancerService: L2Advertisement application via backend /apply-yaml reported success.",
        );
      }

      console.log(
        "LoadBalancerService: MetalLB LoadBalancer configuration steps completed.",
      );
      return { success: true };
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error configuring MetalLB:",
        error.stderr || error.message || error,
      );
      return {
        success: false,
        error: `Critical error configuring MetalLB: ${error.stderr || error.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Detects a suitable IP range for MetalLB based on Docker Desktop's node IP using host CLI.
   */
  private async detectDockerNetworkRange(): Promise<string | null> {
    try {
      console.log(
        "LoadBalancerService: Detecting Docker network range using host CLI...",
      );
      if (!this.ddClient?.extension?.host?.cli) {
        console.error(
          "LoadBalancerService: Host CLI not available for network range detection",
        );
        return null;
      }
      const result = await this.ddClient.extension.host.cli.exec("kubectl", [
        "get",
        "nodes",
        "-o",
        'jsonpath={.items[0].status.addresses[?(@.type=="InternalIP")].address}',
      ]);

      if (result.stderr && result.stderr.trim() !== "") {
        console.error(
          "LoadBalancerService: Error getting node IP for network range detection:",
          result.stderr,
        );
        return null;
      }

      if (!result.stdout || result.stdout.trim() === "") {
        console.warn(
          "LoadBalancerService: No node IP found for network range detection.",
        );
        return null;
      }
      const nodeIP = result.stdout.trim();
      console.log("LoadBalancerService: Detected node IP:", nodeIP);

      // Heuristic for Docker Desktop IP ranges
      if (nodeIP.startsWith("172.18.")) {
        return "172.18.200.1-172.18.200.100";
      } else if (nodeIP.startsWith("172.")) {
        // More generic 172.x range
        const parts = nodeIP.split(".");
        if (parts.length >= 2) {
          return `172.${parts[1]}.200.1-172.${parts[1]}.200.100`;
        }
      } else if (nodeIP.startsWith("10.")) {
        const parts = nodeIP.split(".");
        if (parts.length >= 2) {
          return `10.${parts[1]}.200.1-10.${parts[1]}.200.100`;
        }
      } else if (nodeIP.startsWith("192.168.")) {
        const parts = nodeIP.split(".");
        if (parts.length >= 3) {
          // Common for Docker Desktop on some systems, e.g., 192.168.65.x or 192.168.1.x
          // This heuristic might need adjustment based on typical Docker Desktop network setups.
          // A smaller range might be safer.
          return `192.168.${parts[2]}.200-192.168.${parts[2]}.250`;
        }
      }
      console.warn(
        "LoadBalancerService: Could not determine a typical Docker Desktop IP range from node IP:",
        nodeIP,
      );
      return null; // Fallback if no typical Docker Desktop pattern matches
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error detecting Docker network range:",
        error.stderr || error.message || error,
      );
      return null;
    }
  }

  /**
   * Removes MetalLB configuration using host CLI for the main manifest deletion.
   */
  async removeMetalLB(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        "LoadBalancerService: Removing MetalLB LoadBalancer (using host CLI for manifest deletion)...",
      );
      if (!this.ddClient?.extension?.host?.cli) {
        console.error(
          "LoadBalancerService: Host CLI not available for MetalLB removal",
        );
        return { success: false, error: "Host CLI not available" };
      }

      // Remove MetalLB installation manifest using host CLI
      const removeResult = await this.ddClient.extension.host.cli.exec(
        "kubectl",
        [
          "delete",
          "--ignore-not-found=true", // Make deletion idempotent
          "-f",
          "https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml",
        ],
      );

      const removeStdout = removeResult.stdout || "";
      const removeStderr = removeResult.stderr || "";
      const removeCombinedOutput = (removeStdout + removeStderr).toLowerCase();

      // "delete" is successful if resources are "deleted" or "not found".
      // stderr might contain "not found" messages which are okay with --ignore-not-found.
      const successDeleteKeywords = ["deleted", "not found"];
      let isDeleteSuccess = false;
      if (
        removeResult.stderr &&
        removeResult.stderr
          .toLowerCase()
          .includes("error from server (notfound)")
      ) {
        // This is a specific case where kubectl delete -f URL might error if URL is invalid but resources are gone
        isDeleteSuccess = true; // Treat as success if server says resources not found
        console.log(
          "LoadBalancerService: MetalLB removal indicated resources not found by server, considered successful.",
        );
      } else {
        for (const keyword of successDeleteKeywords) {
          if (removeCombinedOutput.includes(keyword)) {
            isDeleteSuccess = true;
            break;
          }
        }
      }

      if (
        !isDeleteSuccess &&
        removeResult.stderr &&
        removeResult.stderr.trim() !== ""
      ) {
        // If no success keywords and stderr has content (that isn't just "not found" already handled),
        // then it's likely a more significant error.
        const errorMessage = `Failed to remove MetalLB via host CLI. Stdout: [${removeStdout}], Stderr: [${removeStderr}]`;
        console.error("LoadBalancerService:", errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log(
        "LoadBalancerService: MetalLB LoadBalancer removal via host CLI deemed successful or resources already gone. Output:",
        removeCombinedOutput,
      );
      return { success: true };
    } catch (error: any) {
      console.error(
        "LoadBalancerService: Critical error removing MetalLB:",
        error.stderr || error.message || error,
      );
      return {
        success: false,
        error: `Critical error removing MetalLB: ${error.stderr || error.message || "Unknown error"}`,
      };
    }
  }
}
