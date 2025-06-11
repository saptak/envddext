# Envoy Gateway Use Cases

This document provides detailed specifications for the use cases supported by the Envoy Gateway extension. The document is organized into **Currently Supported** use cases that are fully implemented in the extension, and **Planned Use Cases** that are roadmapped for future releases.

## **✅ Currently Supported Use Cases**

The extension currently supports basic Gateway and HTTPRoute management with the following capabilities:

### Use Case 1: Basic HTTP Routing ✅ **FULLY SUPPORTED**

#### **Current Implementation Status**
- ✅ **Gateway Creation**: Visual form-based Gateway resource creation
- ✅ **HTTPRoute Creation**: Visual form-based HTTPRoute resource creation  
- ✅ **Path Matching**: Exact, PathPrefix, and RegularExpression matching
- ✅ **Header Matching**: Exact values and presence checks
- ✅ **Query Parameter Matching**: Exact value matching
- ✅ **Backend Configuration**: Service selection with traffic weighting
- ✅ **Timeout Configuration**: Request and backend timeout settings
- ✅ **Template Deployment**: One-click deployment of basic HTTP examples
- ✅ **Testing Tools**: Built-in HTTP client for route validation

#### **Extension Capabilities**
This use case is fully supported through the Gateway Management tab with:
- Visual Gateway configuration (listeners, protocols, ports)
- HTTPRoute rule configuration (path matching, headers, backends)
- Real-time status monitoring and validation
- Immediate testing with integrated HTTP client

#### **When to Use**
- Setting up basic HTTP routing for local development
- Learning Gateway API concepts and patterns
- Prototyping routing configurations
- Testing backend service connectivity

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

### Benefits of Basic HTTP Routing
- **Service Decoupling**: Clients interact with the gateway, not directly with backend services, allowing backends to change without affecting clients.
- **Centralized Routing Logic**: Manage all routing rules in one place.
- **Simplified Client Configuration**: Clients only need to know the gateway's address.
- **Path and Hostname Agility**: Easily change how paths or hostnames map to backend services.

## Use Case 2: TLS Termination

### Overview
Configure TLS termination at the Gateway level to secure application traffic. This means the Gateway handles the TLS handshake with the client, decrypts the traffic, and then forwards unencrypted (or re-encrypted) traffic to backend services.

### When to Use
- Securing client-to-gateway communication with HTTPS.
- Offloading SSL/TLS processing from backend applications, simplifying their configuration.
- Centralizing certificate management at the gateway layer.
- Meeting security compliance requirements for encrypted traffic.

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

### Benefits of TLS Termination
- **Enhanced Security**: Encrypts data in transit between clients and the gateway.
- **Simplified Backend Services**: Backend applications don't need to handle TLS complexity.
- **Centralized Certificate Management**: Easier to manage and renew SSL/TLS certificates.
- **Performance**: Dedicated gateway hardware can often handle TLS more efficiently than application servers.
- **Compliance**: Helps meet regulatory requirements for data protection.

## Use Case 3: Traffic Splitting

### Overview
Deploy multiple versions of an application and configure weighted routing between them. This allows distributing a percentage of traffic to different backend services, typically different versions of the same application.

### When to Use
- **Canary Releases**: Gradually roll out a new version of an application to a small subset of users before a full release.
- **Blue/Green Deployments**: Shift traffic from an old version to a new version with minimal downtime.
- **A/B Testing**: Route different users to different versions of a feature to compare performance or user engagement.
- **Gradual Feature Rollout**: Slowly increase traffic to a new feature or service.

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

### Benefits of Traffic Splitting
- **Reduced Risk**: Minimize the impact of a faulty new release by exposing it to limited traffic initially.
- **Zero-Downtime Deployments**: Smoothly transition traffic to new versions.
- **Data-Driven Decisions**: Gather metrics from different versions in A/B tests to make informed choices.
- **Improved User Experience**: Avoid big-bang releases that might introduce widespread issues.

## Use Case 4: Rate Limiting

### Overview
Configure rate limits to protect backend services from excessive traffic. This involves setting thresholds on the number of requests a client (or a group of clients) can make within a specific time window.

