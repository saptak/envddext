# Changelog

All notable changes to the Envoy Gateway Docker Desktop Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2025-12-12 "Kubectl Proxy Reliability & Error Handling"

### Added - 🔧 Major Reliability & Error Handling Improvements

- **🛠️ Enhanced Kubectl Proxy Management**:
    - **Comprehensive Error Handling**: Detailed error reporting with backend logs and clear frontend error propagation replacing generic "Unknown error" messages
    - **Automatic Kubeconfig Detection**: Dynamic kubeconfig path resolution using environment variables, eliminating hardcoded user-specific paths (`/host_users/saptak/.kube/config`)
    - **Robust Response Parsing**: Proper Docker VM service communication with correct response structure handling - fixed frontend misinterpretation of backend success responses
    - **Pre-flight Connectivity Testing**: kubectl cluster-info validation before proxy startup to ensure cluster accessibility
    - **Enhanced Process Management**: Reliable kubectl proxy startup with improved PID tracking and proper cleanup mechanisms
    - **Detailed Logging**: Comprehensive logging throughout proxy lifecycle for troubleshooting and debugging
    - **Graceful Fallback**: Proper handling of kubeconfig issues and connectivity problems with user-friendly error messages
    - **Environment Variable Support**: Support for custom KUBECONFIG paths with fallback to Docker Desktop defaults

### Fixed - Critical Proxy Startup Issues

- **"Unknown error starting proxy"**: Resolved generic error messages by implementing comprehensive error propagation from backend to frontend
- **Hardcoded Path Dependencies**: Eliminated user-specific path requirements (`/host_users/saptak/`) making the extension portable across different users
- **Docker VM Service Communication**: Fixed response parsing where Docker Desktop VM service wraps backend responses in a `data` property
- **Kubeconfig Detection**: Resolved issues where backend couldn't locate or access kubeconfig files in Docker VM environment  
- **Process Lifecycle Management**: Enhanced kubectl proxy startup reliability with proper error handling and status validation

### Changed - Architecture Improvements

- **Backend Service Enhancement**:
    - Modified `handleStartProxy` in `backend/main.go` with pre-flight testing and enhanced error reporting
    - Updated `ensureKubeconfig` to use dynamic environment variable detection
    - Added comprehensive logging and connectivity validation before proxy startup
- **Frontend Service Layer**:
    - Enhanced `kubectlProxyService.ts` with proper Docker VM service response parsing
    - Added detailed console logging for debugging proxy startup issues
    - Improved error handling and user feedback throughout proxy lifecycle
- **Error Propagation**: Clear error messages replace generic failures, providing actionable feedback for users

### Technical Implementation - v0.8.1 Architecture

- **Backend Improvements**:
    - Enhanced error handling in `backend/main.go` handleStartProxy function
    - Dynamic kubeconfig path detection with environment variable support
    - Pre-flight kubectl cluster-info testing before proxy startup
    - Comprehensive logging for troubleshooting proxy startup issues
- **Frontend Communication**:
    - Fixed Docker VM service response parsing in `ui/src/services/kubectlProxyService.ts`
    - Proper extraction of backend responses from Docker Desktop service wrapper
    - Enhanced error reporting and debugging capabilities

## [0.7.0] - 2025-06-11 "Traffic Splitting & Canary Deployments"

### Added - 🎉 Major Release: Traffic Splitting & Canary Deployments (Iteration 6)

- **🔀 Traffic Splitting Management**:
    - **Comprehensive Traffic Splitting Wizard**: Step-by-step guided setup for traffic management with deployment patterns
    - **Multi-Version Application Deployment**: Automated deployment of multiple service versions with real-time status monitoring
    - **Deployment Pattern Support**: Pre-configured Canary, Blue-Green, and A/B Testing patterns with scenario-based workflows
    - **Dynamic Traffic Distribution**: Real-time traffic weight adjustment with slider controls and one-click scenario application
    - **Advanced Management Interface**: Professional tabbed interface with Quick Start Wizard and Advanced Management tabs
    - **Traffic Simulation**: Built-in traffic simulator with configurable RPS and real-time distribution visualization
    - **Deployment Status Monitoring**: Real-time tracking of deployments, gateway, and HTTPRoute resource status with detailed cards
    - **Professional UI Integration**: Material-UI components with Docker Desktop theming, stepper navigation, and responsive design

