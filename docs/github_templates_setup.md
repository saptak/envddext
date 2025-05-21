# Setting Up GitHub Templates for Envoy Gateway Extension

This document explains how to set up a GitHub repository to host templates for the Envoy Gateway Docker Desktop Extension.

## Overview

The Envoy Gateway extension can now apply Kubernetes templates directly from GitHub URLs. This approach has several advantages:

1. Avoids issues with local file paths
2. Makes it easier to maintain and update templates
3. Allows for community contributions
4. Simplifies template versioning

## Repository Structure

Create a GitHub repository with the following structure:

```
/templates
  /basic-http
    /echo-service.yaml
  /tls-termination
    /tls-termination.yaml
  /traffic-splitting
    /traffic-splitting.yaml
  /index.json  # Metadata about all available templates
```

## Template Index File

The `index.json` file should contain metadata about all available templates:

```json
[
  {
    "id": "basic-http-echo",
    "name": "Basic HTTP Echo Service",
    "description": "Deploy a simple echo service with HTTP routing through Envoy Gateway",
    "category": "basic-http",
    "difficulty": "beginner",
    "yamlUrl": "https://raw.githubusercontent.com/your-github-username/envoy-gateway-templates/main/templates/basic-http/echo-service.yaml"
  },
  {
    "id": "tls-termination",
    "name": "TLS Termination",
    "description": "Secure your services with HTTPS using TLS termination at the Gateway",
    "category": "tls",
    "difficulty": "intermediate",
    "yamlUrl": "https://raw.githubusercontent.com/your-github-username/envoy-gateway-templates/main/templates/tls-termination/tls-termination.yaml"
  },
  {
    "id": "traffic-splitting",
    "name": "Traffic Splitting",
    "description": "Route traffic to multiple versions of a service with weighted routing",
    "category": "traffic-splitting",
    "difficulty": "intermediate",
    "yamlUrl": "https://raw.githubusercontent.com/your-github-username/envoy-gateway-templates/main/templates/traffic-splitting/traffic-splitting.yaml"
  }
]
```

Make sure to replace `your-github-username` with your actual GitHub username.

## Template YAML Files

Each template should be a complete YAML file that can be applied directly with `kubectl apply -f`. For example:

```yaml
# Echo Service Template
# This template deploys a simple echo service with HTTP routing through Envoy Gateway

# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: demo
---
# Echo Service Deployment
apiVersion: apps/v1
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
        - containerPort: 8080
---
# Echo Service
apiVersion: v1
kind: Service
metadata:
  name: echo-service
  namespace: demo
spec:
  selector:
    app: echo-service
  ports:
  - port: 80
    targetPort: 8080
---
# Gateway
apiVersion: gateway.networking.k8s.io/v1
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
        from: Same
---
# HTTPRoute
apiVersion: gateway.networking.k8s.io/v1
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
      port: 80
```

## Updating the Extension

After setting up the GitHub repository, update the extension code:

1. Update the `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` constants in `githubTemplateService.ts` to point to your repository.
2. Build and install the extension.

## Testing

To test the GitHub templates:

1. Open Docker Desktop
2. Navigate to the Envoy Gateway extension
3. Click "Quick Start"
4. Select a template
5. Click "Apply Directly" to apply the template directly from GitHub

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Verify that the GitHub repository is public and accessible
3. Make sure the raw URLs are correct
4. Check that the YAML files are valid and can be applied with kubectl