### When to Use
- **Prevent Abuse**: Protect services from denial-of-service (DoS) attacks or misbehaving clients.
- **Ensure Fair Usage**: Prevent a single user or service from consuming disproportionate resources.
- **Manage Costs**: For services that have per-request costs (e.g., third-party APIs).
- **Maintain Service Stability**: Avoid overloading backend services, ensuring availability for all users.
- **Enforce API Quotas**: Implement usage tiers or limits for different API consumers.

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

### Benefits of Configuring Rate Limiting
- **Improved Service Availability**: Prevents backend services from being overwhelmed.
- **Enhanced Security**: Mitigates certain types of DoS/DDoS attacks and brute-force attempts.
- **Fair Resource Allocation**: Ensures equitable access for all clients.
- **Cost Control**: Can limit excessive calls to paid services or internal resources.
- **Operational Stability**: Protects against unexpected traffic surges.

## Use Case 5: JWT Authentication

### Overview
Configure JWT (JSON Web Token) validation to secure API endpoints. The gateway verifies incoming JWTs, ensuring they are valid and optionally checking claims, before forwarding requests to backend services.

### When to Use
- **Stateless Authentication**: Secure APIs where clients present a JWT as proof of authentication.
- **Microservice Security**: Centralize authentication logic at the gateway instead of implementing it in each microservice.
- **Role-Based Access Control (RBAC)**: Use JWT claims to make authorization decisions at the gateway or pass user identity/roles to backends.
- **Single Sign-On (SSO) Integration**: When an external identity provider issues JWTs.

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

### Benefits of JWT Authentication at the Gateway
- **Centralized Security**: Authentication logic is handled at the gateway, simplifying backend services.
- **Improved Performance**: Backends are relieved from the overhead of token validation.
- **Consistent Security Policy**: Enforce uniform authentication requirements across multiple services.
- **Enhanced Security Posture**: Protects internal services from unauthenticated requests.
- **Scalability**: Stateless nature of JWTs works well in distributed systems.

## Use Case 6: Request Attribute Matching (Paths, Headers, Hostnames)

### Overview
Route traffic based on various attributes of an incoming HTTP request, such as URL paths (exact, prefix, regex), hostnames, HTTP headers (exact match, presence, regex), or query parameters. This allows for fine-grained control over how requests are directed to different backend services or how they are processed.

### When to Use
- Implementing versioning for APIs (e.g., using path prefixes like `/v1/` vs `/v2/`, or custom headers like `X-API-Version: 2`).
- Directing traffic to different backend services based on the `Host` header (virtual hosting).
- Canary releasing features based on specific user segments identified by a custom header.
- Routing requests to specialized backends based on `Content-Type` or `Accept` headers.
- Implementing mobile-specific vs. desktop-specific backends based on `User-Agent` or custom client headers.
- A/B testing features by matching specific query parameters.

### Sample YAML Configurations
Refer to `envoygateway.md` for detailed examples of `HTTPRoute` resources demonstrating path, header, query parameter, and host matching. A typical rule might look like:

```yaml
# Partial HTTPRoute example
# ...
  rules:
  - matches:
    - path:
        type: PathPrefix # or Exact, or RegularExpression
        value: /service-a
    - headers:
      - type: Exact # or RegularExpression
        name: x-custom-header
        value: "specific-value"
    - queryParams:
      - type: Exact
        name: version
        value: "beta"
    backendRefs:
    - name: service-a-beta-backend
      port: 80
# ...
```

### Implementation Details
1. User defines match conditions (path, headers, query params, host) in the HTTPRoute creation UI.
2. Extension generates the corresponding `HTTPRoute` YAML.
3. Backend services are assumed to be deployed.
4. Gateway is configured to listen for requests matching the specified hostnames.

### User Experience
1. User selects "Create HTTPRoute" or modifies an existing one.
2. UI provides fields to add multiple match criteria (path, header, query param).
3. User can specify match types (e.g., Exact, Prefix, Regex for paths/headers).
4. UI validates the input and helps construct valid rules.
5. User applies the configuration and can test the routing behavior.

### Benefits of Request Attribute Matching
- **Flexible Routing**: Enables sophisticated routing scenarios beyond simple path matching.
- **Targeted Deployments**: Control which users or requests access specific service versions or features.
- **API Versioning**: Implement robust API versioning strategies.
- **Decoupling**: Allows frontend clients to use stable URLs/headers while backend implementations evolve.
- **Granular Control**: Precisely define how different types of requests are handled.

## Use Case 7: Timeouts