### Changed - UI/UX Improvements
- **Tab Interface Enhancement**: Added seventh "Traffic Splitting" tab to main interface for advanced traffic management
- **Enhanced Navigation**: Updated tabbed interface to include comprehensive traffic splitting and canary deployment workflows
- **Improved User Experience**: Logical grouping of traffic management functionality with intuitive wizard-based setup
- **Better Workflow**: Integrated deployment → configuration → testing flow for seamless traffic splitting validation
- **Maintained Functionality**: All existing features preserved while adding advanced traffic management capabilities

### Technical Implementation - v0.7.0 Architecture
- **NEW: Traffic Splitting Components**:
    - `ui/src/components/TrafficSplittingManager.tsx` - Main interface with tabbed design (Quick Start Wizard + Advanced Management)
    - `ui/src/components/TrafficSplittingWizard.tsx` - Step-by-step wizard with deployment patterns and scenario management
    - Enhanced existing traffic-splitting template with dual service deployment (v1/v2) and weighted routing
    - Real-time status monitoring integration with Kubernetes resources and deployment lifecycle tracking

- **Enhanced UI Architecture**:
    - Updated `ui/src/AppWithGitHubTemplates.tsx` with new Traffic Splitting tab (tab-6)
    - Professional stepper component with pattern selection, service configuration, and traffic management
    - Material-UI integration with accordion-based scenario management and real-time progress indicators
    - Comprehensive error handling and user feedback throughout traffic splitting workflows

## [0.6.0] - 2025-06-11 "TLS Termination & Visual Gateway Management"

### Added - 🎉 Major Release: TLS Termination & Enhanced UI and Resource Management

- **🔐 TLS Termination & Certificate Management (Iteration 5)**:
    - **Intelligent Prerequisite Management**: Automatic cert-manager CRD detection and installation workflow
    - **One-Click Infrastructure Setup**: Automated cert-manager v1.14.5 installation with comprehensive error handling and 30-second setup wait
    - **Complete Certificate Lifecycle**: Generate, view, manage, and delete TLS certificates with intuitive UI
    - **Self-Signed Certificate Generation**: Automated creation of test certificates with proper CA issuer setup
    - **Prerequisite Validation**: Smart UI state management that prevents operations until cert-manager is ready
    - **Enhanced Gateway Creation**: Integrated TLS listener configuration with certificate selection dropdown
    - **HTTPS Testing Capabilities**: Advanced HTTP client with TLS options, certificate verification controls, and secure connection testing
    - **TLS Management Tab**: New dedicated interface for certificate operations with installation status monitoring
    - **Certificate Status Monitoring**: Real-time status indicators (ready, pending, failed) with expiration tracking
    - **DNS Name Management**: Dynamic multi-domain certificate support with flexible DNS configuration
    - **Security Indicators**: Professional visual feedback with security icons and system readiness status
    - **Backend Certificate API**: Complete REST API for certificate operations (/create-certificate, /list-certificates, /delete-certificate) with comprehensive error handling
    - **Installation Progress Feedback**: Real-time toast notifications and progress indicators during cert-manager setup
- **🎨 Professional Resource Cards**:
    - Rich visual cards with status indicators, avatars, and detailed Gateway/HTTPRoute information
    - Color-coded status icons (Ready/Warning/Error/Unknown) with comprehensive details
    - Interactive elements including Gateway classes, listeners, addresses, attached routes
    - Professional Material-UI theming with hover effects and Docker Desktop integration

- **🔗 Interactive Resource Visualization**:
    - **User Feedback Integration**: Complete redesign addressing "ugly and unintuitive" feedback
    - Card-based layout showing Gateway → HTTPRoute relationships with connection mapping
    - Visual flow indicators demonstrating traffic routing from Gateways through routes to services
    - Comprehensive status legend explaining all visual indicators and connection types
    - Enhanced visual design with gradients, professional styling, and enhanced typography

- **⚙️ Resource Management Actions**:
    - Click-to-delete resources with confirmation dialogs and detailed warnings
    - View YAML configurations in formatted, syntax-highlighted dialogs
    - Individual and bulk resource refresh capabilities
    - Comprehensive error handling with specific resolution guidance
    - Success feedback with automatic resource list updates

- **HTTPRoute Creation Form Improvements**:
    - Resolved form not closing automatically after successful HTTPRoute creation. Form now properly calls `onSuccess` callback with constructed HTTPRoute object.
    - Fixed validation errors not clearing when corrected. All form change handlers now properly clear validation errors for the corresponding fields.
    - Removed debug information from UI for production-ready experience (removed namespace loading status, debug logs, and debug UI sections).
    - Fixed TypeScript build error by removing `resourceVersion` field from HTTPRoute metadata construction (not part of interface).

