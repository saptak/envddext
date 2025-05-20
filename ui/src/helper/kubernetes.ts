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
    "gateways.gateway.envoyproxy.io",
    "-A",
    "-o",
    "json"
  ]);
  if (output?.stderr) {
    return { error: output.stderr };
  }
  try {
    return JSON.parse(output?.stdout || '{}');
  } catch (e) {
    return { error: 'Failed to parse gateways JSON' };
  }
};

export const listEnvoyHTTPRoutes = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "httproutes.gateway.envoyproxy.io",
    "-A",
    "-o",
    "json"
  ]);
  if (output?.stderr) {
    return { error: output.stderr };
  }
  try {
    return JSON.parse(output?.stdout || '{}');
  } catch (e) {
    return { error: 'Failed to parse httproutes JSON' };
  }
};

export const installEnvoyGateway = async (ddClient: v1.DockerDesktopClient, version: string = "latest") => {
  try {
    // Check if the release already exists
    const statusOutput = await ddClient.extension.host?.cli.exec("helm", [
      "status",
      "envoy-gateway"
    ]);
    console.log("Helm status output:", statusOutput);

    // If the release exists (status command does not return "release: not found" in stderr), uninstall it.
    if (statusOutput?.stderr?.includes("release: not found")) {
      console.log("Envoy Gateway release not found, skipping uninstall.");
    } else {
      console.log("Envoy Gateway release found, attempting uninstall.");
      const uninstallOutput = await ddClient.extension.host?.cli.exec("helm", [
        "uninstall",
        "envoy-gateway"
      ]);
      console.log("Helm uninstall output:", uninstallOutput);

      // Check for errors during uninstall, ignoring "release: not found" which shouldn't happen here but as a safeguard.
      if (uninstallOutput?.stderr && !uninstallOutput.stderr.includes("release: not found")) {
        return { error: uninstallOutput.stderr };
      }
    }

    // Add the Envoy Gateway Helm repository
    const repoAddOutput = await ddClient.extension.host?.cli.exec("helm", [
      "repo",
      "add",
      "envoy-gateway",
      "https://envoyproxy.github.io/envoy-gateway-helm"
    ]);
    console.log("Helm repo add output:", repoAddOutput);

    if (repoAddOutput?.stderr) {
      return { error: repoAddOutput.stderr };
    }

    // Update Helm repositories
    const repoUpdateOutput = await ddClient.extension.host?.cli.exec("helm", [
      "repo",
      "update"
    ]);
    console.log("Helm repo update output:", repoUpdateOutput);

    if (repoUpdateOutput?.stderr) {
      return { error: repoUpdateOutput.stderr };
    }

    // Install Envoy Gateway using Helm
    const installOutput = await ddClient.extension.host?.cli.exec("helm", [
      "install",
      "envoy-gateway",
      "envoy-gateway/envoy-gateway",
      "--version",
      version === "latest" ? "v0.0.0-latest" : version,
      "--set",
      "installCRDs=true",
      "--wait",
      "--debug"
    ]);
    console.log("Helm install output:", installOutput);

    if (installOutput?.stderr && installOutput.stderr.startsWith('Error: ')) {
      return { error: installOutput.stderr };
    }

    // Verify CRDs are installed
    const crdCheck = await checkEnvoyGatewayCRDs(ddClient);
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
    const output = await ddClient.extension.host?.cli.exec("kubectl", [
      "api-resources",
    ]);
    if (output?.stderr) {
      console.error("Error checking for CRDs:", output.stderr);
      return false;
    }
    console.log("CRD check output:", output?.stdout);
    // Check if the output contains the specific CRD name
    return output?.stdout?.includes("gateways.gateway.envoyproxy.io") || false;
  } catch (e) {
    console.error("Error executing kubectl api-resources:", e);
    return false;
  }
};