### Overview
Configure timeouts for requests flowing through the gateway. This can include request timeouts (total time allowed for the gateway to process a request, including the backend response) and backend timeouts (time allowed for a backend service to respond to a request from the gateway).

### When to Use
- **Preventing Long-Waiting Clients**: Ensure clients don't wait indefinitely for slow or unresponsive services.
- **Protecting Gateway Resources**: Free up gateway resources from requests that are taking too long.
- **Improving System Resilience**: Fail fast for unresponsive backends, preventing cascading failures.
- **Setting Realistic Expectations**: Define acceptable response times for different services.

### Sample YAML Configurations
Refer to `envoygateway.md` for detailed examples. Timeouts are typically configured within an `HTTPRoute`'s rules or potentially via policies attached to Gateways or Routes. A conceptual example for an HTTPRoute:

```yaml
# Partial HTTPRoute example with timeout concept
# ...
  rules:
  - backendRefs:
    # ... backendRefs ...
    # Specific timeout configuration might be via an attached policy or
    # directly in the route spec depending on Gateway API version and Envoy Gateway features.
    # For instance, an EnvoyPatchPolicy or a future standard timeout field.
    # Example (hypothetical standard field, actual mechanism may vary):
    timeouts:
      request: 5s       # Total request timeout
      backendRequest: 3s # Timeout for individual backend calls
# ...
```
*Note: The exact mechanism (e.g., `EnvoyPatchPolicy`, direct fields in `HTTPRoute.spec.rules.timeouts`) depends on the specific version and features of Envoy Gateway and Gateway API being used.*

### Implementation Details
1. User configures timeout values (e.g., request timeout, backend timeout) in the UI, likely when creating/editing an HTTPRoute or an associated policy.
2. Extension translates these settings into the appropriate Envoy Gateway configuration (e.g., modifying HTTPRoute YAML or creating/modifying a policy resource).
3. Testing involves sending requests that are expected to be slow and observing if the gateway enforces the timeout.

### User Experience
1. User finds timeout settings within HTTPRoute configuration or a dedicated "Resilience Policies" section.
2. UI provides fields for request timeout and potentially per-try/backend timeouts.
3. User receives feedback on successful application of timeout policies.
4. Testing tools might allow simulating slow responses to verify timeout behavior.

### Benefits of Configuring Timeouts
- **Improved Client Experience**: Clients receive timely responses or errors instead of hanging indefinitely.
- **Increased System Stability**: Prevents resource exhaustion due to slow requests.
- **Predictable Performance**: Helps maintain overall system responsiveness.
- **Faster Failure Detection**: Quickly identify and isolate unresponsive backend services.

## Use Case 8: Retries

### Overview
Configure automatic retries for requests to backend services that fail or return specific error codes. This can help improve the resilience of applications by transparently handling transient network issues or temporary backend unavailability.

### When to Use
- **Handling Transient Errors**: Automatically retry requests that fail due to temporary network glitches or brief backend service interruptions (e.g., a pod restarting).
- **Improving Success Rates**: Increase the likelihood of a successful request completion for idempotent operations.
- **Masking Short-Lived Issues**: Provide a smoother experience for end-users by hiding temporary backend problems.
- **Idempotent Operations**: Best suited for operations that can be safely retried without causing unintended side effects (e.g., GET requests, or PUT/DELETE operations designed to be idempotent).

### Sample YAML Configurations
Refer to `envoygateway.md` for detailed examples. Retry policies are typically configured within an `HTTPRoute`'s rules or via attached policies. Conceptual example:

```yaml
# Partial HTTPRoute example with retry concept
# ...
  rules:
  - backendRefs:
    # ... backendRefs ...
    # Specific retry configuration might be via an attached policy or
    # directly in the route spec.
    # Example (hypothetical standard field or policy effect):
    retryPolicy:
      numRetries: 3
      retryOn: "connect-failure,refused-stream,5xx" # Conditions to retry on
      perTryTimeout: 1s
# ...
```
*Note: The exact mechanism depends on Envoy Gateway and Gateway API features.*

### Implementation Details
1. User defines retry parameters (number of retries, retry conditions like specific HTTP status codes, per-try timeout) in the UI.
2. Extension translates these into the appropriate Envoy Gateway configuration.
3. Testing involves simulating backend failures (e.g., returning 503 errors) and observing if the gateway performs retries.

