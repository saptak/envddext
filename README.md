# Envoy Gateway Docker Desktop Extension

A comprehensive Docker Desktop extension for managing Envoy Gateway resources with an intuitive visual interface, security policy management including advanced rate limiting, template gallery, YAML editor, HTTP testing tools, synthetic traffic generation, and enhanced resource visualization. Built with a robust VM service backend architecture that eliminates Docker Desktop extension limitations.

## Key Features

- **VM Service Backend**: Robust Go backend service that bypasses Docker Desktop extension limitations
- **Gateway Creation & Management**: Create and delete Gateway resources with form-based UI and real-time status monitoring
- **HTTPRoute Creation & Management**: Create and delete HTTPRoute resources with advanced path matching, header/query parameter support, and backend service configuration
- **TLS Certificate Management**: Comprehensive TLS termination support with certificate generation, management, and HTTPS testing
- **LoadBalancer Management**: Robust MetalLB integration, configuration (including auto-detection), and accurate real-time status monitoring
- **Reliable Kubectl Proxy Management**: Robust proxy startup with enhanced error handling, automatic kubeconfig detection, and proper process lifecycle management
- **Responsive Tabbed Interface**: Organized UI with consolidated Dashboard, Gateway Management, HTTPRoute Management, Testing & Proxy, TLS Management, Traffic Splitting, Security Policies, and Template Gallery tabs with horizontal scrolling support
- **Security Policy Management**: Comprehensive security policy management with Basic Authentication, CORS, IP Filtering, Mutual TLS (mTLS), and advanced Rate Limiting configuration
- **Advanced Template Gallery**: Professional template gallery with search, filtering, categorization, ratings, and one-click deployment
- **YAML Editor**: Professional YAML editor with syntax highlighting, validation, templates, and real-time error reporting
- **Resource Creation Wizard**: Multi-step guided wizard for creating Gateways, HTTPRoutes, and Security Policies with contextual help
- **GitHub Templates Integration**: Apply basic HTTP routing templates directly from GitHub repositories
- **HTTP Testing Tools**: Built-in HTTP client for testing routes with request/response display and enhanced 429 rate limiting response handling
- **Synthetic Traffic Generation**: Advanced traffic generator with real-time metrics, visualization, and traffic splitting validation
- **Kubectl Proxy Manager**: Integrated proxy management for accessing Kubernetes services
- **Enhanced Monitoring**: Real-time status tracking with detailed deployment information
- **Visual Resource Management**: Interactive resource cards with relationship visualization and management actions
- **Template Library**: Access curated basic routing configurations for common HTTP use cases

## Current Limitations

- **No Resource Editing**: Can create and delete but not modify existing Gateways or HTTPRoutes
- **Limited Advanced Policies**: Some advanced traffic policies not yet supported (Basic Auth, CORS, IP Filtering, mTLS, Rate Limiting supported)
- **HTTP Only**: Limited to HTTP/HTTPS routing (no TCP, UDP, or gRPC support)
- **No Advanced Envoy Features**: EnvoyProxy custom resources and patches not supported

## Features

### 📊 Dashboard Tab (Enhanced in v0.8.1)
- **System Overview**: Consolidated view showing system health with Gateway, HTTPRoute, and Service counts
- **Health Monitoring**: Intelligent status detection with color-coded alerts (healthy/warning/critical)
- **Visual Resource Cards**: Professional cards displaying Gateway and HTTPRoute information with status indicators
- **Resource Visualization**: Interactive relationship mapping showing Gateway → HTTPRoute connections (collapsible)
- **Deployment Status**: Real-time service monitoring with pod and container information (collapsible)
- **Resource Management**: Delete resources, view YAML configurations, and unified refresh functionality
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

### 🧪 Testing & Proxy Tab (Enhanced in v0.8.1)
- **Proxy Manager**: Robust kubectl proxy management with enhanced error handling, automatic kubeconfig detection, and reliable startup process
- **HTTP Testing**: Built-in HTTP client for testing deployed routes with all HTTP methods
- **HTTPS Support**: Advanced TLS options for testing secure connections with certificate verification controls
- **Synthetic Traffic Generator**: Advanced traffic generation with configurable RPS, duration, concurrent connections, and HTTP methods
- **Real-time Metrics**: Live traffic metrics with response times, success rates, status code distribution, and error tracking
- **Traffic Visualization**: Interactive charts showing response time distribution, RPS trends, and performance analytics
- **Traffic Splitting Validation**: Test and validate traffic splitting configurations with synthetic load
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

