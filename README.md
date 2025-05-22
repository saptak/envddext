# Envoy Gateway Docker Desktop Extension

This extension allows you to manage and observe Envoy Gateway resources in your local Kubernetes cluster directly from Docker Desktop.

- View Gateways and Routes
- Quick setup for Envoy Gateway with guided workflows
- Template library for common Gateway API configurations
- Apply templates directly from GitHub repositories

## Features

### Envoy Gateway Management

- Install and manage Envoy Gateway in your Kubernetes cluster
- View Gateway and HTTPRoute resources
- Monitor the status of your Envoy Gateway installation

### Quick Start Wizard

- Access guided workflows for common Envoy Gateway use cases
- Deploy sample applications with pre-configured Gateway resources
- Learn Envoy Gateway concepts through interactive examples

### GitHub Templates

- Apply Envoy Gateway templates directly from GitHub repositories
- Use templates from the community or your own repositories
- Streamlined workflow for applying common Gateway API configurations

## Current Status

This extension is currently in active development. The following features are implemented:

### ✅ Completed Features
- Basic Envoy Gateway installation and status checking
- Gateway and HTTPRoute resource listing
- Template-based deployment system with GitHub integration
- Quick start dialog with common templates
- Apply templates from GitHub URLs
- Real-time deployment status monitoring
- Automatic UI refresh after template application
- **Enhanced Deployment Monitoring** (Task 2.1 ✅):
  - Detailed pod status monitoring with container information
  - Real-time status updates with configurable refresh intervals
  - Automatic issue detection and troubleshooting guidance
  - Visual indicators for pod readiness and deployment health
  - Tabbed UI interface for better organization
  - Service endpoint monitoring

### 🚧 In Progress
- Gateway and HTTPRoute creation forms (Task 2.2)
- HTTP client for testing routes (Task 2.4)

### 📋 Planned Features
- TLS termination configuration
- Traffic splitting examples
- Rate limiting configuration
- JWT authentication setup
- Interactive tutorials and documentation
- Resource visualization and management tools

## Build and Install

```bash
# Build the extension
make build-extension

# Install the extension
docker extension install saptak/envoy-gateway-extension:latest --force
```

This will use the image name `saptak/envoy-gateway-extension:latest`.

## Development

### Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js and npm for UI development

### Project Structure

- `ui/`: React-based frontend
- `docs/`: Documentation and implementation plans
- `Dockerfile`: Multi-stage build for the extension

## Documentation

For more information about the extension, see the following documents:

- [Extension PRD](docs/envoy_gateway_extension_prd.md)
- [Implementation Plan](docs/envoy_gateway_implementation_plan.md)
- [Use Cases](docs/envoy_gateway_use_cases.md)

For more information about Envoy Gateway, see the [Envoy Gateway documentation](https://gateway.envoyproxy.io/docs/).