### User Experience
1. User finds retry settings within HTTPRoute configuration or a "Resilience Policies" section.
2. UI allows specifying retry count, conditions (e.g., on 503 errors), and per-try timeouts.
3. User applies the policy and can test its effectiveness.
4. Observability tools (if integrated) might show retry attempts.

### Benefits of Configuring Retries
- **Increased Resilience**: Makes applications more tolerant to temporary backend issues.
- **Improved User Experience**: Reduces the number of user-visible errors due to transient problems.
- **Higher Availability**: Increases the effective availability of services by overcoming short-lived failures.
- **Simplified Client Logic**: Clients don't need to implement their own complex retry logic.

## Use Case 9: Advanced Load Balancing

### Overview
Beyond default round-robin load balancing, Envoy Gateway can support more advanced strategies to distribute traffic among backend instances. This includes strategies like Least Request, Ring Hash, Maglev, or Random, often configured via specific policies or settings associated with backend services referenced in an HTTPRoute.

### When to Use
- **Optimizing Resource Utilization**: Distribute load based on backend capacity or current load (e.g., Least Request).
- **Session Affinity/Stickiness**: Ensure requests from a particular client consistently go to the same backend instance (e.g., Ring Hash based on a header or cookie).
- **Specific Performance Characteristics**: Different strategies offer different trade-offs in terms of latency, connection reuse, and distribution fairness.
- **Stateful Applications**: When backend instances maintain session state and require sticky sessions.

### Sample YAML Configurations
Refer to `envoygateway.md` for detailed examples. Load balancing strategies are often configured using `BackendTrafficPolicy` or similar custom resources that target a `Service` or are referenced by an `HTTPRoute`.

```yaml
# Conceptual example of a BackendTrafficPolicy for load balancing
apiVersion: gateway.envoyproxy.io/v1alpha1 # Example API version
kind: BackendTrafficPolicy
metadata:
  name: my-service-lb-policy
  namespace: demo
spec:
  targetRef:
    group: "" # Core group
    kind: Service
    name: echo-service # The backend service to apply this policy to
  loadBalancer:
    type: LeastRequest # Other options: RoundRobin, RingHash, Random, Maglev
    # Additional config for RingHash, etc. might go here
    # ringHashConfig:
    #   minimumRingSize: 1024
    #   hashFunction: MURMUR_HASH_2
```
This policy would then be implicitly or explicitly associated with backendRefs in `HTTPRoute` resources that point to `echo-service`.

### Implementation Details
1. User selects a load balancing strategy and configures its parameters (if any) in the UI, likely when defining backend references in an HTTPRoute or through a dedicated policy management interface.
2. Extension generates the necessary configuration (e.g., `BackendTrafficPolicy` or modifies `HTTPRoute`).
3. Testing involves observing traffic distribution patterns under load.

### User Experience
1. When configuring backend services for an HTTPRoute, the UI might offer a selection of load balancing strategies.
2. Advanced options for specific strategies (like hash key for Ring Hash) could be available.
3. Users apply the configuration. Visualizations or metrics (if available) could help observe the load balancing behavior.

### Benefits of Advanced Load Balancing
- **Improved Performance**: Strategies like Least Request can lead to lower latency by avoiding overloaded instances.
- **Enhanced Scalability and Resilience**: Better distribution of load across available resources.
- **Session Persistence**: Essential for stateful applications requiring sticky sessions.
- **Tailored Traffic Management**: Choose the best strategy based on application needs and traffic patterns.

## Use Case 10: CORS (Cross-Origin Resource Sharing)

### Overview
Configure CORS policies at the gateway to allow or restrict web applications from different origins (domains, schemes, or ports) to make requests to your APIs. This is crucial for browser-based applications interacting with APIs hosted on different domains.

### When to Use
- **Exposing APIs to Web Applications**: When frontend JavaScript code running on `domain-a.com` needs to call APIs served from `api.domain-b.com`.
- **Single Page Applications (SPAs)**: SPAs often fetch data from backend APIs hosted on different origins.
- **Managing Cross-Domain Security**: Define which origins, methods, and headers are permissible for cross-origin requests.

### Sample YAML Configurations
Refer to `envoygateway.md` for detailed examples. CORS policies are often configured via `EnvoyPatchPolicy` targeting an `HTTPRoute` or `Gateway`, or through dedicated CORS fields if available in the Gateway API resources.

