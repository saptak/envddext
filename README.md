# Envoy Gateway Docker Desktop Extension

A comprehensive Docker Desktop extension for managing Envoy Gateway resources with an intuitive visual interface, GitHub-based templates, HTTP testing tools, and enhanced resource visualization. Built with a robust VM service backend architecture that eliminates Docker Desktop extension limitations.

## Key Features

- **VM Service Backend**: Robust Go backend service that bypasses Docker Desktop extension limitations
- **Gateway Creation & Management**: Create and delete Gateway resources with form-based UI and real-time status monitoring
- **HTTPRoute Creation & Management**: Create and delete HTTPRoute resources with advanced path matching, header/query parameter support, and backend service configuration
- **LoadBalancer Management**: Robust MetalLB integration, configuration (including auto-detection), and accurate real-time status monitoring
- **Reliable Proxy Management**: Process control with PID tracking and proper cleanup
- **Responsive Tabbed Interface**: Organized UI with Overview, Templates, Gateway Management, HTTPRoute Management, HTTP Testing, and Proxy Manager tabs with horizontal scrolling support
- **GitHub Templates Integration**: Apply basic HTTP routing templates directly from GitHub repositories
- **HTTP Testing Tools**: Built-in HTTP client for testing routes with request/response display
- **Kubectl Proxy Manager**: Integrated proxy management for accessing Kubernetes services
- **Enhanced Monitoring**: Real-time status tracking with detailed deployment information
- **Visual Resource Management**: Interactive resource cards with relationship visualization and management actions
- **Template Library**: Access curated basic routing configurations for common HTTP use cases

## Current Limitations

- **No Resource Editing**: Can create and delete but not modify existing Gateways or HTTPRoutes
- **No Policy Management**: Security policies, rate limiting, and traffic policies not yet supported  
- **HTTP Only**: Limited to HTTP/HTTPS routing (no TCP, UDP, or gRPC support)
- **Basic TLS**: Limited TLS configuration capabilities
- **No Advanced Envoy Features**: EnvoyProxy custom resources and patches not supported

## Features

### 🎯 Resources Tab (Enhanced in v0.6.0)
- **Visual Resource Cards**: Professional cards displaying Gateway and HTTPRoute information with status indicators
- **Resource Visualization**: Interactive relationship mapping showing Gateway → HTTPRoute connections
- **Resource Management**: Delete resources, view YAML configurations, and refresh status
- **Status Monitoring**: Real-time status with color-coded health indicators and detailed information
- **Connection Flow**: Visual representation of traffic flow from Gateways through routes to services

### 📋 Templates Tab
- Browse templates from GitHub repository
- One-click template application
- Template metadata and descriptions
- Support for multiple use cases (basic HTTP, TLS termination, traffic splitting)

### ⚙️ Gateway Management Tab
- Create and delete Gateway resources with guided forms
- Configure listeners, protocols, and ports
- Create and delete HTTPRoute resources with advanced routing rules
- Real-time status monitoring for all resources
- Visual feedback for resource creation and deletion

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

**Latest Update: June 11, 2025** - **v0.6.0 "Visual Gateway Management" Release Complete!** Major milestone with Iteration 4 completion featuring enhanced resource visualization, professional UI cards, and comprehensive resource management actions. The Resources tab has been completely redesigned with interactive resource cards, relationship visualization, and click-to-manage functionality. All HTTPRoute creation, Gateway management, and LoadBalancer features remain stable and enhanced.

### ✅ Completed Features (Iteration 1-5)