- **Responsive Tab Navigation**: 
    - Added horizontal scrolling support for tabs when screen width is insufficient
    - Implemented `variant="scrollable"`, `scrollButtons="auto"`, and `allowScrollButtonsMobile` for Material-UI Tabs component
    - Enhanced mobile and narrow-screen user experience with automatic navigation arrows

### Changed
- **UI/UX Overhaul**:
    - Resources tab completely redesigned with rich resource cards showing detailed status, configuration, and relationship information
    - Added comprehensive resource visualization section showing Gateway-HTTPRoute connections
    - HTTPRoute Management tab now provides clean, production-ready interface without debug clutter
    - All validation error states properly reset when users correct input
    - Improved form workflow with automatic closure after successful resource creation
    - Better responsive design across all screen sizes

### Technical Implementation - v0.6.0 Architecture
- **NEW: Visual Components**:
    - `ui/src/components/ResourceCard.tsx` - Professional resource cards with rich information display
    - `ui/src/components/ResourceVisualization.tsx` - **REDESIGNED** Card-based relationship visualization
    - `ui/src/components/ResourceActionDialog.tsx` - Unified dialog for resource actions
    - `ui/src/utils/resourceCardHelpers.ts` - Data extraction utilities for meaningful display

- **Enhanced Kubernetes Integration**:
    - Added `getGatewayYAML` and `getHTTPRouteYAML` functions for configuration viewing
    - Integrated resource management actions with comprehensive state management
    - Enhanced error handling and user feedback throughout the interface

- **UI/UX Transformation**:
    - Complete Resources tab redesign from text-based to visual card interface
    - Interactive resource visualization replacing basic status displays
    - Professional theming and responsive design improvements

## [0.5.1] - 2025-06-08

### Fixed
- **Gateway Creation UI Reliability & Error Handling**:
    - Resolved misleading "Failed to create Gateway" UI error when the backend operation was successful. The UI now correctly reflects success for new or existing/unchanged Gateways.
    - Root cause: The frontend's `createGateway` helper (in `ui/src/helper/kubernetes.ts`) was misinterpreting the structure of success responses from the backend service. The `ddClient.extension.vm.service.post()` call wraps the backend's actual `APIResponse` (e.g., `{success: true, data: "..."}`) inside a top-level `data` property. The frontend helpers were expecting the `success` flag at the top level.
    - Fix:
        - Modified `callBackendAPI` in `ui/src/helper/kubernetes.ts` to return the raw response from `ddClient.extension.vm.service.post()` for successful HTTP operations. For errors it catches internally, it forms and returns a standard `APIResponse`-like object (`{ success: false, error: "details" }`).
        - Updated API helper functions (`createGateway`, `listHostContexts`, `createHTTPRoute`) to correctly inspect the structure of the response from `callBackendAPI`, checking if the `APIResponse` payload is the direct object or nested under a `.data` property, to accurately determine success.
        - Backend's `s.applyYAML` function (in `backend/main.go`) was also previously enhanced to correctly interpret `kubectl apply` output indicating "unchanged" or "configured" as success, even if `kubectl` returned a non-zero exit code.
- **Initial Gateway Creation Stability (Kubeconfig/Socket Hang up)**:
    - Resolved initial "socket hang up" errors during Gateway creation.
    - Root cause: Backend Go service crashes due to kubeconfig initialization issues (e.g., previous reliance on a hardcoded path, not failing fast if the `KUBECONFIG` environment variable was missing or invalid for the backend service).
    - Fix:
        - Backend's `ensureKubeconfig` function in `backend/main.go` now solely relies on the `KUBECONFIG` environment variable and returns a clear error if it's not set or the config is unreadable. Hardcoded paths removed.
        - Backend's YAML application logic (`applyYAML`, `applyYAMLContent`) now fails fast and propagates errors if kubeconfig setup fails.
        - Frontend's `callBackendAPI` error extraction was improved to display more detailed error messages from the backend.