### 🛡️ Security Policies Tab (New in v0.9.0)
- **Comprehensive Security Management**: Complete implementation of Basic Authentication, CORS, IP Filtering, and Mutual TLS (mTLS) policies
- **Basic Authentication**: Username/password protection with Kubernetes Secret management and realm configuration
- **CORS Policy Management**: Cross-origin resource sharing configuration with origins, methods, headers, and credentials support
- **IP Filtering**: Allow/deny lists with CIDR range support, rule-based access control, and visual rule management
- **Mutual TLS (mTLS)**: Client certificate authentication with CA management, step-by-step wizard, and CRL support
- **Professional Interface**: Tabbed security policy management with status indicators and comprehensive validation
- **Testing Integration**: Built-in testing information and cURL command generation for policy validation

### 🎨 Template Gallery Tab (New in v0.9.0)
- **Enhanced Template Discovery**: Professional gallery view with search, filtering, categorization, and ratings
- **Comprehensive Metadata**: Template information with prerequisites, documentation links, and difficulty levels
- **User Experience**: Template favorites, download counts, featured templates, and user ratings
- **One-Click Deployment**: Integrated apply functionality with progress tracking and status monitoring
- **Search and Filtering**: Filter by category, difficulty, tags, and popularity with real-time search
- **Detailed Template Views**: Multi-tab template details with overview, prerequisites, and installation guidance

### ✏️ Advanced Tools (New in v0.9.0)
- **YAML Editor**: Professional YAML editor with syntax highlighting, validation, templates, and real-time error reporting
- **Resource Creation Wizard**: Multi-step guided wizard for creating Gateways, HTTPRoutes, and Security Policies with contextual help
- **Template Management**: Copy, download, upload, and preview capabilities for YAML configurations
- **Validation Engine**: Comprehensive validation with suggestions, warnings, and best practices guidance

