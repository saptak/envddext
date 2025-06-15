# Envoy Gateway Docker Desktop Extension v0.12.1

A production-ready Docker Desktop extension for managing Envoy Gateway resources with enterprise-grade performance optimizations, enhanced HTTP client capabilities, and an intuitive 4-tab interface with Envoy branding.

## Key Features

- **Streamlined Interface**: Clean 4-tab design with Envoy logo and progressive complexity
- **Comprehensive Security**: JWT authentication, Basic Auth, CORS, IP filtering, mTLS, and rate limiting
- **Interactive Interface**: Contextual help, step-by-step tutorials, and guided wizards
- **Traffic Management**: Traffic splitting, synthetic load testing, and real-time metrics
- **TLS Support**: Certificate management, HTTPS testing, and automated cert-manager integration
- **Advanced Tools**: YAML editor, template gallery, and resource visualization
- **VM Service Backend**: Robust Go backend bypassing Docker Desktop limitations

## Core Functionality

### 🚀 Quick Start Tab
- **Overview Dashboard**: System health monitoring with Gateway, HTTPRoute, and Service status
- **Template Gallery**: Curated templates with search and one-click deployment
- **Visual Resource Cards**: Relationship mapping and real-time status indicators

### 🏗️ Infrastructure Tab
- **Gateways**: Create/delete with TLS listener configuration and LoadBalancer management
- **HTTP Routes**: Advanced routing rules with path matching and backend services
- **TLS Certificates**: Automated cert-manager integration and certificate lifecycle

### 🛡️ Security & Policies Tab
- **Security Policies**: JWT authentication, Basic Auth, CORS, IP filtering, mTLS, rate limiting
- **Resilience Policies**: Timeout and retry configuration with visual management
- **Policy Wizards**: Step-by-step configuration for complex security setups

### 🚦 Traffic & Testing Tab
- **Traffic Splitting**: Canary deployments and A/B testing patterns with real-time visualization
- **HTTP Testing**: Built-in client with enhanced headers management, JWT support, HTTPS testing, and request history
- **Performance Testing**: Synthetic load testing with configurable RPS and real-time metrics
- **Proxy Management**: Integrated kubectl proxy with lifecycle management

## Quick Start

### Installation

```bash
# Build and install
./build-and-install-github-templates.sh
```

### Basic Usage

1. **Setup**: Install Envoy Gateway and configure LoadBalancer
2. **Create Gateway**: Use the guided form to create your first Gateway
3. **Add Routes**: Configure HTTPRoutes with path matching
4. **Secure**: Apply security policies (JWT, Basic Auth, etc.)
5. **Test**: Use built-in HTTP client and traffic generator

## Current Status

**v0.12.1 - Production Ready** (June 14, 2025)

✅ **Complete Feature Set**: All major functionality implemented  
✅ **Performance Optimized**: Enterprise-grade performance improvements  
✅ **Security Hardened**: Comprehensive security policy management  
✅ **Production Tested**: Extensive testing and validation  
✅ **Documentation**: Interactive help and tutorials  

### Architecture

- **Frontend**: React with Material-UI and performance optimizations
- **Backend**: Go HTTP API server with VM service architecture
- **Integration**: Docker Desktop with Kubernetes cluster access
- **Templates**: GitHub repository integration for community templates

## Limitations

- **Resource Editing**: Can create/delete but not modify existing resources
- **Protocol Support**: HTTP/HTTPS only (no TCP, UDP, gRPC)
- **Advanced Envoy**: EnvoyProxy custom resources not supported

## Development

### Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js 18+ and npm
- Go 1.19+

### Project Structure

```text
├── ui/                 # React frontend
├── backend/           # Go backend service
├── docs/              # Documentation
├── templates/         # Local templates
└── docker-compose.yaml # VM service config
```

### Development Commands

```bash
# Frontend development
cd ui && npm install && npm start

# Backend development
cd backend && go mod tidy && go run main.go

# Build and install
./build-and-install-github-templates.sh
```

## Documentation

- [Extension PRD](docs/envoy_gateway_extension_prd.md)
- [Implementation Plan](docs/envoy_gateway_implementation_plan.md)
- [Troubleshooting Guide](docs/troubleshooting-guide.md)
- [Envoy Gateway Docs](https://gateway.envoyproxy.io/docs/)

## GitHub Integration

Templates stored at [github.com/saptak/envoygatewaytemplates](https://github.com/saptak/envoygatewaytemplates) with direct kubectl application and community-driven library.