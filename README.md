# Envoy Gateway Docker Desktop Extension

A comprehensive Docker Desktop extension for managing Envoy Gateway resources with an intuitive visual interface, GitHub-based templates, HTTP testing tools, and enhanced resource visualization. Built with a robust VM service backend architecture that eliminates Docker Desktop extension limitations.

## Key Features

- **VM Service Backend**: Robust Go backend service that bypasses Docker Desktop extension limitations
- **Gateway Creation & Management**: Create and delete Gateway resources with form-based UI and real-time status monitoring
- **HTTPRoute Creation & Management**: Create and delete HTTPRoute resources with advanced path matching, header/query parameter support, and backend service configuration
- **TLS Certificate Management**: Comprehensive TLS termination support with certificate generation, management, and HTTPS testing
- **LoadBalancer Management**: Robust MetalLB integration, configuration (including auto-detection), and accurate real-time status monitoring
- **Reliable Proxy Management**: Process control with PID tracking and proper cleanup
- **Responsive Tabbed Interface**: Organized UI with Resources, Gateway Management, HTTPRoute Management, Deployment Status, Testing & Proxy, and TLS Management tabs with horizontal scrolling support
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

### 🧪 Testing & Proxy Tab
- **Proxy Manager**: Integrated kubectl proxy management with one-click start/stop functionality
- **HTTP Testing**: Built-in HTTP client for testing deployed routes with all HTTP methods
- **HTTPS Support**: Advanced TLS options for testing secure connections with certificate verification controls
- **Request/Response Display**: Syntax highlighting and comprehensive response analysis
- **cURL Generation**: Automatic cURL command generation and copy functionality with TLS options
- **Request History**: Save and replay previous requests for easy testing
- **Service Integration**: Direct proxy-to-testing workflow for seamless endpoint validation

### 🔐 TLS Management Tab (Enhanced in v0.6.0)
- **Automatic Prerequisite Detection**: Intelligent cert-manager CRD checking and installation status monitoring
- **One-Click Cert-manager Installation**: Automated cert-manager v1.14.5 installation with comprehensive error handling
- **Certificate Generation**: Create self-signed certificates for testing and development
- **Certificate Lifecycle**: View, manage, and delete TLS certificates with status monitoring
- **Prerequisite Validation**: Prevents certificate operations until cert-manager is properly installed
- **Issuer Management**: Support for self-signed and custom CA issuers with automatic issuer creation
- **DNS Configuration**: Multi-domain certificate support with dynamic DNS name management
- **Gateway Integration**: Seamless certificate selection during Gateway creation
- **Security Indicators**: Clear visual feedback for certificate status, expiration, and system readiness
- **Installation Progress**: Real-time feedback during cert-manager installation with toast notifications

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

**Latest Update: June 11, 2025** - **v0.6.0 "TLS Termination & Visual Management" Release Complete!** Major milestone with Iteration 5 completion featuring comprehensive TLS certificate management, HTTPS testing capabilities, and enhanced Gateway creation with TLS support. Additionally includes the enhanced resource visualization from Iteration 4 with professional UI cards and comprehensive resource management actions. The extension now provides complete end-to-end TLS termination workflows alongside the redesigned Resources tab with interactive resource cards and relationship visualization.

### ✅ Completed Features (Iteration 1-5)

#### TLS Termination & Certificate Management (Iteration 5 ✅ - June 11, 2025)
- **Intelligent Prerequisite Management**: Automatic cert-manager CRD detection and installation workflow
- **One-Click Infrastructure Setup**: Automated cert-manager v1.14.5 installation with comprehensive error handling
- **Complete Certificate Lifecycle**: Generate, view, manage, and delete TLS certificates with intuitive UI
- **Self-Signed Certificate Generation**: Automated creation of test certificates with proper CA issuer setup
- **Prerequisite Validation**: Smart UI state management that prevents operations until cert-manager is ready
- **Enhanced Gateway Creation**: Integrated TLS listener configuration with certificate selection dropdown
- **HTTPS Testing Capabilities**: Advanced HTTP client with TLS options, certificate verification controls, and secure connection testing
- **TLS Management Tab**: Dedicated interface for certificate operations with installation status monitoring
- **Certificate Status Monitoring**: Real-time status indicators (ready, pending, failed) with expiration tracking
- **DNS Name Management**: Dynamic multi-domain certificate support with flexible DNS configuration
- **Security Indicators**: Professional visual feedback with security icons and system readiness status
- **Backend Certificate API**: Complete REST API for certificate operations with comprehensive error handling
- **Installation Progress Feedback**: Real-time toast notifications and progress indicators during setup
- **Gateway-Certificate Integration**: Seamless workflow from infrastructure setup to Gateway TLS configuration

#### VM Service Backend Architecture (Iteration 1-4 ✅)
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

#### Testing & Proxy Tools (Iteration 4 ✅) - Consolidated for Better UX
- **Integrated Proxy Management**: Start/stop kubectl proxy directly from the UI with PID tracking
- **Built-in HTTP Client**: Comprehensive HTTP testing interface with support for all methods
- **Request/Response Display**: Syntax-highlighted request and response viewing with detailed analysis
- **cURL Command Generation**: Automatic cURL command generation and copy functionality
- **Request History**: Save and replay previous requests for easy testing workflows
- **Service Integration**: Seamless proxy-to-testing workflow for endpoint validation
- **Unified Interface**: Combined proxy management and HTTP testing in single tab for improved workflow

#### Enhanced UI and Resource Management (Iteration 4 ✅) - **v0.6.0 Complete - June 11, 2025**
- **Professional Resource Cards**: Rich visual cards with status indicators, avatars, detailed Gateway/HTTPRoute information
- **Interactive Resource Visualization**: Card-based layout showing Gateway → HTTPRoute relationships with connection mapping
- **Resource Management Actions**: Click-to-delete with confirmation dialogs, view YAML configurations, and refresh capabilities
- **Enhanced Visual Design**: Material-UI theming, hover effects, professional styling matching Docker Desktop
- **Status Legend**: Comprehensive legend explaining all visual indicators and connection types
- **Empty State Guidance**: Helpful instructions when no resources exist with clear next steps

### 🚧 Next Iterations (Planned)

#### Iteration 6: Advanced Resource Management
- **Resource Editing**: Update existing Gateway and HTTPRoute configurations
- **Resource Cloning**: Duplicate and modify existing resources  
- **Bulk Operations**: Multi-resource management capabilities
- **Resource Templates**: Save and reuse custom configurations

### 📋 Planned Features (Roadmap)

#### Next Priority: Policy Management
- **Security Policies**: JWT authentication, authorization, and access control
- **Traffic Policies**: Rate limiting, circuit breakers, and retry policies  
- **Advanced TLS**: Certificate rotation, CA management, and mutual TLS
- **Backend Policies**: Load balancing, health checking, and failover

#### Future: Advanced Features
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
