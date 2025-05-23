# Changelog

All notable changes to the Envoy Gateway Docker Desktop Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- HTTPRoute creation and configuration UI
- Built-in HTTP client for testing routes
- Resource visualization and management tools

## [0.3.0] - 2025-05-22

### Added
- **Complete UI Redesign**: Tabbed interface with Overview, Templates, and Gateway Management tabs
- **GitHub Templates Integration**: Direct integration with [github.com/saptak/envoygatewaytemplates](https://github.com/saptak/envoygatewaytemplates)
- **Gateway Management UI**: Form-based Gateway creation with validation and real-time status monitoring
- **Enhanced Template System**: Metadata-driven template organization and categorization
- **Build Automation**: `build-and-install-github-templates.sh` script for streamlined development
- **AppWithGitHubTemplates**: New main component with enhanced functionality
- **Gateway Creation Forms**: Guided Gateway resource creation with protocol and port configuration
- **Real-time Status Monitoring**: Visual indicators for Gateway health and deployment status

### Changed
- Complete UI restructure from single-page to tabbed interface
- Template application now uses direct HTTP URLs to kubectl instead of local file storage
- Enhanced error handling and user feedback throughout the application
- Improved visual design with Material-UI components and consistent styling

### Technical Improvements
- Created `githubTemplateService.ts` for GitHub repository integration
- Enhanced deployment monitoring with `DeploymentStatusMonitor` and `PodStatusIndicator` components
- Implemented `GatewayCreationForm` with validation and status tracking
- Added comprehensive Kubernetes helper functions for resource management
- Automatic issue detection and troubleshooting guidance

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

### Iteration 2: HTTP Routing Example 🚧 IN PROGRESS
- [x] **Task 2.1**: Enhanced Echo Service Deployment Monitoring ✅ COMPLETED
  - [x] Detailed pod status monitoring with container information
  - [x] Real-time status updates with configurable refresh intervals
  - [x] Automatic issue detection and troubleshooting guidance
  - [x] Visual indicators for pod readiness and deployment health
  - [x] Tabbed UI interface for better organization
  - [x] Service endpoint monitoring
- [ ] **Task 2.2**: Implement Basic Gateway Creation
- [ ] **Task 2.3**: Add HTTPRoute Configuration
- [ ] **Task 2.4**: Add Testing Tools

### Future Iterations
- **Iteration 3**: Enhanced UI and Visualization
- **Iteration 4**: TLS Termination Example
- **Iteration 5**: Traffic Splitting Example
- **Iteration 6**: Configuration Forms and Wizards
- **Iteration 7**: Rate Limiting Example
- **Iteration 8**: JWT Authentication Example
- **Iteration 9**: Documentation and Help
- **Iteration 10**: Polish and Refinement

## Technical Details

### Components Added in Latest Release
- `DeploymentStatusMonitor`: Main component for monitoring deployment status
- `PodStatusIndicator`: Component for displaying detailed pod information
- `DeploymentTroubleshooter`: Component for automatic issue detection and guidance
- Enhanced Kubernetes helper functions for comprehensive status monitoring

### Architecture Improvements
- Tabbed UI interface for better organization
- Real-time polling system for status updates
- Automatic service tracking when templates are applied
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
