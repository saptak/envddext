# Envoy Gateway Use Cases

This document provides detailed specifications for the common use cases that will be implemented in the Envoy Gateway extension. Each use case includes sample YAML configurations, implementation details, and user experience considerations.

## Use Case 1: Basic HTTP Routing

### Overview
Enable users to deploy a simple web application and configure HTTP routes to access it.

### Sample Applications
1. **Echo Service**
   - Simple service that returns request information
   - Useful for testing routing rules

2. **Demo Web Application**
   - Multi-page web application
   - Different endpoints for testing path-based routing

### Sample YAML Configurations

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo-service
  namespace: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo-service
  template:
    metadata:
      labels:
        app: echo-service
    spec:
      containers:
      - name: echo-service
        image: ealen/echo-server:latest
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: echo-service
  namespace: demo
spec:
  selector:
    app: echo-service
  ports:
  - port: 80
    targetPort: 8080
```

#### Gateway
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: demo-gateway
  namespace: demo
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Same
```

#### HTTPRoute
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: echo-route
  namespace: demo
spec:
  parentRefs:
  - name: demo-gateway
    namespace: demo
  hostnames:
  - "echo.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: echo-service
      port: 80
```

### Implementation Details
1. Create namespace and deploy sample applications
2. Create Gateway resource
3. Create HTTPRoute resource
4. Provide testing tools (curl commands or in-app HTTP client)
5. Display routing visualization

### User Experience
1. User selects "Basic HTTP Routing" template
2. Extension creates all resources with default values
3. Extension shows deployment status and endpoints
4. User can test routes with built-in HTTP client
5. User can modify route configurations through UI

## Use Case 2: TLS Termination

### Overview
Configure TLS termination at the Gateway level to secure application traffic.

### Sample YAML Configurations

#### Self-Signed Certificate Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: demo
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

#### TLS Gateway
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: tls-gateway
  namespace: demo
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - name: tls-secret
    allowedRoutes:
      namespaces:
        from: Same
```

#### HTTPRoute for TLS
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: secure-route
  namespace: demo
spec:
  parentRefs:
  - name: tls-gateway
    namespace: demo
  hostnames:
  - "secure.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: echo-service
      port: 80
```

### Implementation Details
1. Generate self-signed certificate
2. Create Kubernetes Secret with certificate
3. Create Gateway with TLS configuration
4. Create HTTPRoute for secure traffic
5. Provide testing tools for HTTPS connections

### User Experience
1. User selects "TLS Termination" template
2. Extension generates self-signed certificate
3. Extension creates all resources with TLS configuration
4. Extension shows deployment status and secure endpoints
5. User can test secure routes with built-in HTTPS client

## Use Case 3: Traffic Splitting

### Overview
Deploy multiple versions of an application and configure weighted routing between them.

### Sample YAML Configurations

#### Multiple Deployments
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-v1
  namespace: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demo-app
      version: v1
  template:
    metadata:
      labels:
        app: demo-app
        version: v1
    spec:
      containers:
      - name: app
        image: hashicorp/http-echo
        args:
        - "-text=This is version 1"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-v2
  namespace: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demo-app
      version: v2
  template:
    metadata:
      labels:
        app: demo-app
        version: v2
    spec:
      containers:
      - name: app
        image: hashicorp/http-echo
        args:
        - "-text=This is version 2"
```

#### Services
```yaml
apiVersion: v1
kind: Service
metadata:
  name: app-v1
  namespace: demo
spec:
  selector:
    app: demo-app
    version: v1
  ports:
  - port: 80
    targetPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: app-v2
  namespace: demo
spec:
  selector:
    app: demo-app
    version: v2
  ports:
  - port: 80
    targetPort: 5678
```

#### HTTPRoute with Weights
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: split-route
  namespace: demo
spec:
  parentRefs:
  - name: demo-gateway
  hostnames:
  - "split.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: app-v1
      port: 80
      weight: 80
    - name: app-v2
      port: 80
      weight: 20
```

### Implementation Details
1. Deploy multiple versions of the application
2. Create services for each version
3. Create HTTPRoute with weighted backends
4. Provide testing tools to demonstrate traffic distribution
5. Display traffic distribution visualization

### User Experience
1. User selects "Traffic Splitting" template
2. Extension creates all resources with default weights
3. User can adjust weights through UI sliders
4. Extension provides traffic simulator to demonstrate distribution
5. Extension shows real-time traffic distribution visualization

## Use Case 4: Rate Limiting

### Overview
Configure rate limits to protect backend services from excessive traffic.

### Sample YAML Configurations

#### Rate Limit Policy
```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyPatchPolicy
metadata:
  name: rate-limit-policy
  namespace: demo
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: rate-limited-route
  priority: 100
  config:
    typedConfig:
      '@type': type.googleapis.com/envoy.config.route.v3.RouteConfiguration
      requestHeadersToAdd:
      - header:
          key: x-envoy-ratelimited
          value: "true"
      virtualHosts:
      - domains: ["*"]
        name: rate-limited-host
        rateLimits:
        - actions:
          - remoteAddress: {}
          stage: 0
```

#### HTTPRoute for Rate Limiting
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: rate-limited-route
  namespace: demo
spec:
  parentRefs:
  - name: demo-gateway
  hostnames:
  - "ratelimit.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: echo-service
      port: 80
```

### Implementation Details
1. Deploy rate limit service
2. Configure rate limit policy
3. Create HTTPRoute with rate limit annotations
4. Provide testing tools to demonstrate rate limiting
5. Display rate limit metrics visualization

### User Experience
1. User selects "Rate Limiting" template
2. User configures rate limit parameters (requests per minute, etc.)
3. Extension creates all resources with rate limit configuration
4. Extension provides load testing tool to demonstrate rate limiting
5. Extension shows real-time rate limit metrics

## Use Case 5: JWT Authentication

### Overview
Configure JWT validation to secure API endpoints.

### Sample YAML Configurations

#### JWT Provider
```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: jwt-policy
  namespace: demo
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: jwt-route
  jwt:
    providers:
    - name: example-provider
      issuer: https://example.com
      remoteJWKS:
        uri: https://example.com/.well-known/jwks.json
      claimsToHeaders:
      - claim: sub
        header: x-auth-sub
```

#### HTTPRoute for JWT Authentication
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: jwt-route
  namespace: demo
spec:
  parentRefs:
  - name: demo-gateway
  hostnames:
  - "jwt.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: echo-service
      port: 80
```

### Implementation Details
1. Configure JWT provider
2. Create test JWT tokens
3. Create HTTPRoute with JWT security policy
4. Provide testing tools for JWT authentication
5. Display authentication flow visualization

### User Experience
1. User selects "JWT Authentication" template
2. User configures JWT parameters (issuer, claims, etc.)
3. Extension creates all resources with JWT configuration
4. Extension generates test tokens for demonstration
5. Extension provides testing interface for JWT authentication
