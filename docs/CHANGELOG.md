# Changelog

All notable changes to the Envoy Gateway Docker Desktop Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Future Iterations
- **Iteration 5**: Enhanced UI and Visualization
- **Iteration 6**: TLS Termination Example
- **Iteration 7**: Traffic Splitting Example
- **Iteration 8**: Configuration Forms and Wizards
- **Iteration 9**: Rate Limiting Example
- **Iteration 10**: JWT Authentication Example
- **Iteration 11**: Documentation and Help
- **Iteration 12**: Polish and Refinement

## Technical Details

### Components Added in Latest Release
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
