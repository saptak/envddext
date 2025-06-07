# Envoy Gateway Docker Desktop Extension

A comprehensive Docker Desktop extension for managing Envoy Gateway resources with an intuitive tabbed interface, GitHub-based templates, HTTP testing tools, and enhanced monitoring capabilities. Built with a robust VM service backend architecture that eliminates Docker Desktop extension limitations.

## Key Features

- **VM Service Backend**: Robust Go backend service that bypasses Docker Desktop extension limitations
- **Full Gateway/HTTPRoute Creation**: Complete YAML generation and kubectl operations via backend
- **LoadBalancer Management**: Robust MetalLB integration, configuration (including auto-detection), and accurate real-time status monitoring (leveraging host CLI for K8s interactions).
- **Reliable Proxy Management**: Process control with PID tracking and proper cleanup
- **Tabbed Interface**: Organized UI with Overview, Templates, Gateway Management, HTTP Testing, and Proxy Manager tabs
- **GitHub Templates Integration**: Apply templates directly from GitHub repositories using the **host's `kubectl`** for enhanced reliability.
- **HTTP Testing Tools**: Built-in HTTP client for testing routes with request/response display
- **Kubectl Proxy Manager**: Integrated proxy management for accessing Kubernetes services
- **Enhanced Monitoring**: Real-time status tracking with detailed deployment information
- **Gateway Management**: Create and configure Gateway resources with form-based UI
- **Template Library**: Access curated Envoy Gateway configurations for common use cases

## Features

### 🎯 Overview Tab
- Real-time cluster status monitoring
- Gateway and HTTPRoute resource overview
- Deployment health indicators
- Quick access to common actions

### 📋 Templates Tab
- Browse templates from GitHub repository
- One-click template application
- Template metadata and descriptions
- Support for multiple use cases (basic HTTP, TLS termination, traffic splitting)

### ⚙️ Gateway Management Tab
- Create Gateway resources with guided forms
- Configure listeners, protocols, and ports
- Real-time status monitoring
- Visual feedback for resource creation

### 🧪 HTTP Testing Tab
- Built-in HTTP client for testing deployed routes
- Support for all HTTP methods (GET, POST, PUT, DELETE, etc.)
- Request/response display with syntax highlighting
- cURL command generation and copy functionality
- Request history and replay capabilities
- Custom headers and request body support

### 🔧 Proxy Manager Tab
- Integrated kubectl proxy management
- One-click proxy start/stop functionality
- Service URL generator for easy access
- Quick access to common service endpoints
- Real-time proxy status monitoring
- Direct integration with HTTP testing tools

### ⚖️ LoadBalancer Manager
- MetalLB LoadBalancer controller integration
- Automatic IP range detection for Docker Desktop
- One-click MetalLB installation and configuration
- Real-time LoadBalancer status and health monitoring
- IP address pool management and visualization
- Support for existing MetalLB installations