- **LoadBalancer Status and Configuration UI Enhancements**:
    - **Status Accuracy**: `checkLoadBalancerStatus` logic in `ui/src/services/loadBalancerService.ts` was made stricter. MetalLB is now considered "CONFIGURED" only if its `metallb-system` namespace exists, its controller deployment is ready, and at least one `IPAddressPool` is detected and reported. This resolved misleading "CONFIGURED" states when Gateways were failing with "AddressNotAssigned".
    - **TypeScript Build Error**: Fixed `TS2339: Property 'servicesWithIPs' does not exist on type 'LoadBalancerStatus'` by adding the `servicesWithIPs` property to the `LoadBalancerStatus` interface and ensuring the `checkLoadBalancerServices` method populates it.
    - **"Configure LoadBalancer" Button Visibility**: Corrected logic in `ui/src/components/LoadBalancerManager.tsx` so the button to configure MetalLB is displayed when the LoadBalancer status is "NOT CONFIGURED", even if an accompanying error message (like "MetalLB namespace not found") is also present.
    - **MetalLB Configuration Dialog Robustness**:
        - Mitigated JavaScript TypeErrors (e.g., ".includes is not a function") within `configureMetalLB` (`ui/src/services/loadBalancerService.ts`) by ensuring variables derived from backend responses are safely coerced to strings before string methods are called.
        - Improved parsing of responses from the backend's `/apply-yaml` endpoint within `configureMetalLB`. The frontend now correctly extracts nested error messages (e.g., from `response.data.error`) for more reliable keyword checks ("unchanged", "already exists").
        - Provided clearer user-facing error messages in the configuration dialog for ambiguous backend response patterns (e.g., when `Output` was `[object Object]`), guiding the user that the operation might have succeeded despite the reported hiccup.

## [Unreleased] - 2025-06-07

### Changed
- **Architectural Refinement for Kubernetes Interactions**:
    - Frontend services (`loadBalancerService.ts`, `githubTemplateService.ts`, `kubernetes.ts`) now primarily use the host's `kubectl` (via `ddClient.extension.host.cli.exec()`) for most direct Kubernetes operations (reading resources, status checks, applying URL-based manifests, `kubectl wait`). This significantly improves reliability by leveraging the host's Kubernetes context and avoiding VM-to-host API connectivity issues (e.g., `127.0.0.1` vs `host.docker.internal`).
    - The backend VM service's `/apply-yaml` endpoint is used for applying dynamically generated YAML strings (e.g., MetalLB `IPAddressPool` and `L2Advertisement`).
- **LoadBalancer Management (`loadBalancerService.ts`) Overhaul**:
    - All Kubernetes status detection calls (`quickCheckMetalLBNamespace`, `checkMetalLBStatus`, `checkCloudLoadBalancer`, `checkLoadBalancerServices`, `detectDockerNetworkRange`) refactored to use the host CLI for accuracy and reliability.
    - MetalLB installation (`configureMetalLB`):
        - Initial `metallb-native.yaml` manifest application now uses host CLI with `--validate=false` flag to bypass schema validation issues related to K8s API access from within the VM.
        - `kubectl wait` for MetalLB pods now uses host CLI.
    - MetalLB status detection (`checkMetalLBStatus`) logic refined: MetalLB is now considered fully "Configured" only if its controller deployment is ready *and* at least one `IPAddressPool` is detected.
- **GitHub Template Application (`githubTemplateService.ts`)**:
    - Switched from using the backend `/apply-template` endpoint to using the host's `kubectl` (via `ddClient.extension.host.cli.exec()`) for applying templates directly from URLs, enhancing reliability.

### Fixed
- **LoadBalancer Configuration Reliability**:
    - Resolved persistent "Failed to install MetalLB: exit status 1" errors by moving initial manifest application to host CLI with appropriate flags and refining logic for handling pre-existing installations.
    - Addressed "connection refused" errors encountered when the backend VM service attempted Kubernetes API calls (e.g., for manifest validation or applying resources) by shifting these operations to the host CLI where `127.0.0.1` correctly points to the K8s API.
- **LoadBalancer Status Accuracy**: UI now correctly reflects MetalLB status based on comprehensive host CLI checks, including the presence of `IPAddressPools`.
- **Template Application Reliability**: Resolved "connection refused" errors during template application by moving the operation to the host CLI.
- **Build Stability**: Corrected various TypeScript syntax errors in `loadBalancerService.ts` that were causing build failures.

## [0.5.0] - 2025-06-06

