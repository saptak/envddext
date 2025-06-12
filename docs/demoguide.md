# Envoy Gateway Docker Desktop Extension: Comprehensive Demo Guide

This guide provides step-by-step instructions to demonstrate the key capabilities of the Envoy Gateway Docker Desktop Extension. It covers basic setup through advanced traffic management, security features, and operational monitoring using the extension's intuitive tabbed interface.

## Table of Contents

1.  [Prerequisites](#prerequisites)
2.  [Demo 1: Basic HTTP Routing with Sample Applications](#demo-1-basic-http-routing-with-sample-applications)
    *   [Step 1.1: Deploy Sample Applications via Templates](#step-11-deploy-sample-applications-via-templates)
    *   [Step 1.2: Create a Gateway Resource](#step-12-create-a-gateway-resource)
    *   [Step 1.3: Create HTTPRoutes for Service Exposure](#step-13-create-httproutes-for-service-exposure)
    *   [Step 1.4: Test Access via HTTP Testing Tab](#step-14-test-access-via-http-testing-tab)
3.  [Demo 2: Advanced Request Matching and Traffic Splitting](#demo-2-advanced-request-matching-and-traffic-splitting)
    *   [Step 2.1: Header-Based and Method-Based Routing](#step-21-header-based-and-method-based-routing)
    *   [Step 2.2: Traffic Splitting Between Service Versions](#step-22-traffic-splitting-between-service-versions)
    *   [Step 2.3: Testing Advanced Routing Logic](#step-23-testing-advanced-routing-logic)
4.  [Demo 3: LoadBalancer Management and Gateway Operations](#demo-3-loadbalancer-management-and-gateway-operations)
    *   [Step 3.1: MetalLB Configuration and Status Monitoring](#step-31-metallb-configuration-and-status-monitoring)
    *   [Step 3.2: Gateway IP Assignment and Troubleshooting](#step-32-gateway-ip-assignment-and-troubleshooting)
    *   [Step 3.3: Proxy Manager for Advanced Operations](#step-33-proxy-manager-for-advanced-operations)
5.  [Demo 4: TLS Configuration and HTTPS](#demo-4-tls-configuration-and-https)
    *   [Step 4.1: HTTPS Gateway with TLS Termination](#step-41-https-gateway-with-tls-termination)
    *   [Step 4.2: Testing HTTPS Connectivity](#step-42-testing-https-connectivity)
6.  [Demo 5: Monitoring and Observability](#demo-5-monitoring-and-observability)
    *   [Step 5.1: Gateway and HTTPRoute Status Monitoring](#step-51-gateway-and-httproute-status-monitoring)
    *   [Step 5.2: Deployment Status and Troubleshooting](#step-52-deployment-status-and-troubleshooting)

---

## Prerequisites

Before starting the demos, ensure you have the following components properly configured:

### 1. Core Infrastructure
*   **Docker Desktop**: Version 4.0+ with Kubernetes enabled
    *   Enable Kubernetes: Docker Desktop → Settings → Kubernetes → Enable Kubernetes
    *   Ensure adequate resource allocation (4GB RAM minimum recommended)
*   **Envoy Gateway Extension**: Latest version from Docker Desktop Extension Marketplace (v0.6.0+)
    *   The extension features a modern responsive tabbed interface with 6 main sections:
        - **Resources**: Enhanced visual resource cards, relationship visualization, and resource management actions
        - **Gateway Management**: Gateway creation and configuration
        - **HTTPRoute Management**: HTTPRoute creation and routing rules
        - **Deployment Status**: Real-time deployment monitoring
        - **HTTP Testing**: Built-in client for testing endpoints
        - **Proxy Manager**: Kubectl proxy lifecycle management

### 2. LoadBalancer Configuration (Critical)
The extension offers to configure MetalLB for Gateway IP assignment in Docker Desktop environments if it does not detect an exisiting load balancer:

1.  Navigate to the **Gateway Management** tab in the extension
2.  Locate the **LoadBalancer Configuration** section
3.  If status shows "NOT CONFIGURED":
    *   Click **"Configure LoadBalancer"** button
    *   Enable **"Auto-detect IP range"** (automatically detects Docker's bridge network)
    *   Click **"Install & Configure"** to deploy MetalLB with optimal settings
    *   Monitor progress until status shows **"CONFIGURED"** with **"Provider: METALLB"**

### 3. Envoy Gateway Installation
The extension automatically detects and can install Envoy Gateway:
*   If Envoy Gateway CRDs are missing, use the **Overview** tab's installation feature
*   Verify installation shows GatewayClass `envoy-gateway` as available
*   Check that control plane pods are running in `envoy-gateway-system` namespace

### 4. Verification Steps
Before proceeding with demos, confirm:
- [ ] Kubernetes cluster is running with sufficient resources
- [ ] MetalLB is configured and operational (LoadBalancer status: CONFIGURED)
- [ ] Envoy Gateway control plane is deployed and ready
- [ ] Extension UI loads successfully with all tabs accessible

---

## Demo 1: Basic HTTP Routing with Sample Applications

This demo demonstrates the fundamental Gateway API workflow: deploying applications, creating ingress resources, and routing external traffic to backend services.

### Step 1.1: Deploy Sample Applications via Templates

The extension provides GitHub-hosted templates for common use cases. We'll deploy multiple services to demonstrate routing capabilities.

1.  Navigate to the **Templates** tab in the extension
2.  **Deploy Echo Service**:
    *   Locate **"Echo Service - Basic HTTP"** template
    *   This template deploys `ealen/echo-server` with corresponding Kubernetes Service
    *   Click **"Apply Template"** - the extension fetches and applies the YAML from GitHub
    *   Monitor the notification for deployment status
3.  **Deploy Additional Services** (for advanced demos):
    *   Apply **"TLS Termination"** template for HTTPS examples
    *   Apply **"Traffic Splitting"** template for weighted routing demonstrations
4.  **Verify Deployments**:
    *   Templates typically deploy to the `demo` namespace
    *   Check the extension's deployment status indicators
    *   Alternative verification: `kubectl get pods,svc -n demo`
    *   Expected: `echo-service` pod in Running state with corresponding Service

### Step 1.2: Create a Gateway Resource

A Gateway defines an entry point for external traffic into your cluster, specifying listeners that accept connections on specific ports and protocols.

1.  Navigate to the **Gateway Management** tab
2.  Click **"+ Create Gateway"** to open the form interface
3.  **Configure Gateway Basic Settings**:
    *   **Gateway Name**: `demo-gateway`
    *   **Namespace**: Select `demo` (must match your deployed services)
    *   **Gateway Class**: Select `envoy-gateway` (managed by Envoy Gateway control plane)
4.  **Configure Listeners** (the extension provides intuitive listener management):
    *   **HTTP Listener** (default configuration):
        - **Name**: `http-listener`
        - **Port**: `80`
        - **Protocol**: `HTTP`
        - **Hostname**: Leave empty for wildcard matching
    *   **HTTPS Listener** (for TLS demos):
        - **Name**: `https-listener`
        - **Port**: `443`
        - **Protocol**: `HTTPS`
        - **TLS Mode**: `Terminate` (for TLS termination at gateway)
5.  **Route Attachment Configuration**:
    *   **Allowed Routes From**: `Same` (allows HTTPRoutes from same namespace)
    *   **Allowed Route Kinds**: Ensure `HTTPRoute` is selected
6.  Click **"Create Gateway"** and monitor the creation process

**Expected Behavior**: Gateway transitions through `Pending` → `Programmed` → `Ready` states. MetalLB assigns an external IP from the configured pool (e.g., `172.18.200.1`).

### Step 1.3: Create HTTPRoutes for Service Exposure

HTTPRoutes define how requests are matched and routed to backend services. The extension provides comprehensive routing configuration capabilities.

1.  Navigate to the **HTTPRoute Management** tab in the extension
2.  Click **"+ Create HTTPRoute"** to open the routing form
3.  **Basic HTTPRoute Configuration**:
    *   **Route Name**: `echo-basic-route`
    *   **Namespace**: Select `demo` (same as Gateway namespace)
    *   **Parent Gateway**: Select `demo-gateway` (created in previous step)
4.  **Hostname Configuration** (optional but recommended):
    *   **Hostnames**: `echo.local.demo` (enables host-based routing)
    *   For local testing, add to `/etc/hosts`: `<GATEWAY_IP> echo.local.demo`
5.  **Routing Rules Configuration**:
    *   **Rule 1 - Basic Path Matching**:
        - **Matches**: Click **"+ Add Match"**
            - **Path Type**: `PathPrefix`
            - **Path Value**: `/` (matches all paths)
            - **Method**: `GET` (optional: restrict to specific HTTP methods)
        - **Backend References**: Click **"+ Add Backend Ref"**
            - **Service Name**: `echo-service`
            - **Port**: `80`
            - **Weight**: `100` (full traffic allocation)
6.  **Advanced Matching** (demonstrated in later demos):
    *   Header-based routing with custom headers
    *   Method-specific routing (GET, POST, PUT, DELETE)
    *   Query parameter matching for API versioning
7.  Click **"Create HTTPRoute"** and verify successful creation

**Expected Behavior**: HTTPRoute shows status `Accepted: True` and `ResolvedRefs: True`, indicating successful Gateway attachment and backend service resolution.

### Step 1.4: Test Access via HTTP Testing Tab

The extension includes a built-in HTTP client for testing Gateway endpoints without external tools.

1.  **Identify Gateway External IP**:
    *   In **Gateway Management** tab, find `demo-gateway`
    *   Note the **External IP** assigned by MetalLB (e.g., `172.18.200.1`)
    *   Status should show `Ready` with `Addresses` populated

2.  **Using the Built-in HTTP Testing Tab**:
    *   Navigate to the **HTTP Testing** tab
    *   **Configure Request**:
        - **URL**: `http://172.18.200.1/` (or `http://echo.local.demo/` if hostname configured)
        - **Method**: `GET`
        - **Headers** (optional): Add `Host: echo.local.demo` if using hostname routing
    *   Click **"Send Request"** and examine the response

3.  **Expected Response from Echo Service**:
    ```json
    {
      "method": "GET",
      "path": "/",
      "headers": {
        "host": "echo.local.demo",
        "user-agent": "extension-http-client",
        "x-forwarded-for": "172.18.0.1",
        "x-envoy-external-address": "172.18.0.1"
      },
      "body": "",
      "fresh": false,
      "hostname": "echo.local.demo",
      "ip": "::ffff:10.244.0.1",
      "ips": [],
      "protocol": "http",
      "query": {},
      "subdomains": [],
      "xhr": false
    }
    ```

4.  **Alternative Command-Line Testing**:
    ```bash
    # Direct IP access
    curl http://172.18.200.1/

    # With hostname (requires /etc/hosts entry)
    curl -H "Host: echo.local.demo" http://172.18.200.1/
    ```

**Success Criteria**: JSON response confirms request routing through Gateway → HTTPRoute → Echo Service, demonstrating successful traffic flow.

**Resource Visualization**: Navigate to the **Resources** tab to see the visual representation of your created Gateway and HTTPRoute with their connection relationships displayed in an intuitive card-based interface.

---

## Demo 2: Advanced Request Matching and Traffic Splitting

This demo explores sophisticated routing capabilities including header-based routing, HTTP method matching, and weighted traffic distribution between service versions.

### Step 2.1: Header-Based and Method-Based Routing

Building on Demo 1, we'll create advanced routing rules that demonstrate the full power of Gateway API request matching.

1.  **Deploy Version-Specific Services**:
    *   Apply additional templates or manually deploy versioned services:
        - `echo-service-v1` (existing service)
        - `echo-service-v2` (new version with different response)

2.  **Create Advanced HTTPRoute - Version Routing**:
    *   Navigate to **HTTPRoute Management** tab → **+ Create HTTPRoute**
    *   **Route Name**: `echo-advanced-route`
    *   **Parent Gateway**: `demo-gateway`
    *   **Configure Multiple Rules**:

    **Rule 1 - Header-Based Routing to v2**:
    ```yaml
    matches:
      - path:
          type: PathPrefix
          value: /api
        headers:
          - name: "version"
            value: "2"
        method: GET
    backendRefs:
      - name: echo-service-v2
        port: 80
    ```

    **Rule 2 - Method-Specific Routing**:
    ```yaml
    matches:
      - path:
          type: PathPrefix
          value: /api
        method: POST
    backendRefs:
      - name: echo-service-v1
        port: 80
    ```

    **Rule 3 - Default Fallback**:
    ```yaml
    matches:
      - path:
          type: PathPrefix
          value: /api
    backendRefs:
      - name: echo-service-v1
        port: 80
    ```

### Step 2.2: Traffic Splitting Between Service Versions

Implement weighted traffic distribution for canary deployments and A/B testing.

1.  **Create Traffic Splitting HTTPRoute**:
    *   **Route Name**: `echo-traffic-split`
    *   **Parent Gateway**: `demo-gateway`
    *   **Hostname**: `canary.local.demo`

2.  **Configure Weighted Backend References**:
    ```yaml
    rules:
      - matches:
          - path:
              type: PathPrefix
              value: /
        backendRefs:
          - name: echo-service-v1
            port: 80
            weight: 80    # 80% of traffic
          - name: echo-service-v2
            port: 80
            weight: 20    # 20% of traffic
    ```

3.  **Weight Configuration via Extension UI**:
    *   The extension provides text input fields for weight values
    *   Multiple backend references can be configured with individual weights
    *   Weight validation ensures proper numeric values

### Step 2.3: Testing Advanced Routing Logic

Use the extension's HTTP Testing tab to validate complex routing behavior.

1.  **Header-Based Routing Tests**:
    ```bash
    # Routes to v2 service
    curl -H "version: 2" http://172.18.200.1/api
    
    # Routes to v1 service (default)
    curl http://172.18.200.1/api
    ```

2.  **Method-Specific Routing Tests**:
    ```bash
    # POST requests route to v1
    curl -X POST http://172.18.200.1/api
    
    # GET requests with version header route to v2
    curl -H "version: 2" http://172.18.200.1/api
    ```

3.  **Traffic Splitting Verification**:
    *   Send 100 requests to `canary.local.demo`
    *   Monitor responses to verify ~80/20 distribution
    *   Use extension's request history to track routing patterns

4.  **Extension HTTP Testing Features**:
    *   **Request History**: Track and replay previous requests
    *   **Response Display**: View detailed response data including headers and body
    *   **cURL Generation**: Generate equivalent cURL commands for external testing
    *   **Method/Header Configuration**: Configure HTTP methods and custom headers

---

## Demo 3: LoadBalancer Management and Gateway Operations

This demo explores the extension's comprehensive LoadBalancer management capabilities and advanced Gateway operations.

### Step 3.1: MetalLB Configuration and Status Monitoring

The extension provides real-time LoadBalancer monitoring and management capabilities.

1.  **LoadBalancer Status Dashboard**:
    *   Navigate to **Gateway Management** tab
    *   Locate **LoadBalancer Configuration** section
    *   **Status Indicators**:
        - **Configuration Status**: `CONFIGURED` vs `NOT CONFIGURED`
        - **Provider**: `METALLB` (shows detected provider)
        - **Version**: Active MetalLB version
        - **Health Status**: Real-time controller and speaker pod status

2.  **IP Address Pool Management**:
    *   **Active Pools**: View configured IPAddressPools
        - Pool name (e.g., `docker-desktop-pool`)
        - IP range (e.g., `172.18.200.1-172.18.200.100`)
        - Available vs. allocated addresses
    *   **Pool Utilization**: Monitor IP allocation across Gateways
    *   **Auto-Configuration**: Extension detects Docker network ranges

3.  **Advanced LoadBalancer Operations**:
    *   **Reconfigure LoadBalancer**: Modify IP ranges without cluster restart
    *   **Remove LoadBalancer**: Clean uninstall with resource cleanup
    *   **Status Refresh**: Real-time status updates via backend API

### Step 3.2: Gateway IP Assignment and Troubleshooting

Understand Gateway lifecycle and IP allocation troubleshooting.

1.  **Gateway Lifecycle Monitoring**:
    *   **Creation Phase**: `Pending` → `Programmed` → `Ready`
    *   **IP Assignment**: MetalLB allocation from available pool
    *   **Status Conditions**: Detailed condition information for troubleshooting

2.  **IP Assignment Verification**:
    *   **Gateway Addresses**: View assigned external IPs
    *   **LoadBalancer Service**: Backend service receiving the IP
    *   **Pool Allocation**: Confirm IP allocation from correct pool

3.  **Troubleshooting Features**:
    *   **Deployment Troubleshooter**: Built-in diagnostic tool
    *   **Pod Status Monitoring**: Real-time pod health indicators
    *   **Event Log**: Kubernetes events related to Gateway operations
    *   **Resource Inspection**: Detailed YAML viewing and editing

### Step 3.3: Proxy Manager for Advanced Operations

The Proxy Manager tab provides kubectl proxy lifecycle management for advanced debugging.

1.  **Proxy Status Monitoring**:
    *   **Connection Status**: Active/Inactive proxy status
    *   **PID Tracking**: Process identification and management
    *   **Port Configuration**: Default port 8001 with customization

2.  **Proxy Operations**:
    *   **Start Proxy**: `kubectl proxy --port=8001 &`
    *   **Stop Proxy**: Graceful process termination with PID cleanup
    *   **Status Refresh**: Real-time proxy status updates

3.  **Advanced Debugging Use Cases**:
    *   **API Server Access**: Direct Kubernetes API exploration
    *   **Resource Inspection**: Raw resource data access
    *   **Troubleshooting**: Deep cluster state investigation
    *   **Development Support**: Extension development and testing

---

## Demo 4: TLS Configuration and HTTPS

This demo explores configuring secure HTTPS endpoints using Envoy Gateway's TLS termination capabilities through the extension's interface.

### Step 4.1: HTTPS Gateway with TLS Termination

Configure secure HTTPS endpoints with TLS certificate management using the extension's built-in TLS support.

1.  **Deploy TLS Template**:
    *   Navigate to the **Templates** tab
    *   Locate the **"TLS Termination"** template
    *   Click **"Apply Template"** to deploy TLS infrastructure
    *   This template sets up necessary certificates for HTTPS demos

2.  **Create HTTPS Gateway via Extension**:
    *   Navigate to **Gateway Management** tab
    *   Click **"+ Create Gateway"**
    *   **Basic Configuration**:
        - **Gateway Name**: `secure-gateway`
        - **Namespace**: `demo`
        - **Gateway Class**: `envoy-gateway`
    
3.  **Configure HTTPS Listener**:
    *   In the Gateway creation form, configure listeners:
    *   **HTTPS Listener Settings**:
        - **Name**: `https-listener`
        - **Port**: `443`
        - **Protocol**: `HTTPS` (select from dropdown)
        - **TLS Mode**: `Terminate`
        - **Certificate Name**: Enter certificate name from template
        - **Hostname**: `secure.local.demo` (optional)

4.  **Create HTTPS HTTPRoute**:
    *   After Gateway creation, create HTTPRoute:
    *   **Route Configuration**:
        - **Route Name**: `secure-echo-route`
        - **Parent Gateway**: `secure-gateway`
        - **Hostname**: `secure.local.demo`
        - **Path**: `/` (PathPrefix)
        - **Backend Service**: `echo-service`
        - **Port**: `80`

### Step 4.2: Testing HTTPS Connectivity

Verify HTTPS functionality using the extension's HTTP testing capabilities and external tools.

1.  **Using Extension HTTP Testing Tab**:
    *   Navigate to **HTTP Testing** tab
    *   **Test HTTPS Endpoint**:
        - **URL**: `https://<GATEWAY_HTTPS_IP>/` (use the secure gateway's IP)
        - **Method**: `GET`
        - **Headers**: Add `Host: secure.local.demo` if using hostname
    *   Click **"Send Request"** and verify successful HTTPS response

2.  **External Testing with cURL**:
    ```bash
    # Test HTTPS endpoint (allow self-signed certificates)
    curl -k https://172.18.200.2/
    
    # Test with hostname
    curl -k -H "Host: secure.local.demo" https://172.18.200.2/
    ```

3.  **Certificate Verification**:
    ```bash
    # Verify certificate information
    openssl s_client -connect 172.18.200.2:443 -servername secure.local.demo -showcerts
    
    # Check certificate details
    echo | openssl s_client -connect 172.18.200.2:443 2>/dev/null | openssl x509 -noout -text
    ```

4.  **Extension Features for HTTPS Testing**:
    *   **Built-in cURL Generation**: Use the extension's cURL tab to generate HTTPS commands
    *   **Request History**: Track HTTPS requests and responses
    *   **Response Analysis**: Examine HTTPS response headers and body
    *   **Certificate Troubleshooting**: Monitor Gateway status for TLS-related issues

**Expected Results**:
- HTTPS Gateway shows `Ready` status with assigned IP address
- HTTPRoute shows `Accepted` and `ResolvedRefs` as `True`
- HTTPS requests return successful responses with proper TLS encryption
- Extension's HTTP client successfully connects via HTTPS

---

## Demo 5: Monitoring and Observability

This final demo covers the extension's monitoring capabilities and operational best practices.

### Step 5.1: Gateway and HTTPRoute Status Monitoring

The extension provides comprehensive status monitoring for all Gateway API resources through enhanced visual interfaces.

1.  **Enhanced Resource Cards (v0.6.0)**:
    *   Navigate to the **Resources** tab to access the new visual resource management interface
    *   **Gateway Cards**: Display comprehensive information including:
        - Status indicators with color-coded icons (Ready/Warning/Error)
        - External IP addresses and LoadBalancer status
        - Listener configuration (ports, protocols)
        - Attached route count and connection status
    *   **HTTPRoute Cards**: Show detailed routing information including:
        - Parent Gateway connections with visual indicators
        - Hostname and path configuration
        - Backend service references and health status
        - Rule count and routing configuration summary

2.  **Interactive Resource Visualization**:
    *   **Connection Flow**: Visual representation showing Gateway → HTTPRoute relationships
    *   **Status Legend**: Comprehensive legend explaining all visual indicators
    *   **Resource Actions**: Click-to-view YAML, delete resources, and refresh status
    *   **Real-time Updates**: Live status updates with visual feedback

3.  **Resource Management Actions**:
    *   **View YAML Configuration**: Click any resource card to view detailed YAML
    *   **Delete Resources**: Safe deletion with confirmation dialogs
    *   **Status Refresh**: Individual and bulk resource status updates
    *   **Error Diagnostics**: Detailed error messages with resolution guidance

### Step 5.2: Deployment Status and Troubleshooting

Leverage the extension's troubleshooting tools for operational excellence.

1.  **Deployment Status Monitor**:
    *   **Pod Health Tracking**: Real-time pod status across namespaces
    *   **Service Connectivity**: Backend service health verification
    *   **Resource Dependencies**: Dependency chain validation

2.  **Troubleshooting Tools**:
    *   **Built-in Diagnostics**: Automated problem detection
    *   **Resource Inspector**: YAML configuration review
    *   **Event Analysis**: Kubernetes event correlation
    *   **Log Access**: Direct access to relevant logs

3.  **Operational Best Practices**:
    *   **Status Monitoring**: Regular status dashboard review
    *   **Resource Validation**: Pre-deployment configuration validation
    *   **Performance Tracking**: Response time and error rate monitoring
    *   **Capacity Planning**: LoadBalancer IP pool management

4.  **Advanced Troubleshooting Scenarios**:
    *   **Gateway Not Ready**: LoadBalancer, DNS, or configuration issues
    *   **HTTPRoute Not Accepted**: Parent reference or backend resolution failures
    *   **Service Connectivity**: Network policies or service mesh conflicts
    *   **TLS Certificate Issues**: Certificate expiration or configuration errors

---

## Conclusion

This comprehensive demo guide demonstrates the full capabilities of the Envoy Gateway Docker Desktop Extension:

- **Basic Operations**: Gateway and HTTPRoute creation with template deployment
- **Advanced Routing**: Header matching, method-based routing, and traffic splitting  
- **Infrastructure Management**: LoadBalancer configuration and proxy management
- **Security Features**: TLS termination and HTTPS endpoint configuration
- **Visual Resource Management (v0.6.0)**: Enhanced resource cards, relationship visualization, and interactive management actions
- **Monitoring & Troubleshooting**: Real-time status monitoring and diagnostic tools

The extension's enhanced tabbed interface provides intuitive visual access to core Envoy Gateway features while maintaining the power and flexibility of the underlying Gateway API. The new v0.6.0 resource visualization transforms resource management from text-based lists to rich, interactive visual experiences with professional card layouts, relationship mapping, and comprehensive resource actions.

### Next Steps

- **Explore v0.6.0 Features**: Discover the enhanced resource visualization and management capabilities
- **Use GitHub Templates**: Apply additional templates for complex scenarios
- **Advanced Configuration**: Experiment with Gateway API features through YAML configuration
- **Operational Excellence**: Review the troubleshooting guide for best practices
- **Custom Development**: Build custom templates for your specific use cases
- **Resource Management**: Leverage the new visual resource cards for efficient gateway management