### 🔗 GitHub Integration
- Templates stored at [github.com/saptak/envoygatewaytemplates](https://github.com/saptak/envoygatewaytemplates)
- Direct HTTP URL application to kubectl
- Automatic template discovery and categorization
- Community-driven template library

## Current Status

**Latest Update: June 13, 2025** - **v0.9.1 "Rate Limiting & Advanced Traffic Control" Release Complete!** Comprehensive rate limiting with multi-dimensional policies (global, per-IP, per-header, per-user), sophisticated burst testing tools, and enhanced HTTP client with professional 429 response handling. Complete service deployment automation and advanced testing integration for enterprise-grade traffic control. Builds on v0.9.0's security policy management, template gallery, YAML editor, and resource creation wizard.

### ✅ Completed Features (Iteration 1-9)

#### Rate Limiting & Advanced Traffic Control (Iteration 9 ✅ - June 13, 2025)
- **Comprehensive Rate Limiting Management**: Complete implementation of rate limiting policies with multi-dimensional configuration (global, per-IP, per-header, per-user)
- **Advanced Rate Limit Testing**: Sophisticated burst testing tools with configurable traffic patterns, concurrency controls, and real-time analytics
- **Enhanced HTTP Client**: Professional 429 response handling with prominent rate limit header display and retry guidance
- **Service Deployment Automation**: Complete setup guides for Envoy Rate Limit Service with Redis backend and automated deployment options
- **Rate Limit Policy Configuration**: Full CRUD operations for rate limiting rules with burst allowances, enforcement modes, and validation
- **Professional Testing Integration**: Embedded rate limit testing in Testing & Proxy tab with comprehensive burst pattern analysis
- **Rate Limit Service Setup**: Step-by-step deployment guides with configuration examples and verification steps
- **Security Policy Integration**: Seamless integration with existing Security Policies interface for unified traffic control

#### Security Policies & Enhanced User Experience (Iteration 8 ✅ - June 12, 2025)
- **Comprehensive Security Policy Management**: Complete implementation of Basic Authentication, CORS, IP Filtering, and Mutual TLS (mTLS) policies
- **Resource Creation Wizard**: Multi-step guided wizard for creating Gateways, HTTPRoutes, and Security Policies with contextual help
- **Advanced YAML Editor**: Professional YAML editor with syntax highlighting, validation, templates, and real-time error reporting
- **Enhanced Template Gallery**: Comprehensive template gallery with search, filtering, categorization, ratings, and one-click deployment
- **Professional Security Interface**: Tabbed security policy management with step-by-step wizards for complex configurations
- **Security Policy Components**: BasicAuthManager, CorsManager, IPFilterManager, MTLSManager with comprehensive configuration options
- **Two New Tabs**: Security Policies and Template Gallery tabs with Material-UI theming and responsive design
- **Complete Policy Lifecycle**: Create, configure, test, and manage security policies with comprehensive validation and best practices

#### Kubectl Proxy Reliability & Error Handling (Iteration 8.1 ✅ - June 12, 2025)
- **Enhanced Error Handling**: Comprehensive error reporting with detailed backend logs and frontend error propagation
- **Automatic Kubeconfig Detection**: Dynamic kubeconfig path resolution eliminating hardcoded user paths
- **Robust Response Parsing**: Proper Docker VM service communication with correct response structure handling
- **Process Management**: Reliable kubectl proxy startup with PID tracking and proper cleanup
- **Connectivity Testing**: Pre-flight kubectl cluster-info validation before proxy startup
- **Enhanced Logging**: Detailed logging throughout proxy lifecycle for troubleshooting
- **Fallback Mechanisms**: Graceful handling of kubeconfig and connectivity issues
- **User-Friendly Messages**: Clear error messages replacing generic "Unknown error" responses

#### Dashboard Consolidation & UI Enhancement (Previous v0.8.0 ✅ - June 12, 2025)
- **Consolidated Dashboard**: Combined Resources and Deployment Status tabs into unified system overview
- **System Health Monitoring**: Intelligent health detection with color-coded status alerts (healthy/warning/critical)
- **Overview Cards**: Visual count display for Gateways, HTTP Routes, and Services with status summaries
- **Collapsible Sections**: User-controlled expansion of Resource Relationships and Deployment Status sections
- **Unified Resource Management**: Single interface for all resource operations (view YAML, delete, refresh)
- **Streamlined Navigation**: Reduced from 7 tabs to 6 tabs while maintaining all functionality
- **Enhanced User Experience**: Professional dashboard design with Material-UI theming and responsive layout
- **Real-time Status Integration**: Live updates for both resource status and deployment monitoring

#### Synthetic Traffic Generation & Performance Testing (Iteration 7 ✅ - June 12, 2025)
- **Advanced Traffic Generator**: Comprehensive synthetic traffic generation with configurable RPS (1-1000), duration, HTTP methods, headers, and request bodies
- **Real-time Metrics Collection**: Live performance monitoring with response times (min/avg/max), success rates, status code distribution, and error tracking
- **Interactive Visualization**: Professional charts showing response time distribution, RPS trends, and performance analytics with SVG-based rendering
- **Concurrent Request Management**: Configurable concurrent connections (1-100) with connection limiting and timeout management
- **Traffic Splitting Integration**: Dedicated traffic testing tab in Traffic Splitting Manager with gateway address auto-detection
- **Testing & Proxy Enhancement**: Integrated traffic generator in existing HTTP Testing tab for comprehensive testing workflows
- **Professional UI**: Tabbed interface with Configuration and Live Visualization tabs, advanced settings panel, and Material-UI theming
- **Backend API**: Robust Go backend with `/start-traffic-test`, `/stop-traffic-test`, and `/traffic-metrics` endpoints
- **Thread-safe Operations**: Concurrent metrics collection with proper synchronization and graceful test lifecycle management
- **Comprehensive Analytics**: Status code breakdown, error analysis, historical trending, and detailed performance reports

#### Traffic Splitting & Canary Deployments (Iteration 6 ✅ - June 11, 2025)
- **Comprehensive Traffic Splitting Wizard**: Step-by-step guided setup for traffic management with deployment patterns
- **Deployment Pattern Support**: Pre-configured Canary, Blue-Green, and A/B Testing patterns with scenario-based workflows
- **Multi-Version Application Deployment**: Automated deployment of multiple service versions with real-time status monitoring
- **Dynamic Traffic Distribution**: Real-time traffic weight adjustment with slider controls and one-click scenario application
- **Advanced Management Interface**: Professional tabbed interface with Quick Start Wizard and Advanced Management
- **Traffic Simulation**: Built-in traffic simulator with configurable RPS and real-time distribution visualization
- **Deployment Status Monitoring**: Real-time tracking of deployment, gateway, and HTTPRoute resource status
- **Professional UI Integration**: Material-UI components with Docker Desktop theming and responsive design

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

#### Iteration 8: Advanced Resource Management
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