### 🔗 GitHub Integration
- Templates stored at [github.com/saptak/envoygatewaytemplates](https://github.com/saptak/envoygatewaytemplates)
- Direct HTTP URL application to kubectl
- Automatic template discovery and categorization
- Community-driven template library

## Current Status

**Latest Update: June 8, 2025** - Further refinements to Gateway creation, LoadBalancer status UI, and MetalLB configuration dialogs for improved reliability and user feedback. VM Service Backend Architecture implemented, with refined Kubernetes interaction patterns (primarily host CLI from frontend services for reliability) and robust LoadBalancer management. All Docker Desktop extension limitations resolved.

### ✅ Completed Features (Iteration 1-5)

#### VM Service Backend Architecture (Iteration 5 ✅)
- **Go Backend Service**: Complete backend rewrite with HTTP API server
- **File System Access**: Full `/tmp/` access and temporary file operations (by backend service)
- **Process Management**: Proper kubectl proxy lifecycle with PID tracking (by backend service)
- **Gateway/HTTPRoute Creation**: Fully functional resource creation, with enhanced reliability due to improved backend kubeconfig handling and clearer frontend error propagation from the backend service.
- **Template Application**: Reliable GitHub template deployment using the **host's `kubectl`** for applying templates from URLs.
- **LoadBalancer Management**: Robust MetalLB integration, including installation (using host CLI for initial manifest with `--validate=false`), configuration (IP range detection, dynamic IPAddressPool/L2Advertisement via backend `/apply-yaml`), and highly accurate real-time status display (using host CLI for all K8s checks). UI for status reporting and MetalLB configuration dialogs significantly improved for clarity and error feedback, resolving issues related to "AddressNotAssigned" Gateways.
- **Docker Desktop Integration**: VM service with Unix socket communication
- **Error Handling**: Comprehensive error reporting from backend to frontend, with specific UI feedback improvements in areas like Gateway creation and LoadBalancer configuration dialogs.

#### Core Infrastructure
- Basic Envoy Gateway installation and status checking
- Gateway and HTTPRoute resource listing and monitoring
- Kubernetes cluster integration with comprehensive error handling

#### Enhanced UI (Iteration 2 ✅)
- **Tabbed Interface**: Overview, Templates, and Gateway Management tabs
- **Responsive Design**: Material-UI components with consistent styling
- **Real-time Updates**: Automatic refresh and status monitoring

#### GitHub Templates Integration (Iteration 2 ✅)
- **Template Repository**: Integration with [github.com/saptak/envoygatewaytemplates](https://github.com/saptak/envoygatewaytemplates)
- **Direct Application**: Apply templates via HTTP URLs to kubectl
- **Metadata-driven**: Template categorization and descriptions
- **Template Library**: Basic HTTP, TLS termination, traffic splitting examples

#### Gateway Management (Iteration 2 ✅)
- **Creation Forms**: Guided Gateway resource creation
- **Validation**: Form validation with real-time feedback
- **Status Monitoring**: Visual indicators for Gateway health
- **Configuration Options**: Protocol, port, and listener configuration

#### Enhanced Monitoring (Iteration 2 ✅)
- **Deployment Tracking**: Real-time pod and service status
- **Issue Detection**: Automatic troubleshooting guidance
- **Visual Indicators**: Pod readiness and deployment health
- **Service Endpoints**: Monitor service accessibility

#### HTTPRoute Management (Iteration 3 ✅)
- **Complete Form-based Creation**: Comprehensive HTTPRoute creation with validation
- **Multiple Routing Rules**: Support for path matching, headers, and query parameters
- **Backend Configuration**: Service selection with weight-based traffic splitting
- **Timeout Configuration**: Request and backend timeout settings
- **Dark Theme Integration**: Complete UI/UX theming for Docker Desktop compatibility
- **Real-time Validation**: Form validation with detailed error messages

#### UI/UX Theming Enhancement (Iteration 3 ✅)
- **Complete Dark Theme**: All form components properly themed for Docker Desktop
- **Professional Design**: Consistent styling with proper contrast and readability
- **Enhanced User Experience**: Light borders, white text, and appropriate hover/focus states
- **Paper Component Fix**: Resolved background issues in form sections

#### HTTP Testing Tools (Iteration 4 ✅)
- **Built-in HTTP Client**: Comprehensive HTTP testing interface with support for all methods
- **Request/Response Display**: Syntax-highlighted request and response viewing
- **cURL Command Generation**: Automatic cURL command generation and copy functionality
- **Request History**: Save and replay previous requests for easy testing
- **Custom Headers**: Support for custom headers and request body configuration
- **Tabbed Interface**: Organized tabs for Request, Response, History, and cURL commands

#### Kubectl Proxy Manager (Iteration 4 ✅)
- **Integrated Proxy Management**: Start/stop kubectl proxy directly from the UI
- **Service URL Generator**: Generate proxy URLs for Kubernetes services
- **Quick Access Endpoints**: Pre-configured common service endpoints
- **Real-time Status**: Live proxy status monitoring and connectivity testing
- **HTTP Client Integration**: Direct integration with HTTP testing tools

### 🚧 Next Iterations (Planned)

#### Iteration 6: Enhanced UI and Visualization
- Resource cards with detailed information
- Visual diagrams showing Gateway and Route relationships
- Resource management actions (delete, refresh, edit)

### 📋 Future Features
- TLS termination configuration and certificate management
- Traffic splitting with weight-based routing
- Rate limiting policies and testing tools
- JWT authentication setup and token management
- Interactive tutorials and contextual help
- Performance optimization and marketplace preparation

## Build and Install

### Quick Install (Recommended)

Use the automated build script that handles the complete build and installation process:

```bash
# Build and install with GitHub templates support
./build-and-install-github-templates.sh
```

This script will:
- Uninstall any existing extension
- Build the extension with GitHub templates integration
- Install the new version
- Restore original files

### Manual Build

```bash
# Build the extension
make build-extension

# Install the extension
docker extension install envoyproxy/envoy-gateway-extension:latest --force
```

### Development Build

For development with hot reloading:

```bash
# Install dependencies
cd ui && npm install

# Start development server
npm start

# In another terminal, build and install
make build-extension
docker extension install envoyproxy/envoy-gateway-extension:latest --force
```

## Development

### Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js and npm for UI development
- Go 1.19+ for backend development

### Project Structure

- `ui/`: React-based frontend with Material-UI components
- `backend/`: Go backend service with HTTP API server  
- `docs/`: Documentation and implementation plans
- `docker-compose.yaml`: VM service configuration
- `Dockerfile`: Multi-stage build for frontend and backend
- `metadata.json`: Docker Desktop extension metadata with VM service setup

## Documentation

For more information about the extension, see the following documents:

- [Extension PRD](docs/envoy_gateway_extension_prd.md)
- [Implementation Plan](docs/envoy_gateway_implementation_plan.md)
- [Use Cases](docs/envoy_gateway_use_cases.md)
- [Docker Desktop Limitations](docs/docker-desktop-limitations.md) - **Now resolved with VM backend!**
- [Troubleshooting Guide](docs/troubleshooting-guide.md)

For more information about Envoy Gateway, see the [Envoy Gateway documentation](https://gateway.envoyproxy.io/docs/).
