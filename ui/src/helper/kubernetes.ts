import { v1 } from "@docker/extension-api-client-types";
import {
  Gateway,
  GatewayFormData,
  GatewayStatusInfo,
  GatewayClass,
} from "../types/gateway";
import {
  HTTPRoute,
  HTTPRouteFormData,
  HTTPRouteStatusInfo,
  HTTPRouteValidationResult,
  ValidationError,
} from "../types/httproute";
import yaml from "js-yaml";

// Backend API response type
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function to call backend API
export const callBackendAPI = async (
  ddClient: v1.DockerDesktopClient,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  dataRequest?: any,
): Promise<any> => {
  // Return Promise<any> as ddClient response structure varies
  try {
    let rawResponseFromService;
    if (method === "POST") {
      rawResponseFromService = await ddClient.extension.vm?.service?.post(
        endpoint,
        dataRequest,
      );
    } else {
      rawResponseFromService =
        await ddClient.extension.vm?.service?.get(endpoint);
    }
    return rawResponseFromService; // Return the raw response
  } catch (err: any) {
    console.error(`Backend API call failed (${method} ${endpoint}):`, err);

    let debugMessage = `callBackendAPI caught error for ${method} ${endpoint}. `;

    if (err && typeof err === "object") {
      if (err.message) {
        debugMessage += `Message: [${String(err.message)}]. `;
      }
      if (err.name) {
        debugMessage += `Name: [${String(err.name)}]. `;
      }
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data.error === "string"
      ) {
        debugMessage += `Nested backend error (err.response.data.error): [${err.response.data.error}]. `;
      } else if (err.data && typeof err.data.error === "string") {
        debugMessage += `Nested ddClient data.error: [${err.data.error}]. `;
      } else if (typeof err.error === "string") {
        debugMessage += `Direct err.error: [${err.error}]. `;
      }

      if (err.stack) {
        debugMessage += `Stack: [${String(err.stack).substring(0, 200)}...]. `;
      }

      try {
        const allProps = Object.getOwnPropertyNames(err);
        const errDetails: { [key: string]: any } = {};
        allProps.forEach((key) => {
          errDetails[key] = String((err as any)[key])?.substring(0, 100);
        });
        const fullErrorString = JSON.stringify(errDetails, null, 2);
        debugMessage += `Full error object properties (stringified): [${fullErrorString.substring(0, 500)}${fullErrorString.length > 500 ? "..." : ""}].`;
      } catch (stringifyError) {
        debugMessage +=
          "Full error object could not be stringified with custom logic. ";
        try {
          debugMessage += `Fallback stringify: ${String(err).substring(0, 500)}. `;
        } catch {
          debugMessage += `Fallback stringify also failed. `;
        }
      }
    } else if (typeof err === "string") {
      debugMessage += `Error is a string: [${err}].`;
    } else {
      debugMessage += `Caught error is of unknown type: [${String(err)}].`;
    }

    // Return an object that conforms to APIResponse for errors from the catch block
    return {
      success: false,
      error: debugMessage,
    } as APIResponse<never>;
  }
};

export const DockerDesktop = "docker-desktop";
export const CurrentExtensionContext = "currentExtensionContext";
export const IsK8sEnabled = "isK8sEnabled";

export const listHostContexts = async (
  ddClient: v1.DockerDesktopClient,
): Promise<string | undefined> => {
  const rawServiceResponse = await callBackendAPI(
    ddClient,
    "/kubectl",
    "POST",
    {
      args: ["config", "view", "-o", "jsonpath='{.contexts}'"],
    },
  );

  let finalSuccess: boolean = false;
  let finalData: string | undefined = undefined;
  let finalError: string | undefined = undefined;

  if (
    rawServiceResponse &&
    typeof rawServiceResponse.success === "boolean" &&
    rawServiceResponse.hasOwnProperty("error")
  ) {
    // This means rawServiceResponse IS the APIResponse (e.g., from callBackendAPI's catch block)
    const directApiResp = rawServiceResponse as APIResponse<string>;
    finalSuccess = directApiResp.success;
    if (finalSuccess) {
      finalData = directApiResp.data;
    } else {
      finalError =
        directApiResp.error ||
        "Unknown error from direct API response (listHostContexts)";
    }
  } else if (
    rawServiceResponse &&
    rawServiceResponse.data &&
    typeof rawServiceResponse.data.success === "boolean"
  ) {
    // This means rawServiceResponse is the ddClient wrapper, and APIResponse is in .data
    const nestedApiResp = rawServiceResponse.data as APIResponse<string>;
    finalSuccess = nestedApiResp.success;
    if (finalSuccess) {
      finalData = nestedApiResp.data;
    } else {
      finalError =
        nestedApiResp.error ||
        "Unknown error from nested API response (listHostContexts)";
    }
  } else {
    // Malformed or unexpected structure from callBackendAPI
    finalSuccess = false;
    finalError = `Frontend_malformed_service_response for /kubectl (contexts). RawResponse: [${JSON.stringify(rawServiceResponse)?.substring(0, 200)}]`;
  }

  if (finalSuccess) {
    return finalData;
  } else {
    console.error("Error listing host contexts:", finalError);
    throw new Error(finalError || "Failed to list host contexts");
  }
};

