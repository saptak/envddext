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
 * Apply a template to the Kubernetes cluster
 * @param ddClient Docker Desktop client
 * @param template Template to apply
 */
export const applyTemplate = async (
  ddClient: v1.DockerDesktopClient,
  template: Template
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Apply each resource in the template
    for (const resource of template.resources) {
      // Create a temporary file with the resource YAML
      const tempFile = `/tmp/resource-${Date.now()}.yaml`;
      
      // Write the resource to the temp file
      await ddClient.extension.host?.cli.exec("sh", [
        "-c",
        `cat > ${tempFile} << 'EOF'
${resource}
EOF`
      ]);
      
      // Apply the resource
      const result = await ddClient.extension.host?.cli.exec("kubectl", [
        "apply",
        "-f",
        tempFile
      ]);
      
      // Check for errors
      if (result?.stderr && !result.stderr.includes('configured')) {
        return { success: false, error: result.stderr };
      }
      
      // Clean up the temp file
      await ddClient.extension.host?.cli.exec("rm", [tempFile]);
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
