# Envoy Gateway Docker Desktop Extension

A comprehensive Docker Desktop extension for managing Envoy Gateway resources with an intuitive tabbed interface, GitHub-based templates, and enhanced monitoring capabilities.

## Key Features

- **Tabbed Interface**: Organized UI with Overview, Templates, and Gateway Management tabs
- **GitHub Templates Integration**: Apply templates directly from GitHub repositories
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

### 🔗 GitHub Integration
- Templates stored at [github.com/saptak/envoygatewaytemplates](https://github.com/saptak/envoygatewaytemplates)
- Direct HTTP URL application to kubectl
- Automatic template discovery and categorization
- Community-driven template library

## Current Status

**Latest Update: May 22, 2025** - Complete UI/UX theming enhancement and HTTPRoute management completed!

### ✅ Completed Features (Iteration 1-3)

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

#### UI/UX Theming Enhancement (Latest ✅)
- **Complete Dark Theme**: All form components properly themed for Docker Desktop
- **Professional Design**: Consistent styling with proper contrast and readability
- **Enhanced User Experience**: Light borders, white text, and appropriate hover/focus states
- **Paper Component Fix**: Resolved background issues in form sections

### 🚧 Next Iterations (Planned)

#### Iteration 3: HTTP Testing Tools (Remaining)
- Built-in HTTP client for testing routes
- Request/response display and curl command generation

#### Iteration 4: Enhanced UI and Visualization
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
