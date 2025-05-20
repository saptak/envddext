# Envoy Gateway Docker Desktop Extension

This extension allows you to manage and observe Envoy Gateway resources in your local Kubernetes cluster directly from Docker Desktop.

- View Gateways and Routes
- Quick setup for Envoy Gateway
- Template library for common Gateway API configurations

## Build and Install

```
make build-extension
make install-extension
```

This will use the image name `saptak/envoy-gateway-extension:latest`.

For more information, see the [Envoy Gateway documentation](https://gateway.envoyproxy.io/docs/).
