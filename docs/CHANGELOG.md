# Changelog

All notable changes to the Envoy Gateway Docker Desktop Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2025-05-22

### Added - UI/UX Theming Enhancement
- **Complete Dark Theme Integration**: All form components now properly integrate with Docker Desktop's dark theme
- **HTTPRoute Creation Form Theming**: Fixed all TextField, Select, FormControl, and Autocomplete components with proper styling
- **Paper Component Background Fix**: Resolved light background issues in form sections that were causing readability problems
- **Professional Visual Design**: Consistent styling with proper contrast ratios and enhanced readability
- **Enhanced User Experience**: All form fields now feature proper light borders, white text, and appropriate hover/focus states

### Fixed
- **Form Readability Issues**: Resolved dark text on light background problems in HTTPRoute creation forms
- **Paper Component Styling**: Changed from `bgcolor: 'grey.50'` to proper dark theme colors with transparent backgrounds
- **Form Field Theming**: Applied comprehensive dark theme styling to all input components

### Technical Details
- Applied consistent theming pattern with `rgba(255, 255, 255, 0.23)` borders and `rgba(255, 255, 255, 0.05)` backgrounds
- Enhanced Paper components with subtle borders and proper transparency
- Implemented proper focus and hover states for all form elements

## [3.0.0] - 2025-05-22

### Added - HTTPRoute Management (Iteration 3)
- **Complete HTTPRoute Creation UI**: Comprehensive form-based HTTPRoute creation with full validation
- **Multiple Routing Rules Support**: Configure multiple routing rules with path matching, headers, and query parameters
- **Backend Service Configuration**: Service selection with weight-based traffic splitting capabilities
- **Timeout Configuration**: Request timeout and backend timeout settings
- **Real-time Validation**: Form validation with detailed error messages and user guidance
- **Gateway Integration**: Seamless integration with existing Gateway resources

## [2.4.0] - 2025-05-22

### Added - Gateway Management (Iteration 2.4)
- **Gateway Creation Forms**: Guided Gateway resource creation with validation
- **Real-time Status Monitoring**: Visual indicators for Gateway health and status
- **Configuration Options**: Protocol, port, and listener configuration

## [2.3.0] - 2025-05-22

### Added - GitHub Templates Integration (Iteration 2.3)
- **GitHub Repository Integration**: Direct integration with github.com/saptak/envoygatewaytemplates
- **HTTP URL Template Application**: Apply templates directly via HTTP URLs to kubectl
- **Metadata-driven Organization**: Template categorization and descriptions
- **Template Library**: Basic HTTP, TLS termination, and traffic splitting examples

## [2.2.0] - 2025-05-22

### Added - Tabbed UI Interface (Iteration 2.2)
- **Tabbed Interface**: Overview, Templates, and Gateway Management tabs
- **Responsive Navigation**: Seamless navigation between functional areas
- **Consistent Styling**: Material-UI components with unified design

## [2.1.0] - 2025-05-22

### Added - Enhanced Monitoring (Iteration 2.1)
- Enhanced deployment monitoring with detailed pod status information
- Real-time status updates with configurable refresh intervals
- Automatic issue detection and troubleshooting guidance
- Visual indicators for pod readiness and deployment health
- Tabbed UI interface for better organization (Resources and Deployment Status tabs)
- Service endpoint monitoring and display
- Comprehensive pod monitoring with container status and events
- DeploymentStatusMonitor component with expandable details
- PodStatusIndicator component with container and event information
- DeploymentTroubleshooter component with automatic issue detection
- Enhanced Kubernetes helper functions for detailed status monitoring

### Changed
- Improved UI organization with tabbed interface
- Enhanced template application flow with automatic service tracking
- Better error handling and user feedback

### Fixed
- TypeScript compilation issues with proper type annotations
- Template ID validation for service tracking

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