export const setDockerDesktopContext = async (
  ddClient: v1.DockerDesktopClient,
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
  ddClient: v1.DockerDesktopClient,
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
    "json",
  ]);
  if (output?.stderr && !output.stderr.includes("not found")) {
    return { error: output.stderr };
  }
  try {
    return JSON.parse(output?.stdout || '{"items":[]}');
  } catch (e) {
    return { error: "Failed to parse gateways JSON" };
  }
};

export const listEnvoyHTTPRoutes = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "httproutes.gateway.networking.k8s.io",
    "-A",
    "-o",
    "json",
  ]);
  if (output?.stderr && !output.stderr.includes("not found")) {
    return { error: output.stderr };
  }
  try {
    return JSON.parse(output?.stdout || '{"items":[]}');
  } catch (e) {
    return { error: "Failed to parse httproutes JSON" };
  }
};

export const installEnvoyGateway = async (
  ddClient: v1.DockerDesktopClient,
  version: string = "latest",
) => {
  try {
    // First, try to uninstall any existing Envoy Gateway installation
    try {
      console.log(
        "Attempting to uninstall any existing Envoy Gateway installation...",
      );
      const uninstallOutput = await ddClient.extension.host?.cli.exec("helm", [
        "uninstall",
        "envoy-gateway",
      ]);
      console.log("Helm uninstall output:", uninstallOutput);
    } catch (uninstallError) {
      // Ignore uninstall errors - the release might not exist
      console.log(
        "Uninstall error (likely release not found, which is fine):",
        uninstallError,
      );
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
      "--debug",
    ]);
    console.log("Helm install output:", installOutput);

    if (
      installOutput?.stderr &&
      installOutput.stderr.includes("Error: ") &&
      !installOutput.stderr.includes("already exists")
    ) {
      return { error: installOutput.stderr };
    }

    // Wait for a few seconds to allow CRDs to be properly registered
    console.log("Waiting for CRDs to be properly registered...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify CRDs are installed
    let crdCheck = await checkEnvoyGatewayCRDs(ddClient);

    // If first check fails, wait a bit longer and try again
    if (!crdCheck) {
      console.log("First CRD check failed, waiting longer...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      crdCheck = await checkEnvoyGatewayCRDs(ddClient);
    }

    if (!crdCheck) {
      return { error: "Failed to verify Envoy Gateway CRDs installation" };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error during Envoy Gateway installation:", e);
    return { error: typeof e === "string" ? e : JSON.stringify(e, null, 2) };
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
  name: string,
): Promise<{
  status: "ready" | "pending" | "failed" | "not_found";
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
      "--ignore-not-found",
    ]);

    if (!deployOutput?.stdout || deployOutput.stdout.trim() === "") {
      return {
        status: "not_found",
        readyReplicas: 0,
        desiredReplicas: 0,
        message: `Deployment '${name}' not found in namespace '${namespace}'`,
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

    let age = "";
    if (ageDays > 0) {
      age = `${ageDays}d`;
    } else if (ageHours > 0) {
      age = `${ageHours}h`;
    } else {
      age = `${ageMinutes}m`;
    }

    // Determine status
    let status: "ready" | "pending" | "failed";
    let message = "";

    if (readyReplicas < desiredReplicas) {
      status = "pending";
      message = `${readyReplicas}/${desiredReplicas} replicas ready`;
    } else {
      // Check conditions for any issues
      const failedCondition = conditions.find(
        (c: any) => c.status !== "True" && c.type !== "Progressing",
      );
      if (failedCondition) {
        status = "failed";
        message = `${failedCondition.reason}: ${failedCondition.message}`;
      } else {
        status = "ready";
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
      conditions,
    };
  } catch (error: any) {
    console.error("Error getting detailed deployment status:", error);
    return {
      status: "failed",
      readyReplicas: 0,
      desiredReplicas: 0,
      message:
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
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
  selector: string,
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
      "json",
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
        "json",
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
  name: string,
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
      "--ignore-not-found",
    ]);

    if (!svcOutput?.stdout || svcOutput.stdout.trim() === "") {
      return {
        found: false,
        message: `Service '${name}' not found in namespace '${namespace}'`,
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
      "--ignore-not-found",
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
      ports,
    };
  } catch (error: any) {
    console.error("Error getting service endpoints:", error);
    return {
      found: false,
      message:
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

export const checkEnvoyGatewayCRDs = async (
  ddClient: v1.DockerDesktopClient,
): Promise<boolean> => {
  try {
    // First, check if the namespace exists
    const nsOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "namespace",
      "envoy-gateway-system",
      "--no-headers",
      "--ignore-not-found",
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
      "--ignore-not-found",
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
      "--ignore-not-found",
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
      "--ignore-not-found",
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
export const listGatewayClasses = async (
  ddClient: v1.DockerDesktopClient,
): Promise<GatewayClass[]> => {
  try {
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gatewayclasses.gateway.networking.k8s.io",
      "-o",
      "json",
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
  gatewayData: GatewayFormData,
): Promise<{ success: boolean; error?: string; gateway?: Gateway }> => {
  // rawServiceResponse is potentially { data: APIResponse<string>, headers: ... } OR an APIResponse if catch block in callBackendAPI was hit
  const rawServiceResponse = await callBackendAPI(
    // No type argument here
    ddClient,
    "/create-gateway",
    "POST",
    gatewayData,
  );

  let errorForUI: string | undefined = undefined;
  let successForUI = false;

  // Determine if rawServiceResponse is the direct APIResponse (from callBackendAPI's catch)
  // or if it's the wrapped response { data: APIResponse, headers: ... } from ddClient success
  const actualBackendResponse: APIResponse<string> | null =
    rawServiceResponse &&
    typeof rawServiceResponse.success === "boolean" &&
    rawServiceResponse.hasOwnProperty("error")
      ? rawServiceResponse // Came from callBackendAPI's catch block
      : rawServiceResponse &&
          rawServiceResponse.data &&
          typeof rawServiceResponse.data.success === "boolean"
        ? rawServiceResponse.data // Actual APIResponse is nested in .data
        : null;

  if (actualBackendResponse) {
    if (actualBackendResponse.success) {
      successForUI = true;
      // TODO: If actualBackendResponse.data (which would be a string from APIResponse<string>)
      // contains gateway details, parse it and potentially return in the 'gateway' field.
      // For now, just confirming success. Example:
      // if (typeof actualBackendResponse.data === 'string' && actualBackendResponse.data.includes(gatewayData.name)) {
      //   // Basic indication of success, could be more structured if backend sent full Gateway object
      // }
    } else {
      // actualBackendResponse.success is false (either from backend or from callBackendAPI's catch)
      errorForUI = `Backend_reported_failure. Error: [${actualBackendResponse.error || "No specific error from backend."}] ContainedData: [${JSON.stringify(actualBackendResponse.data)?.substring(0, 100)}]`;
    }
  } else {
    // The response structure from ddClient/callBackendAPI was not as expected
    errorForUI = `Frontend_malformed_service_response. RawResponse: [${JSON.stringify(rawServiceResponse)?.substring(0, 200)}]`;
  }

  if (successForUI) {
    return { success: true }; // Optionally, return parsed gateway details: { success: true, gateway: parsedGateway }
  } else {
    return { success: false, error: errorForUI };
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
  name: string,
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
      "--ignore-not-found",
    ]);

    if (!gatewayOutput?.stdout || gatewayOutput.stdout.trim() === "") {
      return {
        name,
        namespace,
        status: "unknown",
        message: `Gateway '${name}' not found in namespace '${namespace}'`,
      };
    }

    const gateway: Gateway = JSON.parse(gatewayOutput.stdout);
    const conditions = gateway.status?.conditions || [];
    const listeners = gateway.status?.listeners || [];
    const addresses = gateway.status?.addresses || [];

    // Calculate age
    let age = "";
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
    let status: "ready" | "pending" | "failed" | "unknown" = "unknown";
    let message = "";

    // Check for Programmed condition
    const programmedCondition = conditions.find((c) => c.type === "Programmed");
    if (programmedCondition) {
      if (programmedCondition.status === "True") {
        status = "ready";
        message = "Gateway is programmed and ready";
      } else if (programmedCondition.status === "False") {
        status = "failed";
        message = `Gateway programming failed: ${programmedCondition.message}`;
      } else {
        status = "pending";
        message = `Gateway programming pending: ${programmedCondition.message}`;
      }
    } else {
      status = "pending";
      message = "Gateway status unknown - waiting for controller";
    }

    // Process listener status
    const listenerStatus = listeners.map((listener) => {
      const listenerConditions = listener.conditions || [];
      const programmedCondition = listenerConditions.find(
        (c) => c.type === "Programmed",
      );

      let listenerStatus: "ready" | "pending" | "failed" = "pending";
      let listenerMessage = "";

      if (programmedCondition) {
        if (programmedCondition.status === "True") {
          listenerStatus = "ready";
          listenerMessage = "Listener is ready";
        } else {
          listenerStatus = "failed";
          listenerMessage = programmedCondition.message;
        }
      }

      return {
        name: listener.name,
        status: listenerStatus,
        attachedRoutes: listener.attachedRoutes,
        message: listenerMessage,
      };
    });

    return {
      name,
      namespace,
      status,
      message,
      addresses: addresses.map((addr) => addr.value),
      listeners: listenerStatus,
      conditions,
      age,
    };
  } catch (error: any) {
    console.error("Error getting Gateway status:", error);
    return {
      name,
      namespace,
      status: "failed",
      message:
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
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
  name: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deleteOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "delete",
      "gateway",
      "-n",
      namespace,
      name,
      "--ignore-not-found",
    ]);

    if (deleteOutput?.stderr && deleteOutput.stderr.includes("Error:")) {
      return {
        success: false,
        error: deleteOutput.stderr,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting Gateway:", error);
    return {
      success: false,
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * List available namespaces
 * @param ddClient Docker Desktop client
 * @returns Array of namespace names
 */
export const listNamespaceNames = async (
  ddClient: v1.DockerDesktopClient,
): Promise<string[]> => {
  try {
    // Use a simpler kubectl command that doesn't require shell operators
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "namespaces",
      "--no-headers",
      "-o",
      "custom-columns=:metadata.name",
    ]);

    // Only treat stderr as an error if it contains actual error messages
    // Some kubectl commands may have warnings in stderr but still succeed
    if (output?.stderr && (
      output.stderr.includes("Error:") || 
      output.stderr.includes("error:") ||
      output.stderr.includes("Unable to connect") ||
      output.stderr.includes("connection refused") ||
      output.stderr.includes("not found") ||
      output.stderr.includes("forbidden")
    )) {
      console.error("Error listing namespaces:", output.stderr);
      return ["default"];
    }

    // Log stderr as warning if present but not critical
    if (output?.stderr) {
      console.warn("Non-critical stderr from kubectl get namespaces:", output.stderr);
    }

    if (!output?.stdout || output.stdout.trim() === "") {
      console.warn("Empty stdout from kubectl get namespaces, falling back to default");
      return ["default"];
    }

    const namespaces = output.stdout
      .trim()
      .split(/\n/)
      .map(line => line.trim())
      .filter((ns) => ns.length > 0);

    console.log("Successfully retrieved namespaces:", namespaces);
    return namespaces;
  } catch (error: any) {
    console.error("Exception when listing namespaces:", error);
    return ["default"];
  }
};

// ============================================================================
// HTTPRoute Management Functions
// ============================================================================

/**
 * Create an HTTPRoute resource
 * @param ddClient Docker Desktop client
 * @param routeData HTTPRoute form data
 * @returns Success/error result with created HTTPRoute
 */
export const createHTTPRoute = async (
  ddClient: v1.DockerDesktopClient,
  routeData: HTTPRouteFormData,
): Promise<{ success: boolean; error?: string; httpRoute?: HTTPRoute }> => {
  // Validate the form data first
  const validation = validateHTTPRouteConfiguration(routeData);
  if (!validation.isValid) {
    return {
      success: false,
      error: `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
    };
  }

  const rawServiceResponse = await callBackendAPI(
    // No type argument here
    ddClient,
    "/create-httproute",
    "POST",
    routeData,
  );

  let finalSuccess: boolean = false;
  // Assuming backend data for HTTPRoute creation success is just a string message
  let finalData: string | undefined = undefined;
  let finalError: string | undefined = undefined;

  if (
    rawServiceResponse &&
    typeof rawServiceResponse.success === "boolean" &&
    rawServiceResponse.hasOwnProperty("error")
  ) {
    const directApiResp = rawServiceResponse as APIResponse<string>;
    finalSuccess = directApiResp.success;
    if (finalSuccess) {
      finalData = directApiResp.data;
    } else {
      finalError =
        directApiResp.error ||
        "Unknown error from direct API response (createHTTPRoute)";
    }
  } else if (
    rawServiceResponse &&
    rawServiceResponse.data &&
    typeof rawServiceResponse.data.success === "boolean"
  ) {
    const nestedApiResp = rawServiceResponse.data as APIResponse<string>;
    finalSuccess = nestedApiResp.success;
    if (finalSuccess) {
      finalData = nestedApiResp.data;
    } else {
      finalError =
        nestedApiResp.error ||
        "Unknown error from nested API response (createHTTPRoute)";
    }
  } else {
    finalSuccess = false;
    finalError = `Frontend_malformed_service_response for /create-httproute. RawResponse: [${JSON.stringify(rawServiceResponse)?.substring(0, 200)}]`;
  }

  if (finalSuccess) {
    // We don't have the httpRoute object from the backend, similar to createGateway
    return { success: true };
  } else {
    return { success: false, error: finalError };
  }
};

/**
 * List HTTPRoutes with optional filtering
 * @param ddClient Docker Desktop client
 * @param namespace Optional namespace filter
 * @returns List of HTTPRoutes
 */
export const listHTTPRoutes = async (
  ddClient: v1.DockerDesktopClient,
  namespace?: string,
): Promise<{ items: HTTPRoute[]; error?: string }> => {
  try {
    const args = ["get", "httproutes.gateway.networking.k8s.io", "-o", "json"];

    if (namespace) {
      args.splice(2, 0, "-n", namespace);
    } else {
      args.splice(2, 0, "-A");
    }

    const output = await ddClient.extension.host?.cli.exec("kubectl", args);

    if (output?.stderr && !output.stderr.includes("not found")) {
      return { items: [], error: output.stderr };
    }

    try {
      const result = JSON.parse(output?.stdout || '{"items":[]}');
      return { items: result.items || [] };
    } catch (e) {
      return { items: [], error: "Failed to parse HTTPRoutes JSON" };
    }
  } catch (error: any) {
    console.error("Error listing HTTPRoutes:", error);
    return {
      items: [],
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Get detailed HTTPRoute status information
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the HTTPRoute
 * @param name Name of the HTTPRoute
 * @returns Detailed HTTPRoute status information
 */
export const getHTTPRouteStatus = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string,
): Promise<HTTPRouteStatusInfo> => {
  try {
    // Get HTTPRoute details
    const routeOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "httproute",
      "-n",
      namespace,
      name,
      "-o",
      "json",
      "--ignore-not-found",
    ]);

    if (!routeOutput?.stdout || routeOutput.stdout.trim() === "") {
      return {
        name,
        namespace,
        status: "unknown",
        message: `HTTPRoute '${name}' not found in namespace '${namespace}'`,
      };
    }

    const httpRoute: HTTPRoute = JSON.parse(routeOutput.stdout);
    const conditions = httpRoute.status?.parents?.[0]?.conditions || [];

    // Calculate age
    let age = "";
    if (httpRoute.metadata.creationTimestamp) {
      const creationTime = new Date(httpRoute.metadata.creationTimestamp);
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
    let status: "ready" | "pending" | "failed" | "unknown" = "unknown";
    let message = "";

    // Check for Accepted condition
    const acceptedCondition = conditions.find((c) => c.type === "Accepted");
    if (acceptedCondition) {
      if (acceptedCondition.status === "True") {
        status = "ready";
        message = "HTTPRoute is accepted and ready";
      } else if (acceptedCondition.status === "False") {
        status = "failed";
        message = `HTTPRoute not accepted: ${acceptedCondition.message}`;
      } else {
        status = "pending";
        message = `HTTPRoute acceptance pending: ${acceptedCondition.message}`;
      }
    } else {
      status = "pending";
      message = "HTTPRoute status unknown - waiting for controller";
    }

    // Process parent Gateway status
    const parentGateways =
      httpRoute.status?.parents?.map((parent) => ({
        name: parent.parentRef.name,
        namespace: parent.parentRef.namespace || namespace,
        status:
          parent.conditions.find((c) => c.type === "Accepted")?.status ===
          "True"
            ? ("accepted" as const)
            : parent.conditions.find((c) => c.type === "Accepted")?.status ===
                "False"
              ? ("failed" as const)
              : ("pending" as const),
        message: parent.conditions.find((c) => c.type === "Accepted")?.message,
      })) || [];

    // Check backend services status
    const backendServices: Array<{
      name: string;
      namespace: string;
      status: "available" | "unavailable" | "unknown";
      endpoints?: number;
    }> = [];

    for (const rule of httpRoute.spec.rules || []) {
      for (const backend of rule.backendRefs || []) {
        const serviceNamespace = backend.namespace || namespace;
        const serviceStatus = await getServiceEndpoints(
          ddClient,
          serviceNamespace,
          backend.name,
        );

        backendServices.push({
          name: backend.name,
          namespace: serviceNamespace,
          status: serviceStatus.found ? "available" : "unavailable",
          endpoints: serviceStatus.endpoints?.length || 0,
        });
      }
    }

    return {
      name,
      namespace,
      status,
      message,
      parentGateways,
      backendServices,
      conditions,
      age,
    };
  } catch (error: any) {
    console.error("Error getting HTTPRoute status:", error);
    return {
      name,
      namespace,
      status: "failed",
      message:
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Delete an HTTPRoute resource
 * @param ddClient Docker Desktop client
 * @param namespace Namespace of the HTTPRoute
 * @param name Name of the HTTPRoute
 * @returns Success/error result
 */
export const deleteHTTPRoute = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deleteOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "delete",
      "httproute",
      "-n",
      namespace,
      name,
      "--ignore-not-found",
    ]);

    if (deleteOutput?.stderr && deleteOutput.stderr.includes("Error:")) {
      return {
        success: false,
        error: deleteOutput.stderr,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting HTTPRoute:", error);
    return {
      success: false,
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Validate HTTPRoute configuration
 * @param routeData HTTPRoute form data
 * @returns Validation result with errors
 */
export const validateHTTPRouteConfiguration = (
  routeData: HTTPRouteFormData,
): HTTPRouteValidationResult => {
  const errors: ValidationError[] = [];

  // Validate basic fields
  if (!routeData.name.trim()) {
    errors.push({ field: "name", message: "HTTPRoute name is required" });
  } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(routeData.name)) {
    errors.push({
      field: "name",
      message: "HTTPRoute name must be a valid DNS subdomain",
    });
  }

  if (!routeData.namespace.trim()) {
    errors.push({ field: "namespace", message: "Namespace is required" });
  }

  if (!routeData.parentGateway.trim()) {
    errors.push({
      field: "parentGateway",
      message: "Parent Gateway is required",
    });
  }

  // Validate hostnames
  routeData.hostnames.forEach((hostname, index) => {
    if (
      hostname &&
      !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(
        hostname,
      )
    ) {
      errors.push({
        field: `hostnames[${index}]`,
        message: "Invalid hostname format",
      });
    }
  });

  // Validate rules
  if (routeData.rules.length === 0) {
    errors.push({ field: "rules", message: "At least one rule is required" });
  }

  routeData.rules.forEach((rule, ruleIndex) => {
    // Validate matches
    if (rule.matches.length === 0) {
      errors.push({
        field: `rules[${ruleIndex}].matches`,
        message: "At least one match is required per rule",
      });
    }

    rule.matches.forEach((match, matchIndex) => {
      if (!match.pathValue.trim()) {
        errors.push({
          field: `rules[${ruleIndex}].matches[${matchIndex}].pathValue`,
          message: "Path value is required",
        });
      } else if (!match.pathValue.startsWith("/")) {
        errors.push({
          field: `rules[${ruleIndex}].matches[${matchIndex}].pathValue`,
          message: "Path must start with /",
        });
      }

      // Validate headers
      match.headers.forEach((header, headerIndex) => {
        if (!header.name.trim()) {
          errors.push({
            field: `rules[${ruleIndex}].matches[${matchIndex}].headers[${headerIndex}].name`,
            message: "Header name is required",
          });
        }
        if (!header.value.trim()) {
          errors.push({
            field: `rules[${ruleIndex}].matches[${matchIndex}].headers[${headerIndex}].value`,
            message: "Header value is required",
          });
        }
      });

      // Validate query parameters
      match.queryParams.forEach((param, paramIndex) => {
        if (!param.name.trim()) {
          errors.push({
            field: `rules[${ruleIndex}].matches[${matchIndex}].queryParams[${paramIndex}].name`,
            message: "Query parameter name is required",
          });
        }
        if (!param.value.trim()) {
          errors.push({
            field: `rules[${ruleIndex}].matches[${matchIndex}].queryParams[${paramIndex}].value`,
            message: "Query parameter value is required",
          });
        }
      });
    });

    // Validate backend refs
    if (rule.backendRefs.length === 0) {
      errors.push({
        field: `rules[${ruleIndex}].backendRefs`,
        message: "At least one backend reference is required per rule",
      });
    }

    rule.backendRefs.forEach((backend, backendIndex) => {
      if (!backend.name.trim()) {
        errors.push({
          field: `rules[${ruleIndex}].backendRefs[${backendIndex}].name`,
          message: "Backend service name is required",
        });
      }

      if (backend.port <= 0 || backend.port > 65535) {
        errors.push({
          field: `rules[${ruleIndex}].backendRefs[${backendIndex}].port`,
          message: "Port must be between 1 and 65535",
        });
      }

      if (backend.weight < 0 || backend.weight > 1000000) {
        errors.push({
          field: `rules[${ruleIndex}].backendRefs[${backendIndex}].weight`,
          message: "Weight must be between 0 and 1000000",
        });
      }
    });

    // Validate timeouts
    if (
      rule.requestTimeout &&
      !/^\d+(\.\d+)?(ms|s|m|h)$/.test(rule.requestTimeout)
    ) {
      errors.push({
        field: `rules[${ruleIndex}].requestTimeout`,
        message: "Invalid timeout format (use: 30s, 5m, 1h, etc.)",
      });
    }

    if (
      rule.backendRequestTimeout &&
      !/^\d+(\.\d+)?(ms|s|m|h)$/.test(rule.backendRequestTimeout)
    ) {
      errors.push({
        field: `rules[${ruleIndex}].backendRequestTimeout`,
        message: "Invalid timeout format (use: 30s, 5m, 1h, etc.)",
      });
    }

    // Validate that backendRequest timeout is not greater than request timeout
    if (rule.requestTimeout && rule.backendRequestTimeout) {
      const requestTimeoutMs = parseDuration(rule.requestTimeout);
      const backendTimeoutMs = parseDuration(rule.backendRequestTimeout);

      if (
        requestTimeoutMs > 0 &&
        backendTimeoutMs > 0 &&
        backendTimeoutMs > requestTimeoutMs
      ) {
        errors.push({
          field: `rules[${ruleIndex}].backendRequestTimeout`,
          message:
            "Backend request timeout cannot be greater than request timeout",
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Parse duration string to milliseconds (simplified)
 * @param duration Duration string like "30s", "5m", "1h"
 * @returns Duration in milliseconds, or -1 if invalid
 */
const parseDuration = (duration: string): number => {
  const match = duration.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/);
  if (!match) return -1;

  const value = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return -1;
  }
};

/**
 * Get available Gateways for HTTPRoute parentRef selection
 * @param ddClient Docker Desktop client
 * @param namespace Optional namespace filter
 * @returns List of available Gateways
 */
export const getAvailableGateways = async (
  ddClient: v1.DockerDesktopClient,
  namespace?: string,
): Promise<{
  items: Array<{ name: string; namespace: string; listeners: string[] }>;
  error?: string;
}> => {
  try {
    const gatewayResult = await listEnvoyGateways(ddClient);

    if (gatewayResult.error) {
      return { items: [], error: gatewayResult.error };
    }

    const gateways = gatewayResult.items || [];
    const availableGateways = gateways
      .filter(
        (gw: Gateway) => !namespace || gw.metadata.namespace === namespace,
      )
      .map((gw: Gateway) => ({
        name: gw.metadata.name,
        namespace: gw.metadata.namespace,
        listeners: gw.spec.listeners.map(
          (l) => `${l.name} (${l.protocol}:${l.port})`,
        ),
      }));

    return { items: availableGateways };
  } catch (error: any) {
    console.error("Error getting available Gateways:", error);
    return {
      items: [],
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Get available Services for HTTPRoute backend selection
 * @param ddClient Docker Desktop client
 * @param namespace Namespace to search for services
 * @returns List of available Services with their ports
 */
export const getAvailableServices = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
): Promise<{
  items: Array<{
    name: string;
    namespace: string;
    ports: Array<{ name?: string; port: number; protocol: string }>;
  }>;
  error?: string;
}> => {
  try {
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "services",
      "-n",
      namespace,
      "-o",
      "json",
    ]);

    if (output?.stderr && !output.stderr.includes("not found")) {
      return { items: [], error: output.stderr };
    }

    try {
      const result = JSON.parse(output?.stdout || '{"items":[]}');
      const services = result.items || [];

      const availableServices = services.map((svc: any) => ({
        name: svc.metadata.name,
        namespace: svc.metadata.namespace,
        ports: (svc.spec.ports || []).map((port: any) => ({
          name: port.name,
          port: port.port,
          protocol: port.protocol || "TCP",
        })),
      }));

      return { items: availableServices };
    } catch (e) {
      return { items: [], error: "Failed to parse Services JSON" };
    }
  } catch (error: any) {
    console.error("Error getting available Services:", error);
    return {
      items: [],
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Check Gateway compatibility for HTTPRoute
 * @param ddClient Docker Desktop client
 * @param gatewayName Gateway name
 * @param gatewayNamespace Gateway namespace
 * @param routeNamespace HTTPRoute namespace
 * @returns Compatibility check result
 */
export const checkGatewayCompatibility = async (
  ddClient: v1.DockerDesktopClient,
  gatewayName: string,
  gatewayNamespace: string,
  routeNamespace: string,
): Promise<{ compatible: boolean; message?: string; listeners?: string[] }> => {
  try {
    const gatewayStatus = await getGatewayStatus(
      ddClient,
      gatewayNamespace,
      gatewayName,
    );

    if (
      gatewayStatus.status === "unknown" ||
      gatewayStatus.status === "failed"
    ) {
      return {
        compatible: false,
        message: `Gateway is not ready: ${gatewayStatus.message}`,
      };
    }

    // Get Gateway details to check listener configuration
    const gatewayOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gateway",
      "-n",
      gatewayNamespace,
      gatewayName,
      "-o",
      "json",
      "--ignore-not-found",
    ]);

    if (!gatewayOutput?.stdout || gatewayOutput.stdout.trim() === "") {
      return {
        compatible: false,
        message: `Gateway '${gatewayName}' not found in namespace '${gatewayNamespace}'`,
      };
    }

    const gateway: Gateway = JSON.parse(gatewayOutput.stdout);
    const httpListeners = gateway.spec.listeners.filter(
      (l) => l.protocol === "HTTP" || l.protocol === "HTTPS",
    );

    if (httpListeners.length === 0) {
      return {
        compatible: false,
        message:
          "Gateway has no HTTP/HTTPS listeners that can accept HTTPRoutes",
      };
    }

    // Check if any listener allows HTTPRoutes from the route's namespace
    const compatibleListeners = httpListeners.filter((listener) => {
      const allowedRoutes = listener.allowedRoutes;

      if (!allowedRoutes || !allowedRoutes.namespaces) {
        return true; // Default allows same namespace
      }

      const namespacePolicy = allowedRoutes.namespaces.from;

      if (namespacePolicy === "All") {
        return true;
      } else if (namespacePolicy === "Same") {
        return gatewayNamespace === routeNamespace;
      } else if (namespacePolicy === "Selector") {
        // For simplicity, assume selector allows the namespace
        // In a real implementation, we'd check the selector against namespace labels
        return true;
      }

      return false;
    });

    if (compatibleListeners.length === 0) {
      return {
        compatible: false,
        message: `Gateway listeners do not allow HTTPRoutes from namespace '${routeNamespace}'`,
      };
    }

    return {
      compatible: true,
      message: `Gateway is compatible with ${compatibleListeners.length} listener(s)`,
      listeners: compatibleListeners.map(
        (l) => `${l.name} (${l.protocol}:${l.port})`,
      ),
    };
  } catch (error: any) {
    console.error("Error checking Gateway compatibility:", error);
    return {
      compatible: false,
      message:
        typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Get Gateway YAML representation
 * @param ddClient Docker Desktop client
 * @param namespace Gateway namespace
 * @param name Gateway name
 * @returns YAML string or error
 */
export const getGatewayYAML = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string,
): Promise<{ yaml?: string; error?: string }> => {
  try {
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gateway",
      "-n",
      namespace,
      name,
      "-o",
      "yaml",
    ]);

    if (output?.stderr && output.stderr.includes("Error:")) {
      return {
        error: output.stderr,
      };
    }

    return { yaml: output?.stdout || "" };
  } catch (error: any) {
    console.error("Error getting Gateway YAML:", error);
    return {
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};

/**
 * Get HTTPRoute YAML representation
 * @param ddClient Docker Desktop client
 * @param namespace HTTPRoute namespace
 * @param name HTTPRoute name
 * @returns YAML string or error
 */
export const getHTTPRouteYAML = async (
  ddClient: v1.DockerDesktopClient,
  namespace: string,
  name: string,
): Promise<{ yaml?: string; error?: string }> => {
  try {
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "httproute",
      "-n",
      namespace,
      name,
      "-o",
      "yaml",
    ]);

    if (output?.stderr && output.stderr.includes("Error:")) {
      return {
        error: output.stderr,
      };
    }

    return { yaml: output?.stdout || "" };
  } catch (error: any) {
    console.error("Error getting HTTPRoute YAML:", error);
    return {
      error: typeof error === "string" ? error : JSON.stringify(error, null, 2),
    };
  }
};
