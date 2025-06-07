# Quick Start Feature Documentation

## Overview

The Quick Start feature provides guided workflows for common Envoy Gateway use cases, making it easier for users to get started with Envoy Gateway in their local Kubernetes cluster. This feature is designed to help users learn Envoy Gateway concepts through interactive examples and deploy sample applications with pre-configured Gateway resources.

## User Interface

### Quick Start Button

The Quick Start button is prominently displayed in the "Quick Setup" section of the main Envoy Gateway screen. When clicked, it opens the Quick Start dialog.

![Quick Start Button](images/quick_start_button.png)

### Quick Start Dialog

The Quick Start dialog provides an overview of available examples and guides users through the process of deploying and testing Envoy Gateway configurations.

![Quick Start Dialog](images/quick_start_dialog.png)

## Available Examples

The Quick Start feature currently includes the following examples:

### Basic HTTP Routing

Deploy a simple web service with HTTP routing. This example demonstrates:
- Creating a Gateway resource
- Configuring an HTTPRoute
- Routing traffic to a backend service

### TLS Termination

Secure your services with HTTPS. This example demonstrates:
- Generating self-signed certificates
- Configuring TLS termination at the Gateway
- Routing secure traffic to backend services

### Traffic Splitting

Route traffic to multiple versions of a service. This example demonstrates:
- Deploying multiple versions of an application
- Configuring weighted routing
- Visualizing traffic distribution

## Implementation Details

The Quick Start feature is implemented as a React component in the Envoy Gateway extension UI. The implementation includes:

1. **Quick Start Button**: A button in the Quick Setup section that triggers the Quick Start dialog.
2. **Dialog Component**: A modal dialog that displays available examples and guides users through the setup process.
3. **Example Templates**: Pre-configured YAML templates for common Envoy Gateway use cases. These templates are primarily fetched from a GitHub repository and applied using the **host's `kubectl`** (via `ddClient.extension.host.cli.exec()`) for reliable deployment.

## Future Enhancements

Future enhancements to the Quick Start feature may include:

1. **Interactive Tutorials**: Step-by-step guided tutorials with progress tracking.
2. **Configuration Customization**: Ability to customize example configurations before deployment.
3. **Visual Feedback**: Real-time visualization of deployed resources and traffic flow.
4. **Additional Examples**: More use cases such as JWT authentication, rate limiting, and more.

## Development

The Quick Start feature is implemented in the following files:

- `ui/src/AppWithGitHubTemplates.tsx`: Contains the main application logic, including the Quick Start button and dialog components that render the templates.
- `ui/src/services/githubTemplateService.ts`: Handles fetching template metadata (from an `index.json` file on GitHub) and their YAML content. Template application uses the host's `kubectl`.
- `templates/index.json` (in the `envoygatewaytemplates` GitHub repository): The primary source of metadata for available templates.
- `envddext/ui/src/templates/index.json`: A local fallback or cached version of the template metadata.
- `ui/src/components/QuickStart/`: (Future) May contain dedicated components if the Quick Start dialog logic is extracted from `AppWithGitHubTemplates.tsx`.

## Related Documentation

- [Extension PRD](envoy_gateway_extension_prd.md)
- [Implementation Plan](envoy_gateway_implementation_plan.md)
- [Use Cases](envoy_gateway_use_cases.md)