```yaml
# Conceptual example using EnvoyPatchPolicy for CORS
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyPatchPolicy
metadata:
  name: cors-policy
  namespace: demo
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute # Or Gateway
    name: my-api-route
  type: Replace # Or Merge
  jsonPatches:
    - op: add # Or replace
      path: "/virtualHost/cors" # Path might vary based on Envoy config structure
      value:
        allowOriginStringMatch:
          - prefix: "https://*.safe-domain.com"
          - exact: "https://specific-origin.com"
        allowMethods: "GET, POST, OPTIONS, PUT, DELETE"
        allowHeaders: "Authorization, Content-Type, X-Custom-Header"
        exposeHeaders: "X-Custom-Response-Header"
        maxAge: "1728000" # 20 days
        allowCredentials: true
```

### Implementation Details
1. User defines CORS parameters (allowed origins, methods, headers, expose headers, max age, allow credentials) in the UI, likely associated with an HTTPRoute or Gateway.
2. Extension generates the appropriate `EnvoyPatchPolicy` or configures CORS fields in Gateway API resources.
3. Testing involves making requests from a web page hosted on a different origin.

### User Experience
1. UI provides a section for CORS configuration when creating/editing HTTPRoutes or Gateways.
2. User can specify allowed origins (including wildcards), methods, headers, etc.
3. After applying, the user can test cross-origin requests using browser developer tools or a test frontend.

### Benefits of CORS
- **Secure Cross-Origin API Access**: Enables secure interaction between web frontends and backend APIs on different domains.
- **Centralized Policy**: Manage CORS rules at the gateway instead of in each backend application.
- **Flexibility**: Define granular policies for different routes or services.
- **Standard Compliance**: Adheres to the W3C CORS specification.

## Use Case 11: IP Allow/Deny Lists

### Overview
Restrict access to APIs based on the client's source IP address or a range of IP addresses. This can be used to allow traffic only from trusted sources or block traffic from known malicious IPs.

### When to Use
- **Securing Internal APIs**: Allow access only from specific internal network ranges.
- **Blocking Malicious Actors**: Deny access from IP addresses known for abuse or attacks.
- **Geo-Restriction (Basic)**: Approximate geo-blocking by allowing/denying IP blocks associated with certain regions (less precise than dedicated geo-IP services).
- **Compliance**: Meet requirements to restrict access to sensitive services from specific locations or networks.

### Sample YAML Configurations
Refer to `envoygateway.md`. IP filtering is typically implemented using an `EnvoyPatchPolicy` or a similar mechanism that modifies Envoy's network filters or HTTP filter chain.

```yaml
# Conceptual example using EnvoyPatchPolicy for IP Filtering
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyPatchPolicy
metadata:
  name: ip-filter-policy
  namespace: demo
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway # Often applied at the listener level
    name: demo-gateway
    # sectionName: http # To target a specific listener
  type: Merge
  jsonPatches:
    - op: add
      path: "/listenerFilters/-" # Path to add a new listener filter
      value:
        name: "envoy.filters.network.rbac"
        typedConfig:
          "@type": "type.googleapis.com/envoy.extensions.filters.network.rbac.v3.RBAC"
          rules:
            action: ALLOW # or DENY
            policies:
              "allow-trusted-ips":
                permissions:
                  - any: true
                principals:
                  - remoteIp:
                      addressPrefix: "192.168.1.0"
                      prefixLen: 24
                  - remoteIp:
                      addressPrefix: "10.0.0.5"
                      prefixLen: 32
          # shadow_rules for DENY action to log what would be denied
          # enforcement_mode for DENY action
```
*Note: The exact Envoy filter and configuration path can vary. This example uses RBAC filter for IP-based control.*

### Implementation Details
1. User specifies IP addresses or CIDR ranges for allow or deny lists in the UI.
2. Extension generates the appropriate `EnvoyPatchPolicy` or other configuration to implement IP filtering.
3. Testing involves making requests from allowed and denied IP addresses.

### User Experience
1. UI provides a section for IP filtering policies, associable with Gateways or specific listeners/routes.
2. User can input lists of IPs/CIDRs and choose "allow" or "deny" mode.
3. After applying, access from different IPs can be tested.

### Benefits of IP Allow/Deny Listing
- **Enhanced Security**: Provides a layer of network-level access control.
- **Protection Against Unauthorized Access**: Restricts access to trusted IP ranges.
- **Mitigation of Simple Attacks**: Can block traffic from known malicious IPs.
- **Compliance**: Helps fulfill specific access control requirements.

