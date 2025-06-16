# Envoy Gateway Templates

This repository contains templates for the Envoy Gateway Docker Desktop Extension. These templates demonstrate common use cases for Envoy Gateway and can be applied directly from the extension.

## Templates

### Basic HTTP Echo Service

A simple echo service with HTTP routing through Envoy Gateway. This is a good starting point for beginners.

### TLS Termination

Demonstrates how to secure your services with HTTPS using TLS termination at the Gateway.

### Traffic Splitting

Shows how to route traffic to multiple versions of a service with weighted routing, useful for canary deployments.

## How to Use

These templates can be applied directly from the Envoy Gateway Docker Desktop Extension:

1. Open Docker Desktop
2. Navigate to the Envoy Gateway extension
3. Click "Quick Start"
4. Select a template
5. Click "Apply Directly" to apply the template directly from GitHub
6. Use the **Port Forward Manager** in the "Traffic & Testing" tab for instant access with localhost URLs

## Testing Your Templates

The extension includes a revolutionary **Port Forward Manager** that eliminates networking complexity:

- **One-Click Access**: Start gateway port forwarding with a single click
- **Dynamic Service Discovery**: Automatically finds your gateway services
- **Service Selector**: Choose from available LoadBalancer services with port information
- **Localhost URLs**: Get reliable `localhost:port` URLs that work in Docker Desktop
- **No Manual Commands**: Eliminates the need for complex `kubectl port-forward` commands

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
