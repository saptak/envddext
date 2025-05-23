import { v1 } from "@docker/extension-api-client-types";
import { Gateway, GatewayFormData, GatewayStatusInfo, GatewayClass } from "../types/gateway";

export const DockerDesktop = "docker-desktop";
export const CurrentExtensionContext = "currentExtensionContext";
export const IsK8sEnabled = "isK8sEnabled";

export const listHostContexts = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "config",
    "view",
    "-o",
    "jsonpath='{.contexts}'",
  ]);
  console.log(output);
  if (output?.stderr) {
    console.log(output.stderr);
    return output.stderr;
  }

  return output?.stdout;
};

export const setDockerDesktopContext = async (
  ddClient: v1.DockerDesktopClient
) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "config",
    "use-context",
    "docker-desktop",
  ]);
  console.log(output);
  if (output?.stderr) {
    return output.stderr;
  }
  return output?.stdout;
};

export const getCurrentHostContext = async (
  ddClient: v1.DockerDesktopClient
) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "config",
    "view",
    "-o",
    "jsonpath='{.current-context}'",
  ]);
  console.log(output);
  if (output?.stderr) {
    return output.stderr;
  }
  return output?.stdout;
};

export const checkK8sConnection = async (ddClient: v1.DockerDesktopClient) => {
  try {
    let output = await ddClient.extension.host?.cli.exec("kubectl", [
      "cluster-info",
      "--request-timeout",
      "2s",
    ]);
    console.log(output);
    if (output?.stderr) {
      console.log(output.stderr);
      return "false";
    }
    return "true";
  } catch (e: any) {
    console.log("[checkK8sConnection] error : ", e);
    return "false";
  }
};

export const listNamespaces = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "namespaces",
    "--no-headers",
    "-o",
    'custom-columns=":metadata.name"',
    "--context",
    "docker-desktop",
  ]);
  console.log(output);
  if (output?.stderr) {
    return output.stderr;
  }
  return output?.stdout;
};

export const listEnvoyGateways = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "gateways.gateway.networking.k8s.io",
    "-A",
    "-o",
    "json"
  ]);
  if (output?.stderr && !output.stderr.includes("not found")) {
    return { error: output.stderr };
  }
  try {
    return JSON.parse(output?.stdout || '{"items":[]}');
  } catch (e) {
    return { error: 'Failed to parse gateways JSON' };
  }
};

export const listEnvoyHTTPRoutes = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "httproutes.gateway.networking.k8s.io",
    "-A",
    "-o",
    "json"
  ]);
  if (output?.stderr && !output.stderr.includes("not found")) {
    return { error: output.stderr };
  }
  try {
    return JSON.parse(output?.stdout || '{"items":[]}');
  } catch (e) {
    return { error: 'Failed to parse httproutes JSON' };
  }
};