## Use Case 12: Mutual TLS (mTLS) between Client and Gateway

### Overview
Implement Mutual TLS (mTLS) where both the client and the gateway (server) authenticate each other using X.509 certificates. This provides stronger authentication than one-way TLS.

### When to Use
- **Securing Service-to-Service Communication**: When services acting as clients need to securely authenticate to the gateway.
- **High-Security APIs**: For APIs requiring strong client authentication beyond tokens or API keys.
- **B2B Integrations**: When external business partners need to securely connect to your services.
- **Zero Trust Architectures**: As part of a defense-in-depth strategy where every connection is verified.

### Sample YAML Configurations
Refer to `envoygateway.md`. mTLS configuration involves updating the Gateway listener's TLS settings to require client certificates and specifying a CA bundle to validate them.

```yaml
# Partial Gateway listener example for mTLS
# ...
  listeners:
  - name: https-mtls
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs: # Server's certificate
      - name: my-gateway-server-cert-secret
      clientValidation: # mTLS specific part
        caCertificateRefs:
        - name: client-ca-bundle-secret # Secret containing CAs that signed client certs
          kind: Secret
          group: "" # Core group
    allowedRoutes:
      namespaces:
        from: Same
# ...
```
A `Secret` named `client-ca-bundle-secret` would contain the `ca.crt` with trusted client CAs.

### Implementation Details
1. User provides the CA certificate(s) for validating client certificates. This is typically uploaded as a Kubernetes Secret.
2. User configures a Gateway listener for HTTPS and enables mTLS, referencing the server certificate and the client CA bundle.
3. Extension updates the Gateway resource.
4. Testing requires a client capable of presenting a client certificate signed by one of the trusted CAs.

### User Experience
1. UI provides options in Gateway listener configuration to enable mTLS.
2. User can specify the Kubernetes Secret containing the client CA bundle.
3. After configuration, testing requires a client tool (like `curl` with client cert/key flags) or a client application configured for mTLS.

