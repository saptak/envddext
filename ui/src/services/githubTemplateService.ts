import { v1 } from "@docker/extension-api-client-types";

// Template metadata interface
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  yamlUrl: string; // URL to the raw YAML file
}

// Template interface
export interface Template {
  metadata: TemplateMetadata;
  yamlContent: string; // The raw YAML content
}

// GitHub repository information
const GITHUB_REPO_OWNER = "saptak"; // GitHub username
const GITHUB_REPO_NAME = "envoygatewaytemplates";
const GITHUB_BRANCH = "main";

// Base URL for raw GitHub content
const GITHUB_RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}`;

// URL to the template index file
const TEMPLATE_INDEX_URL = `${GITHUB_RAW_BASE_URL}/templates/index.json`;

// Available templates (fallback if GitHub fetch fails)
const fallbackTemplates: Record<string, TemplateMetadata> = {
  'basic-http-echo': {
    id: 'basic-http-echo',
    name: 'Basic HTTP Echo Service',
    description: 'Deploy a simple echo service with HTTP routing through Envoy Gateway',
    category: 'basic-http',
    difficulty: 'beginner',
    yamlUrl: `${GITHUB_RAW_BASE_URL}/templates/basic-http/echo-service.yaml`
  },
  'tls-termination': {
    id: 'tls-termination',
    name: 'TLS Termination',
    description: 'Secure your services with HTTPS using TLS termination at the Gateway',
    category: 'tls',
    difficulty: 'intermediate',
    yamlUrl: `${GITHUB_RAW_BASE_URL}/templates/tls-termination/tls-termination.yaml`
  },
  'traffic-splitting': {
    id: 'traffic-splitting',
    name: 'Traffic Splitting',
    description: 'Route traffic to multiple versions of a service with weighted routing',
    category: 'traffic-splitting',
    difficulty: 'intermediate',
    yamlUrl: `${GITHUB_RAW_BASE_URL}/templates/traffic-splitting/traffic-splitting.yaml`
  }
};

/**
 * Fetch templates metadata from GitHub
 */
export const fetchTemplatesMetadata = async (): Promise<TemplateMetadata[]> => {
  try {
    // Fetch the template index from GitHub
    const response = await fetch(TEMPLATE_INDEX_URL);
    if (!response.ok) {
      console.warn(`Failed to fetch templates from GitHub: ${response.statusText}`);
      return Object.values(fallbackTemplates);
    }

    const templates = await response.json();
    return templates;
  } catch (error) {
    console.error('Error fetching templates from GitHub:', error);
    // Return fallback templates if GitHub fetch fails
    return Object.values(fallbackTemplates);
  }
};

/**
 * Load a template by ID
 * @param id Template ID
 */
export const loadTemplate = async (id: string): Promise<Template | null> => {
  try {
    // First, get the template metadata
    const templates = await fetchTemplatesMetadata();
    const metadata = templates.find(t => t.id === id);

    if (!metadata) {
      console.error(`Template with ID ${id} not found`);
      return null;
    }

    // Fetch the YAML content from GitHub
    const response = await fetch(metadata.yamlUrl);
    if (!response.ok) {
      console.error(`Failed to fetch template YAML from GitHub: ${response.statusText}`);
      return null;
    }

    const yamlContent = await response.text();

    return {
      metadata,
      yamlContent
    };
  } catch (error) {
    console.error(`Error loading template ${id}:`, error);
    return null;
  }
};



/**
 * Apply a template directly from a GitHub URL
 * @param ddClient Docker Desktop client
 * @param url URL to the raw YAML file
 */
export const applyTemplateFromUrl = async (
  ddClient: v1.DockerDesktopClient,
  url: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, ensure the GatewayClass exists
    const gcResult = await ensureGatewayClass(ddClient);
    if (!gcResult.success) {
      return gcResult;
    }

    // Apply the template directly from the URL
    console.log(`Applying template directly from URL: ${url}`);

    try {
      // Apply the YAML directly from the URL using kubectl apply
      console.log(`Running kubectl apply -f ${url}`);

      const applyResult = await ddClient.extension.host?.cli.exec("kubectl", [
        "apply", "-f", url
      ]);

      console.log(`kubectl apply result:`, applyResult);

      // Check for errors
      if (applyResult?.stderr &&
          !applyResult.stderr.includes('configured') &&
          !applyResult.stderr.includes(' unchanged') &&
          !applyResult.stderr.includes(' created')) {
        return {
          success: false,
          error: applyResult.stderr
        };
      }

      return { success: true };
    } catch (fetchError: any) {
      console.error("Error fetching template from URL:", fetchError);
      return {
        success: false,
        error: `Failed to fetch template from URL: ${typeof fetchError === 'string' ? fetchError : JSON.stringify(fetchError, null, 2)}`
      };
    }
  } catch (error: any) {
    console.error("Error applying template from URL:", error);
    return {
      success: false,
      error: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

/**
 * Check if GatewayClass exists and create it if it doesn't
 * @param ddClient Docker Desktop client
 */
export const ensureGatewayClass = async (
  ddClient: v1.DockerDesktopClient
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Checking if GatewayClass 'envoy-gateway' exists...");

    // First, check if the Gateway API CRDs are installed
    const crdOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "crd",
      "gatewayclasses.gateway.networking.k8s.io",
      "--ignore-not-found"
    ]);

    if (!crdOutput?.stdout || crdOutput.stdout.trim() === "") {
      console.error("Gateway API CRDs not found");
      return {
        success: false,
        error: "Gateway API CRDs are not installed. Please make sure Envoy Gateway is properly installed."
      };
    }

    // Check if GatewayClass exists
    const gcOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gatewayclass",
      "envoy-gateway",
      "--ignore-not-found"
    ]);

    // If GatewayClass doesn't exist, create it
    if (!gcOutput?.stdout || gcOutput.stdout.trim() === "") {
      console.log("GatewayClass 'envoy-gateway' not found, creating it...");

      const gatewayClassYaml = `apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy-gateway
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller`;

      // Apply the GatewayClass using kubectl apply
      console.log(`Applying GatewayClass using kubectl apply`);

      // Apply the GatewayClass directly from a URL
      // Use a raw GitHub URL to the GatewayClass YAML from your repository
      const gatewayClassUrl = "https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/gatewayclass.yaml";
      console.log(`Applying GatewayClass from URL: ${gatewayClassUrl}`);

      // Apply the resource directly from the URL
      const applyResult = await ddClient.extension.host?.cli.exec("kubectl", [
        "apply", "-f", gatewayClassUrl
      ]);

      console.log("GatewayClass creation result:", applyResult);

      // Check for errors
      if (applyResult?.stderr &&
          !applyResult.stderr.includes('configured') &&
          !applyResult.stderr.includes(' unchanged') &&
          !applyResult.stderr.includes(' created')) {
        return {
          success: false,
          error: `Failed to create GatewayClass: ${applyResult.stderr || "Unknown error"}`
        };
      }

      // Verify the GatewayClass was created
      const verifyOutput = await ddClient.extension.host?.cli.exec("kubectl", [
        "get",
        "gatewayclass",
        "envoy-gateway",
        "--ignore-not-found"
      ]);

      if (!verifyOutput?.stdout || verifyOutput.stdout.trim() === "") {
        return {
          success: false,
          error: "Failed to verify GatewayClass creation"
        };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error ensuring GatewayClass:", error);
    return {
      success: false,
      error: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};

/**
 * Check deployment status for a template
 * @param ddClient Docker Desktop client
 * @param template Template to check status for
 */
export const checkDeploymentStatus = async (
  ddClient: v1.DockerDesktopClient,
  _template: Template // Using underscore to indicate unused parameter
): Promise<{ status: 'pending' | 'ready' | 'failed'; message?: string }> => {
  try {
    // Check GatewayClass first
    const gcOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gatewayclass",
      "envoy-gateway",
      "--ignore-not-found"
    ]);

    if (!gcOutput?.stdout || gcOutput.stdout.trim() === "") {
      console.log("GatewayClass 'envoy-gateway' not found");
      return {
        status: 'failed',
        message: 'GatewayClass "envoy-gateway" not found. This is required for the Gateway to function.'
      };
    }

    // Check namespace
    const nsOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "namespace",
      "demo",
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    if (!nsOutput?.stdout || nsOutput.stdout.trim() === "") {
      console.log("Namespace 'demo' not found");
      return { status: 'pending', message: 'Namespace not created yet' };
    }

    // Check deployment
    const deployOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "deployment",
      "-n",
      "demo",
      "echo-service",
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    if (!deployOutput?.stdout || deployOutput.stdout.trim() === "") {
      console.log("Deployment 'echo-service' not found");
      return { status: 'pending', message: 'Deployment not created yet' };
    }

    try {
      const deployment = JSON.parse(deployOutput.stdout);
      const availableReplicas = deployment.status?.availableReplicas || 0;
      const desiredReplicas = deployment.spec?.replicas || 0;
      console.log(`Deployment replicas: ${availableReplicas}/${desiredReplicas}`);

      if (availableReplicas < desiredReplicas) {
        return {
          status: 'pending',
          message: `Deployment in progress: ${availableReplicas}/${desiredReplicas} replicas ready`
        };
      }
    } catch (e) {
      console.error("Error parsing deployment JSON:", e);
      return { status: 'pending', message: 'Error checking deployment status' };
    }

    // Check service
    const svcOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "service",
      "-n",
      "demo",
      "echo-service",
      "--no-headers",
      "--ignore-not-found"
    ]);

    if (!svcOutput?.stdout || svcOutput.stdout.trim() === "") {
      console.log("Service 'echo-service' not found");
      return { status: 'pending', message: 'Service not created yet' };
    }

    // Check gateway
    const gwOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "gateway",
      "-n",
      "demo",
      "demo-gateway",
      "-o",
      "json",
      "--ignore-not-found"
    ]);

    if (!gwOutput?.stdout || gwOutput.stdout.trim() === "") {
      console.log("Gateway 'demo-gateway' not found");
      return { status: 'pending', message: 'Gateway not created yet' };
    }

    // Check Gateway status
    try {
      const gateway = JSON.parse(gwOutput.stdout);
      const conditions = gateway.status?.conditions || [];

      // Check if Gateway is programmed
      const programmedCondition = conditions.find((c: any) => c.type === 'Programmed');
      if (programmedCondition && programmedCondition.status !== 'True') {
        return {
          status: 'pending',
          message: `Gateway not ready: ${programmedCondition.message || 'Waiting for controller'}`
        };
      }
    } catch (e) {
      console.error("Error parsing gateway JSON:", e);
    }

    // Check HTTPRoute
    const routeOutput = await ddClient.extension.host?.cli.exec("kubectl", [
      "get",
      "httproute",
      "-n",
      "demo",
      "echo-route",
      "--no-headers",
      "--ignore-not-found"
    ]);

    if (!routeOutput?.stdout || routeOutput.stdout.trim() === "") {
      console.log("HTTPRoute 'echo-route' not found");
      return { status: 'pending', message: 'HTTPRoute not created yet' };
    }

    // All checks passed
    return { status: 'ready' };
  } catch (error: any) {
    console.error("Error checking deployment status:", error);
    return {
      status: 'failed',
      message: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};