### Added - **MAJOR ARCHITECTURE OVERHAUL**
- **VM Service Backend**: Complete rewrite with Go backend service in Docker Desktop VM
- **All Docker Desktop Limitations Resolved**: Full file system access, process management, and shell operations
- **Gateway/HTTPRoute Creation**: Now works natively through UI with backend YAML generation
- **Enhanced Proxy Management**: Complete kubectl proxy lifecycle with PID tracking and reliable stop functionality
- **Backend API Endpoints**: RESTful API for all Kubernetes operations (/create-gateway, /create-httproute, /start-proxy, /stop-proxy, /proxy-status, /apply-template, /kubectl, /health)
- **Unix Socket Communication**: Secure frontend-backend communication via Docker Desktop VM
- **Multi-stage Docker Build**: React frontend + Go backend compilation

### Changed - **BREAKING ARCHITECTURE**
- **Complete Backend Rewrite**: All service layers now communicate with Go backend API
- **Infrastructure Updates**: metadata.json with VM service config, docker-compose.yaml for VM deployment
- **Build Process**: Enhanced build script with Go dependency management
- **Frontend Integration**: Services rewritten for API communication while maintaining UI/UX

### Fixed - **ALL PREVIOUS LIMITATIONS**
- ✅ Gateway and HTTPRoute creation through UI (was blocked by Docker Desktop restrictions)
- ✅ Kubectl proxy stop functionality (was blocked by process management restrictions)  
- ✅ File system operations (was blocked by temp file access restrictions)
- ✅ Shell command limitations (was blocked by pipe/redirect restrictions)
- ✅ Process management (was blocked by pkill pattern restrictions)

## [0.4.0] - 2025-05-26

### Added
- HTTP Testing Tools with comprehensive testing interface
- Built-in HTTP client supporting all HTTP methods (GET, POST, PUT, DELETE, etc.)
- Request/response display with syntax highlighting
- cURL command generation and copy functionality
- Request history and replay capabilities
- Custom headers and request body support
- Kubectl Proxy Manager for integrated proxy management
- One-click proxy start/stop functionality
- Service URL generator for easy Kubernetes service access
- Quick access to common service endpoints
- Real-time proxy status monitoring and connectivity testing
- Direct integration between proxy manager and HTTP testing tools

### Changed
- Updated tabbed interface to include HTTP Testing and Proxy Manager tabs
- Enhanced UI organization with 5-tab layout (Overview, Templates, Gateway Management, HTTP Testing, Proxy Manager)
- Improved component architecture with proper prop handling

### Fixed
- TypeScript compilation errors with HTTPClient and ProxyManager components
- Removed incorrect ddClient prop passing to components that create their own instances
- Component prop interface alignment and type safety improvements

## [0.2.0] - 2024-05-21

### Added
- Template-based deployment system with GitHub integration
- Quick start dialog with common Envoy Gateway templates
- Apply templates directly from GitHub URLs
- Real-time deployment status monitoring
- Automatic UI refresh after template application
- GitHub template repository integration
- Template metadata and categorization system

### Changed
- Improved user interface with better navigation
- Enhanced error handling and user feedback
- Better integration with Kubernetes cluster

### Fixed
- Kubernetes resource detection and status checking
- Template application error handling

## [0.1.0] - 2024-05-20

### Added
- Initial release of Envoy Gateway Docker Desktop Extension
- Basic Envoy Gateway installation and status checking
- Gateway and HTTPRoute resource listing
- Kubernetes cluster integration
- Docker Desktop extension framework integration
- Basic UI for resource management

### Features
- View existing Gateway and HTTPRoute resources
- Check Envoy Gateway installation status
- Install Envoy Gateway if not present
- Basic resource status monitoring

## Implementation Progress

### Iteration 1: Foundation ✅ COMPLETED
- [x] Basic extension setup and Docker Desktop integration
- [x] Kubernetes cluster connectivity
- [x] Envoy Gateway installation and status checking
- [x] Basic resource listing (Gateways and HTTPRoutes)
- [x] Template system foundation

### Iteration 2: Enhanced UI and Templates ✅ COMPLETED
- [x] **Enhanced Echo Service Deployment Monitoring**: Detailed pod status monitoring with container information
- [x] **Real-time Status Updates**: Configurable refresh intervals and automatic issue detection
- [x] **Tabbed UI Interface**: Better organization with multiple tabs
- [x] **GitHub Templates Integration**: Direct template application from GitHub repositories
- [x] **Gateway Management**: Form-based Gateway creation with validation