export const installEnvoyGateway = async (ddClient: v1.DockerDesktopClient, version: string = "latest") => {
  try {
    // First, try to uninstall any existing Envoy Gateway installation
    try {
      console.log("Attempting to uninstall any existing Envoy Gateway installation...");
      const uninstallOutput = await ddClient.extension.host?.cli.exec("helm", [
        "uninstall",
        "envoy-gateway"
      ]);
      console.log("Helm uninstall output:", uninstallOutput);
    } catch (uninstallError) {
      // Ignore uninstall errors - the release might not exist
      console.log("Uninstall error (likely release not found, which is fine):", uninstallError);
    }

    // Install Envoy Gateway directly from OCI registry
    console.log("Installing Envoy Gateway from OCI registry...");
    const installOutput = await ddClient.extension.host?.cli.exec("helm", [
      "install",
      "envoy-gateway",
      "oci://docker.io/envoyproxy/gateway-helm",
      "--version",
      version === "latest" ? "v0.0.0-latest" : version,
      "--namespace",
      "envoy-gateway-system",
      "--create-namespace",
      "--wait",
      "--debug"
    ]);
    console.log("Helm install output:", installOutput);

    if (installOutput?.stderr && installOutput.stderr.includes('Error: ') &&
        !installOutput.stderr.includes('already exists')) {
      return { error: installOutput.stderr };
    }

    // Wait for a few seconds to allow CRDs to be properly registered
    console.log("Waiting for CRDs to be properly registered...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify CRDs are installed
    let crdCheck = await checkEnvoyGatewayCRDs(ddClient);

    // If first check fails, wait a bit longer and try again
    if (!crdCheck) {
      console.log("First CRD check failed, waiting longer...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      crdCheck = await checkEnvoyGatewayCRDs(ddClient);
    }

    if (!crdCheck) {
      return { error: "Failed to verify Envoy Gateway CRDs installation" };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error during Envoy Gateway installation:", e);
    return { error: typeof e === 'string' ? e : JSON.stringify(e, null, 2) };
  }
};

/**
 * Get detailed status of a deployment
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the deployment
 * @param name Name of the deployment
 * @returns Detailed deployment status information
 */
export const getDetailedDeploymentStatus = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string
): Promise<{
  status: 'ready' | 'pending' | 'failed' | 'not_found';
  readyReplicas: number;
  desiredReplicas: number;
  message?: string;
  deployment?: any;
  age?: string;
  conditions?: any[];
}> => {
  try {
    // Get deployment details
    const deployOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "deployment",
      "-n",
      namespace,
      name,
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    if (!deployOutput?.stdout || deployOutput.stdout.trim() === "") {
      return {
        status: 'not_found',
        readyReplicas: 0,
        desiredReplicas: 0,
        message: `Deployment '${name}' not found in namespace '${namespace}'`
      };
    }

    const deployment = JSON.parse(deployOutput.stdout);
    const readyReplicas = deployment.status?.readyReplicas || 0;
    const desiredReplicas = deployment.spec?.replicas || 0;
    const conditions = deployment.status?.conditions || [];

    // Calculate age
    const creationTimestamp = new Date(deployment.metadata.creationTimestamp);
    const now = new Date();
    const ageMs = now.getTime() - creationTimestamp.getTime();
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    let age = '';
    if (ageDays > 0) {
      age = `${ageDays}d`;
    } else if (ageHours > 0) {
      age = `${ageHours}h`;
    } else {
      age = `${ageMinutes}m`;
    }

    // Determine status
    let status: 'ready' | 'pending' | 'failed';
    let message = '';

    if (readyReplicas < desiredReplicas) {
      status = 'pending';
      message = `${readyReplicas}/${desiredReplicas} replicas ready`;
    } else {
      // Check conditions for any issues
      const failedCondition = conditions.find((c: any) => c.status !== 'True' && c.type !== 'Progressing');
      if (failedCondition) {
        status = 'failed';
        message = `${failedCondition.reason}: ${failedCondition.message}`;
      } else {
        status = 'ready';
        message = `All ${readyReplicas} replicas are ready`;
      }
    }

    return {
      status,
      readyReplicas,
      desiredReplicas,
      message,
      deployment,
      age,
      conditions
    };
  } catch (error: any) {
    console.error("Error getting detailed deployment status:", error);
    return {
      status: 'failed',
      readyReplicas: 0,
      desiredReplicas: 0,
      message: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

/**
 * Get detailed information about pods
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the pods
 * @param selector Label selector for the pods
 * @returns Array of pod details with events
 */
export const getPodDetails = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  selector: string
): Promise<any[]> => {
  try {
    // Get pods
    const podsOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "pods",
      "-n",
      namespace,
      "-l",
      selector,
      "-o",
      "json"
    ]);

    if (!podsOutput?.stdout || podsOutput.stdout.trim() === "") {
      return [];
    }

    const podsJson = JSON.parse(podsOutput.stdout);
    const pods = podsJson.items || [];

    // Get events for each pod
    for (const pod of pods) {
      const podName = pod.metadata.name;
      const eventsOutput = await ddClient.extension.host?.cli.exec("kubectl", [
        "get",
        "events",
        "--field-selector",
        `involvedObject.name=${podName}`,
        "-n",
        namespace,
        "-o",
        "json"
      ]);

      if (eventsOutput?.stdout && eventsOutput.stdout.trim() !== "") {
        const eventsJson = JSON.parse(eventsOutput.stdout);
        pod.events = eventsJson.items || [];
      } else {
        pod.events = [];
      }
    }

    return pods;
  } catch (error: any) {
    console.error("Error getting pod details:", error);
    return [];
  }
};

/**
 * Get service endpoints
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the service
 * @param name Name of the service
 * @returns Service endpoint information
 */
export const getServiceEndpoints = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string
): Promise<{
  found: boolean;
  endpoints?: string[];
  ports?: any[];
  message?: string;
}> => {
  try {
    // Get service details
    const svcOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "service",
      "-n",
      namespace,
      name,
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    if (!svcOutput?.stdout || svcOutput.stdout.trim() === "") {
      return {
        found: false,
        message: `Service '${name}' not found in namespace '${namespace}'`
      };
    }

    const service = JSON.parse(svcOutput.stdout);
    const ports = service.spec?.ports || [];

    // Get endpoints
    const endpointsOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "endpoints",
      "-n",
      namespace,
      name,
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    let endpoints: string[] = [];

    if (endpointsOutput?.stdout && endpointsOutput.stdout.trim() !== "") {
      const endpointsJson = JSON.parse(endpointsOutput.stdout);
      const subsets = endpointsJson.subsets || [];

      for (const subset of subsets) {
        const addresses = subset.addresses || [];
        const ports = subset.ports || [];

        for (const address of addresses) {
          for (const port of ports) {
            endpoints.push(`${address.ip}:${port.port}`);
          }
        }
      }
    }

    return {
      found: true,
      endpoints,
      ports
    };
  } catch (error: any) {
    console.error("Error getting service endpoints:", error);
    return {
      found: false,
      message: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

export const checkEnvoyGatewayCRDs = async (ddClient: v1.DockerDesktopClient): Promise<boolean> => {
  try {
    // First, check if the namespace exists
    const nsOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "namespace",
      "envoy-gateway-system",
      "--no-headers",
      "--ignore-not-found"
    ]);

    if (!nsOutput?.stdout || nsOutput.stdout.trim() === "") {
      console.log("Envoy Gateway namespace not found");
      return false;
    }

    // Check if the deployment is running
    const deployOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "deployment",
      "-n",
      "envoy-gateway-system",
      "envoy-gateway",
      "--no-headers",
      "--ignore-not-found"
    ]);

    if (!deployOutput?.stdout || deployOutput.stdout.trim() === "") {
      console.log("Envoy Gateway deployment not found");
      return false;
    }

    // Check for Gateway API CRDs
    const crdOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "crd",
      "gateways.gateway.networking.k8s.io",
      "httproutes.gateway.networking.k8s.io",
      "--no-headers",
      "--ignore-not-found"
    ]);

    if (!crdOutput?.stdout || crdOutput.stdout.trim() === "") {
      console.log("Gateway API CRDs not found");
      return false;
    }

    // Check for Envoy Gateway specific CRDs
    const egCrdOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "crd",
      "envoyproxies.gateway.envoyproxy.io",
      "--no-headers",
      "--ignore-not-found"
    ]);

    if (!egCrdOutput?.stdout || egCrdOutput.stdout.trim() === "") {
      console.log("Envoy Gateway specific CRDs not found");
      return false;
    }

    // All checks passed
    return true;
  } catch (e) {
    console.error("Error checking Envoy Gateway installation:", e);
    return false;
  }
};