### Benefits of mTLS
- **Strong Authentication**: Provides robust, two-way cryptographic authentication.
- **Enhanced Security**: Ensures that only trusted clients (possessing valid, signed certificates) can connect to the gateway.
- **Data Integrity and Confidentiality**: Inherits these from standard TLS.
- **Defense in Depth**: Adds an additional layer of security beyond network controls or token-based auth.
```

This adds the new use case sections (Request Attribute Matching, Timeouts, Retries, Advanced Load Balancing, CORS, IP Allow/Deny Lists, Mutual TLS) with their respective sub-sections. It also adds "When to Use" and "Benefits" to the existing use cases. The YAML for new use cases is either a placeholder or a very high-level conceptual example, with a note to refer to `envoygateway.md` for specifics due to the current constraints.

## **📋 Planned Use Cases (Future Releases)**

The following use cases represent the roadmap for expanding the extension beyond basic Gateway and HTTPRoute management. These are organized by development priority and expected release timeframe.

### **Phase 2: Security Policy Management (v0.7.0)**

#### **Use Case 2: TLS Termination** ❌ **PLANNED**
- **Current Status**: Basic TLS listener configuration supported
- **Missing Features**: Advanced certificate management, automatic certificate provisioning, certificate rotation monitoring
- **Implementation Plan**: Integration with cert-manager, visual certificate lifecycle management, mTLS configuration

#### **Use Case 3: JWT Authentication** ❌ **PLANNED**  
- **Current Status**: Not supported
- **Planned Features**: JWT provider configuration, token validation rules, claim extraction, integration with HTTPRoute authorization
- **Implementation Plan**: SecurityPolicy resource management, authentication provider wizard, JWT testing tools

#### **Use Case 4: CORS Configuration** ❌ **PLANNED**
- **Current Status**: Not supported  
- **Planned Features**: Origin, method, header configuration, credential handling, preflight management
- **Implementation Plan**: CORS policy templates, integration with SecurityPolicy resources

#### **Use Case 5: Basic Authentication** ❌ **PLANNED**
- **Current Status**: Not supported
- **Planned Features**: Username/password configuration via Kubernetes Secrets, integration with HTTPRoute authorization
- **Implementation Plan**: Secret management interface, authentication policy configuration

### **Phase 3: Traffic Policy Management (v0.8.0)**

#### **Use Case 6: Rate Limiting** ❌ **PLANNED**
- **Current Status**: Not supported
- **Planned Features**: Per-client rate limiting, global rate limiting policies, rate limit monitoring and alerts
- **Implementation Plan**: ClientTrafficPolicy and BackendTrafficPolicy support, rate limiting visualization

#### **Use Case 7: Traffic Splitting (Canary Deployments)** ❌ **PLANNED**
- **Current Status**: Basic backend weighting supported in HTTPRoute
- **Missing Features**: Visual traffic splitting interface, gradual rollout automation, canary deployment monitoring
- **Implementation Plan**: Enhanced UI for traffic distribution, integration with deployment strategies

#### **Use Case 8: Circuit Breakers and Resilience** ❌ **PLANNED**
- **Current Status**: Basic timeout configuration supported
- **Planned Features**: Circuit breaker patterns, retry policies with exponential backoff, health check configuration
- **Implementation Plan**: BackendTrafficPolicy implementation, resilience pattern visualization

#### **Use Case 9: Load Balancing Strategies** ❌ **PLANNED**
- **Current Status**: Basic backend service selection supported
- **Planned Features**: Load balancing algorithm configuration, health check integration, session affinity
- **Implementation Plan**: Advanced backend configuration, load balancing strategy visualization

### **Phase 4: Multi-Protocol Support (v0.9.0)**

#### **Use Case 10: TCP/UDP Routing** ❌ **PLANNED**
- **Current Status**: HTTP/HTTPS only
- **Planned Features**: TCPRoute and UDPRoute resource management, port-based routing configuration
- **Implementation Plan**: Multi-protocol UI components, protocol-specific routing rules

#### **Use Case 11: gRPC Support** ❌ **PLANNED**  
- **Current Status**: HTTP routing only
- **Planned Features**: gRPC method matching, gRPC-specific load balancing, gRPC health checks
- **Implementation Plan**: gRPC-aware routing configuration, gRPC testing tools

#### **Use Case 12: Advanced TLS (mTLS)** ❌ **PLANNED**
- **Current Status**: Basic TLS termination
- **Planned Features**: Mutual TLS configuration, client certificate validation, trust policy management
- **Implementation Plan**: mTLS configuration wizard, certificate authority management

### **Phase 5: Advanced Envoy Features (v1.0.0)**

#### **Use Case 13: Custom Envoy Configuration** ❌ **PLANNED**
- **Current Status**: Standard Envoy Gateway configuration only
- **Planned Features**: EnvoyProxy custom resources, bootstrap configuration, extension integration
- **Implementation Plan**: Direct Envoy configuration interface, custom filter management

#### **Use Case 14: Observability Integration** ❌ **PLANNED**
- **Current Status**: Basic resource status monitoring
- **Planned Features**: Metrics visualization, distributed tracing integration, performance monitoring
- **Implementation Plan**: Prometheus/Grafana integration, trace visualization tools

## **Current Extension Scope vs. Production Requirements**

### **✅ What the Extension Handles Well**
- **Local Development**: Perfect for learning and prototyping basic HTTP routing
- **Gateway API Education**: Visual understanding of Gateway and HTTPRoute concepts  
- **Basic Testing**: Built-in HTTP client for immediate validation
- **Quick Setup**: One-click deployment of working examples

### **❌ What Requires External Tools**
- **Policy Management**: Use kubectl, Helm, or CI/CD pipelines for security and traffic policies
- **Production Deployment**: Export generated YAML for production toolchains
- **Advanced TLS**: Use cert-manager or external certificate management
- **Multi-Environment**: Use GitOps or configuration management tools
- **Resource Editing**: Currently requires delete/recreate or external YAML editing

### **🎯 Target Users by Phase**
- **Current (v0.5.x)**: Developers learning Gateway API, teams prototyping basic HTTP routing
- **Phase 2 (v0.7.0)**: Teams needing security policies in development environments  
- **Phase 3 (v0.8.0)**: DevOps engineers testing traffic management strategies
- **Phase 4+ (v0.9.0+)**: Platform engineers evaluating comprehensive gateway solutions

This roadmap ensures the extension evolves from a learning and prototyping tool to a comprehensive gateway management platform while maintaining its core strength of making complex concepts accessible through visual interfaces.