#### VM Service Backend Architecture (Iteration 5 ✅)
- **Go Backend Service**: Complete backend rewrite with HTTP API server
- **File System Access**: Full `/tmp/` access and temporary file operations (by backend service)
- **Process Management**: Proper kubectl proxy lifecycle with PID tracking (by backend service)
- **Gateway/HTTPRoute Creation**: Fully functional resource creation. Enhanced reliability due to improved backend kubeconfig handling, clearer frontend error propagation, and correct frontend interpretation of backend success responses (resolving misleading UI errors for successful or idempotent operations).
- **Template Application**: Reliable GitHub template deployment using the **host's `kubectl`** for applying templates from URLs.
- **LoadBalancer Management**: Robust MetalLB integration, including installation (using host CLI for initial manifest with `--validate=false`), configuration (IP range detection, dynamic IPAddressPool/L2Advertisement via backend `/apply-yaml`), and highly accurate real-time status display (using host CLI for all K8s checks). UI for status reporting and MetalLB configuration dialogs significantly improved for clarity and error feedback, resolving issues related to "AddressNotAssigned" Gateways.
- **Docker Desktop Integration**: VM service with Unix socket communication
- **Error Handling**: Comprehensive error reporting from backend to frontend. Specific UI feedback improvements in Gateway creation and LoadBalancer configuration dialogs, including fixing misleading UI error messages for operations that succeeded.

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

#### HTTPRoute Management (Iteration 3 ✅) - Enhanced June 11, 2025
- **Complete Form-based Creation**: Comprehensive HTTPRoute creation with validation
- **Multiple Routing Rules**: Support for path matching, headers, and query parameters
- **Backend Configuration**: Service selection with weight-based traffic splitting
- **Timeout Configuration**: Request and backend timeout settings
- **Dark Theme Integration**: Complete UI/UX theming for Docker Desktop compatibility
- **Real-time Validation**: Form validation with detailed error messages and proper error clearing
- **Form Auto-Close**: Forms automatically close after successful HTTPRoute creation
- **Clean UI**: Debug information removed for production-ready user experience
- **Namespace Support**: Proper 'demo' namespace detection alongside 'default'

#### UI/UX Theming Enhancement (Iteration 3 ✅) - Enhanced June 11, 2025
- **Complete Dark Theme**: All form components properly themed for Docker Desktop
- **Professional Design**: Consistent styling with proper contrast and readability
- **Enhanced User Experience**: Light borders, white text, and appropriate hover/focus states
- **Paper Component Fix**: Resolved background issues in form sections
- **Responsive Design**: Scrollable tabs for narrow screens and mobile devices
- **Improved Navigation**: Auto-scrolling tabs with navigation arrows when needed

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

#### Enhanced UI and Resource Management (Iteration 4 ✅) - **v0.6.0 Complete - June 11, 2025**
- **Professional Resource Cards**: Rich visual cards with status indicators, avatars, detailed Gateway/HTTPRoute information
- **Interactive Resource Visualization**: Card-based layout showing Gateway → HTTPRoute relationships with connection mapping
- **Resource Management Actions**: Click-to-delete with confirmation dialogs, view YAML configurations, and refresh capabilities
- **Enhanced Visual Design**: Material-UI theming, hover effects, professional styling matching Docker Desktop
- **Status Legend**: Comprehensive legend explaining all visual indicators and connection types
- **Empty State Guidance**: Helpful instructions when no resources exist with clear next steps

### 🚧 Next Iterations (Planned)

#### Iteration 5: TLS Termination Example  
- Certificate generation for testing purposes
- HTTPS Gateway configuration with TLS termination
- Enhanced HTTP client with HTTPS support

### 📋 Planned Features (Roadmap)

#### Next Priority: Resource Management
- **Resource Editing**: Update existing Gateway and HTTPRoute configurations
- **Resource Cloning**: Duplicate and modify existing resources
- **Bulk Operations**: Multi-resource management capabilities

#### Future: Policy Management
- **Security Policies**: JWT authentication, authorization, and access control
- **Traffic Policies**: Rate limiting, circuit breakers, and retry policies  
- **TLS Management**: Advanced certificate management and rotation
- **Backend Policies**: Load balancing, health checking, and failover

#### Advanced Features
- **Multi-Protocol Support**: TCP, UDP, and gRPC routing configuration
- **EnvoyProxy Resources**: Custom Envoy configuration and patches
- **Observability Integration**: Metrics, tracing, and logging visualization
- **Interactive Tutorials**: Guided learning experiences for complex scenarios

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