/**
 * List available GatewayClasses
 * @param ddClient Docker Desktop client
 * @returns Array of GatewayClass objects
 */
export const listGatewayClasses = async (ddClient: v1.DockerDesktopClient): Promise<GatewayClass[]> => {
  try {
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gatewayclasses.gateway.networking.k8s.io",
      "-o",
      "json"
    ]);

    if (output?.stderr && !output.stderr.includes("not found")) {
      console.error("Error listing GatewayClasses:", output.stderr);
      return [];
    }

    if (!output?.stdout || output.stdout.trim() === "") {
      return [];
    }

    const result = JSON.parse(output.stdout);
    return result.items || [];
  } catch (error: any) {
    console.error("Error listing GatewayClasses:", error);
    return [];
  }
};

/**
 * Create a Gateway resource
 * @param ddClient Docker Desktop client
 * @param gatewayData Gateway form data
 * @returns Success/error result
 */
export const createGateway = async (
  ddClient: v1.DockerDesktopClient,
  gatewayData: GatewayFormData
): Promise<{ success: boolean; error?: string; gateway?: Gateway }> => {
  try {
    // Build the Gateway object
    const gateway: Gateway = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'Gateway',
      metadata: {
        name: gatewayData.name,
        namespace: gatewayData.namespace,
        ...(gatewayData.labels && Object.keys(gatewayData.labels).length > 0 && { labels: gatewayData.labels }),
        ...(gatewayData.annotations && Object.keys(gatewayData.annotations).length > 0 && { annotations: gatewayData.annotations })
      },
      spec: {
        gatewayClassName: gatewayData.gatewayClassName,
        listeners: gatewayData.listeners.map(listener => ({
          name: listener.name,
          port: listener.port,
          protocol: listener.protocol,
          ...(listener.hostname && { hostname: listener.hostname }),
          ...(listener.protocol === 'HTTPS' && listener.tlsMode && {
            tls: {
              mode: listener.tlsMode,
              ...(listener.certificateName && {
                certificateRefs: [{
                  name: listener.certificateName,
                  ...(listener.certificateNamespace && { namespace: listener.certificateNamespace })
                }]
              })
            }
          }),
          allowedRoutes: {
            namespaces: {
              from: listener.allowedRoutesFrom
            },
            kinds: listener.allowedRouteKinds.map(kind => ({
              kind,
              ...(kind !== 'HTTPRoute' && { group: 'gateway.networking.k8s.io' })
            }))
          }
        }))
      }
    };

    // Convert to YAML and apply
    const yamlContent = JSON.stringify(gateway, null, 2);

    // Create temporary file
    const tempFile = `/tmp/gateway-${gatewayData.name}-${Date.now()}.json`;

    // Write the JSON to the temporary file
    await ddClient.extension.host?.cli.exec("sh", [
      "-c",
      `echo '${yamlContent.replace(/'/g, "'\\''")}' > ${tempFile}`
    ]);

    // Apply the Gateway using kubectl
    const applyOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "apply",
      "-f",
      tempFile
    ]);

    // Clean up temporary file
    await ddClient.extension.host?.cli.exec("rm", [tempFile]);

    if (applyOutput?.stderr && applyOutput.stderr.includes('Error:')) {
      return {
        success: false,
        error: applyOutput.stderr
      };
    }

    return {
      success: true,
      gateway
    };
  } catch (error: any) {
    console.error("Error creating Gateway:", error);
    return {
      success: false,
      error: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

/**
 * Get detailed Gateway status information
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the Gateway
 * @param name Name of the Gateway
 * @returns Detailed Gateway status information
 */
export const getGatewayStatus = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string
): Promise<GatewayStatusInfo> => {
  try {
    // Get Gateway details
    const gatewayOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gateway",
      "-n",
      namespace,
      name,
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    if (!gatewayOutput?.stdout || gatewayOutput.stdout.trim() === "") {
      return {
        name,
        namespace,
        status: 'unknown',
        message: `Gateway '${name}' not found in namespace '${namespace}'`
      };
    }

    const gateway: Gateway = JSON.parse(gatewayOutput.stdout);
    const conditions = gateway.status?.conditions || [];
    const listeners = gateway.status?.listeners || [];
    const addresses = gateway.status?.addresses || [];

    // Calculate age
    let age = '';
    if (gateway.metadata.creationTimestamp) {
      const creationTime = new Date(gateway.metadata.creationTimestamp);
      const now = new Date();
      const ageMs = now.getTime() - creationTime.getTime();
      const ageMinutes = Math.floor(ageMs / (1000 * 60));
      const ageHours = Math.floor(ageMinutes / 60);
      const ageDays = Math.floor(ageHours / 24);

      if (ageDays > 0) {
        age = `${ageDays}d`;
      } else if (ageHours > 0) {
        age = `${ageHours}h`;
      } else {
        age = `${ageMinutes}m`;
      }
    }

    // Determine overall status
    let status: 'ready' | 'pending' | 'failed' | 'unknown' = 'unknown';
    let message = '';

    // Check for Programmed condition
    const programmedCondition = conditions.find(c => c.type === 'Programmed');
    if (programmedCondition) {
      if (programmedCondition.status === 'True') {
        status = 'ready';
        message = 'Gateway is programmed and ready';
      } else if (programmedCondition.status === 'False') {
        status = 'failed';
        message = `Gateway programming failed: ${programmedCondition.message}`;
      } else {
        status = 'pending';
        message = `Gateway programming pending: ${programmedCondition.message}`;
      }
    } else {
      status = 'pending';
      message = 'Gateway status unknown - waiting for controller';
    }

    // Process listener status
    const listenerStatus = listeners.map(listener => {
      const listenerConditions = listener.conditions || [];
      const programmedCondition = listenerConditions.find(c => c.type === 'Programmed');

      let listenerStatus: 'ready' | 'pending' | 'failed' = 'pending';
      let listenerMessage = '';

      if (programmedCondition) {
        if (programmedCondition.status === 'True') {
          listenerStatus = 'ready';
          listenerMessage = 'Listener is ready';
        } else {
          listenerStatus = 'failed';
          listenerMessage = programmedCondition.message;
        }
      }

      return {
        name: listener.name,
        status: listenerStatus,
        attachedRoutes: listener.attachedRoutes,
        message: listenerMessage
      };
    });

    return {
      name,
      namespace,
      status,
      message,
      addresses: addresses.map(addr => addr.value),
      listeners: listenerStatus,
      conditions,
      age
    };
  } catch (error: any) {
    console.error("Error getting Gateway status:", error);
    return {
      name,
      namespace,
      status: 'failed',
      message: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

/**
 * Delete a Gateway resource
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the Gateway
 * @param name Name of the Gateway
 * @returns Success/error result
 */
export const deleteGateway = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deleteOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "delete",
      "gateway",
      "-n",
      namespace,
      name,
      "--ignore-not-found"
    ]);

    if (deleteOutput?.stderr && deleteOutput.stderr.includes('Error:')) {
      return {
        success: false,
        error: deleteOutput.stderr
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting Gateway:", error);
    return {
      success: false,
      error: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

/**
 * List available namespaces
 * @param ddClient Docker Desktop client
 * @returns Array of namespace names
 */
export const listNamespaceNames = async (ddClient: v1.DockerDesktopClient): Promise<string[]> => {
  try {
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "namespaces",
      "-o",
      "jsonpath={.items[*].metadata.name}"
    ]);

    if (output?.stderr) {
      console.error("Error listing namespaces:", output.stderr);
      return ['default'];
    }

    if (!output?.stdout || output.stdout.trim() === "") {
      return ['default'];
    }

    return output.stdout.trim().split(/\s+/).filter(ns => ns.length > 0);
  } catch (error: any) {
    console.error("Error listing namespaces:", error);
    return ['default'];
  }
};
