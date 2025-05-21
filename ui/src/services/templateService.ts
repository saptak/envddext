import { v1 } from "@docker/extension-api-client-types";

// Template metadata interface
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Template interface
export interface Template {
  metadata: TemplateMetadata;
  resources: string[]; // Array of YAML resources
}

// Available templates
const templates: Record<string, TemplateMetadata> = {
  'basic-http-echo': {
    id: 'basic-http-echo',
    name: 'Basic HTTP Echo Service',
    description: 'Deploy a simple echo service with HTTP routing through Envoy Gateway',
    category: 'basic-http',
    difficulty: 'beginner'
  },
  'tls-termination': {
    id: 'tls-termination',
    name: 'TLS Termination',
    description: 'Secure your services with HTTPS using TLS termination at the Gateway',
    category: 'tls',
    difficulty: 'intermediate'
  },
  'traffic-splitting': {
    id: 'traffic-splitting',
    name: 'Traffic Splitting',
    description: 'Route traffic to multiple versions of a service with weighted routing',
    category: 'traffic-splitting',
    difficulty: 'intermediate'
  }
};

/**
 * Get all available templates metadata
 */
export const getTemplatesMetadata = (): TemplateMetadata[] => {
  return Object.values(templates);
};

/**
 * Get template metadata by ID
 * @param id Template ID
 */
export const getTemplateMetadata = (id: string): TemplateMetadata | undefined => {
  return templates[id];
};

/**
 * Load a template by ID
 * @param id Template ID
 */
export const loadTemplate = async (id: string): Promise<Template | null> => {
  const metadata = templates[id];
  if (!metadata) {
    return null;
  }

  try {
    // For now, we'll hardcode the template resources based on ID
    // In a more advanced implementation, these could be loaded from files
    let resources: string[] = [];

    if (id === 'basic-http-echo') {
      resources = [
        // Namespace
        `apiVersion: v1
kind: Namespace
metadata:
  name: demo`,

        // Echo Service Deployment
        `apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo-service
  namespace: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo-service
  template:
    metadata:
      labels:
        app: echo-service
    spec:
      containers:
      - name: echo-service
        image: ealen/echo-server:latest
        ports:
        - containerPort: 8080`,

        // Echo Service
        `apiVersion: v1
kind: Service
metadata:
  name: echo-service
  namespace: demo
spec:
  selector:
    app: echo-service
  ports:
  - port: 80
    targetPort: 8080`,

        // Gateway
        `apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: demo-gateway
  namespace: demo
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Same`,

        // HTTPRoute
        `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: echo-route
  namespace: demo
spec:
  parentRefs:
  - name: demo-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: echo-service
      port: 80`
      ];
    }

    return {
      metadata,
      resources
    };
  } catch (error) {
    console.error(`Error loading template ${id}:`, error);
    return null;
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

      // Create a temporary file in the extension container
      const tempFile = "/tmp/gatewayclass.yaml";

      // Write the YAML to the temporary file
      await ddClient.extension.host?.cli.exec("sh", [
        "-c",
        `echo '${gatewayClassYaml.replace(/'/g, "'\\''")}' > ${tempFile}`
      ]);

      // Apply the resource from the temporary file
      const applyResult = await ddClient.extension.host?.cli.exec("kubectl", [
        "apply", "-f", tempFile
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
          error: "Failed to verify GatewayClass creation. The GatewayClass was not found after creation attempt."
        };
      }
    } else {
      console.log("GatewayClass 'envoy-gateway' already exists");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error ensuring GatewayClass:", error);
    const errorMessage = typeof error === 'string'
      ? error
      : error?.message || JSON.stringify(error, null, 2);
    return {
      success: false,
      error: `Failed to ensure GatewayClass: ${errorMessage}`
    };
  }
};

/**
 * Apply a template to the Kubernetes cluster
 * @param ddClient Docker Desktop client
 * @param template Template to apply
 */
export const applyTemplate = async (
  ddClient: v1.DockerDesktopClient,
  template: Template
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, ensure the GatewayClass exists
    const gcResult = await ensureGatewayClass(ddClient);
    if (!gcResult.success) {
      return gcResult;
    }

    // Apply each resource in the template
    for (const resource of template.resources) {
      console.log(`Attempting to apply resource using kubectl apply -f -:`);

      try {
        // Apply the resource using kubectl apply
        console.log(`Applying resource via kubectl apply`);

        // First, determine the resource kind and name for better error messages
        let kind = "unknown";
        let name = "unknown";
        let namespace = "default";

        try {
          // Try to extract kind and name from the YAML
          if (resource.includes('kind:')) {
            kind = resource.split('kind:')[1].trim().split(/\s/)[0];
          }
          if (resource.includes('name:')) {
            name = resource.split('name:')[1].trim().split(/\s/)[0];
          }
          if (resource.includes('namespace:')) {
            namespace = resource.split('namespace:')[1].trim().split(/\s/)[0];
          }

          console.log(`Applying ${kind} ${namespace}/${name}`);

          // Apply the resource using kubectl apply
          console.log(`Applying resource using kubectl apply`);

          // Create a temporary file in the extension container
          const tempFile = `/tmp/resource-${Math.floor(Math.random() * 1000000)}.yaml`;

          console.log(`Creating temporary file at ${tempFile}`);

          // Write the YAML to the temporary file
          await ddClient.extension.host?.cli.exec("sh", [
            "-c",
            `echo '${resource.replace(/'/g, "'\\''")}' > ${tempFile}`
          ]);

          console.log(`Applying resource from ${tempFile}`);

          // Apply the resource from the temporary file
          const applyResult = await ddClient.extension.host?.cli.exec("kubectl", [
            "apply", "-f", tempFile
          ]);

          console.log(`Cleaning up temporary file ${tempFile}`);

          // Clean up the temporary file
          await ddClient.extension.host?.cli.exec("rm", [tempFile]);

          console.log(`kubectl apply result:`, applyResult);

          // Check for errors
          if (applyResult?.stderr &&
              !applyResult.stderr.includes('configured') &&
              !applyResult.stderr.includes(' unchanged') &&
              !applyResult.stderr.includes(' created')) {
            return { success: false, error: applyResult.stderr };
          }
        } catch (innerErr: any) {
          console.error("Inner error applying resource:", innerErr);
          return {
            success: false,
            error: typeof innerErr === 'string' ? innerErr : JSON.stringify(innerErr, null, 2)
          };
        }
      } catch (err: any) {
        console.error("Error applying resource:", err);
        return {
          success: false,
          error: typeof err === 'string' ? err : JSON.stringify(err, null, 2)
        };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error applying template:", error);
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

    try {
      // Parse namespace JSON to check its status
      const nsJson = JSON.parse(nsOutput.stdout);
      console.log("Namespace status:", nsJson.status);

      // Check if namespace is active
      if (nsJson.status?.phase !== 'Active') {
        return {
          status: 'pending',
          message: `Namespace status: ${nsJson.status?.phase || 'Unknown'}`
        };
      }
    } catch (e) {
      console.error("Error parsing namespace JSON:", e);
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

    return { status: 'ready', message: 'All resources deployed successfully' };
  } catch (error: any) {
    console.error("Error checking deployment status:", error);
    return {
      status: 'failed',
      message: typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    };
  }
};
