import { v1 } from "@docker/extension-api-client-types";

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