### Iteration 3: HTTPRoute Management and UI Theming ✅ COMPLETED
- [x] **HTTPRoute Creation Forms**: Comprehensive form-based HTTPRoute creation
- [x] **Multiple Routing Rules**: Support for path matching, headers, and query parameters
- [x] **Backend Configuration**: Service selection with weight-based traffic splitting
- [x] **Dark Theme Integration**: Complete UI/UX theming for Docker Desktop compatibility
- [x] **Real-time Validation**: Form validation with detailed error messages

### Iteration 4: HTTP Testing and Proxy Management ✅ COMPLETED
- [x] **HTTP Testing Tools**: Built-in HTTP client with comprehensive testing interface
- [x] **Request/Response Display**: Syntax-highlighted viewing with cURL generation
- [x] **Request History**: Save and replay functionality for testing workflows
- [x] **Kubectl Proxy Manager**: Integrated proxy management with service URL generation
- [x] **Real-time Monitoring**: Live proxy status and connectivity testing

### Iteration 5: TLS Termination & Certificate Management ✅ COMPLETED
- [x] **TLS Certificate Management**: Complete certificate lifecycle with generation, management, and deletion
- [x] **Self-Signed Certificate Generation**: Automated creation of test certificates with proper CA issuer setup
- [x] **Cert-manager Integration**: Automatic cert-manager v1.14.5 installation with comprehensive error handling
- [x] **Enhanced Gateway Creation**: Integrated TLS listener configuration with certificate selection
- [x] **HTTPS Testing Tools**: Advanced HTTP client with TLS options and certificate verification controls
- [x] **TLS Management Tab**: Dedicated interface for certificate operations with security indicators
- [x] **Backend Certificate API**: RESTful endpoints for certificate operations

### Iteration 6: VM Service Backend Architecture ✅ COMPLETED
- [x] **Complete Architecture Rewrite**: Go backend service in Docker Desktop VM
- [x] **All Limitations Resolved**: File system, process management, and shell operation restrictions eliminated
- [x] **Gateway/HTTPRoute Creation**: Native UI creation with backend YAML generation and kubectl operations
- [x] **Enhanced Proxy Management**: Full process lifecycle control with PID tracking
- [x] **Backend API**: RESTful endpoints for all Kubernetes operations
- [x] **Infrastructure Updates**: VM service configuration, multi-stage Docker build

### Iteration 7: Traffic Splitting Example ✅ COMPLETED
- [x] **Traffic Splitting Management**: Complete wizard-based traffic management interface
- [x] **Multi-Version Application Deployment**: Automated deployment with real-time status monitoring
- [x] **Weight-Based Routing**: Dynamic traffic distribution with slider controls and scenario management
- [x] **Traffic Simulation**: Built-in simulation with configurable RPS and distribution visualization

### Future Iterations
- **Iteration 8**: Configuration Forms and Wizards
- **Iteration 9**: Rate Limiting Example
- **Iteration 10**: JWT Authentication Example
- **Iteration 11**: Documentation and Help
- **Iteration 12**: Polish and Refinement

## Technical Details

### Components Added in Latest Release
- `LoadBalancerManager`: Complete MetalLB LoadBalancer management interface
- `LoadBalancerService`: Backend integration for MetalLB configuration and monitoring
- `HTTPClient`: Comprehensive HTTP testing interface with request/response handling
- `ProxyManager`: Kubectl proxy management with service URL generation
- `HTTPResponseDisplay`: Syntax-highlighted response viewer with formatting
- `HTTPRequestHistory`: Request history management with replay functionality
- `CurlCommandDisplay`: cURL command generation and copy functionality
- `KubectlProxyService`: Service for managing kubectl proxy lifecycle
- `HTTPClientService`: Service for making HTTP requests through Docker Desktop CLI

### Architecture Improvements
- Enhanced 5-tab UI interface (Overview, Templates, Gateway Management, HTTP Testing, Proxy Manager)
- Real-time proxy status monitoring and connectivity testing
- Direct integration between proxy manager and HTTP testing tools
- Improved component prop handling and TypeScript type safety
- Comprehensive error handling and user feedback

### Dependencies
- React 18+ with TypeScript
- Material-UI for consistent design
- Docker Desktop Extension SDK
- Kubernetes JavaScript Client

## Breaking Changes

None in current releases.

## Migration Guide

No migration required for current releases.

## Known Issues

- None currently reported

## Contributors

- Saptak Sen (@saptak) - Initial development and implementation

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
