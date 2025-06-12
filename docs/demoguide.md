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
    *   [Step 4.1: Certificate Management and Infrastructure Setup](#step-41-certificate-management-and-infrastructure-setup)
    *   [Step 4.2: HTTPS Gateway with TLS Termination](#step-42-https-gateway-with-tls-termination)
    *   [Step 4.3: Testing HTTPS Connectivity](#step-43-testing-https-connectivity)
6.  [Demo 5: Traffic Splitting & Canary Deployments](#demo-5-traffic-splitting--canary-deployments)
    *   [Step 5.1: Traffic Splitting Wizard Setup](#step-51-traffic-splitting-wizard-setup)
    *   [Step 5.2: Deployment Pattern Implementation](#step-52-deployment-pattern-implementation)
    *   [Step 5.3: Advanced Traffic Management](#step-53-advanced-traffic-management)
7.  [Demo 6: Synthetic Traffic Generation & Performance Testing](#demo-6-synthetic-traffic-generation--performance-testing)
    *   [Step 6.1: Advanced Traffic Generator Configuration](#step-61-advanced-traffic-generator-configuration)
    *   [Step 6.2: Performance Testing and Metrics Collection](#step-62-performance-testing-and-metrics-collection)
    *   [Step 6.3: Traffic Splitting Validation with Load Testing](#step-63-traffic-splitting-validation-with-load-testing)
8.  [Demo 7: Monitoring and Observability](#demo-7-monitoring-and-observability)
    *   [Step 7.1: Gateway and HTTPRoute Status Monitoring](#step-71-gateway-and-httproute-status-monitoring)
    *   [Step 7.2: Deployment Status and Troubleshooting](#step-72-deployment-status-and-troubleshooting)

---

## Prerequisites

Before starting the demos, ensure you have the following components properly configured:

### 1. Core Infrastructure
*   **Docker Desktop**: Version 4.0+ with Kubernetes enabled
    *   Enable Kubernetes: Docker Desktop → Settings → Kubernetes → Enable Kubernetes
    *   Ensure adequate resource allocation (4GB RAM minimum recommended)
*   **Envoy Gateway Extension**: Latest version from Docker Desktop Extension Marketplace (v0.8.1+)
    *   The extension features a modern responsive tabbed interface with 6 main sections:
        - **Dashboard**: Consolidated system overview with resource cards, health monitoring, and deployment status
        - **Gateway Management**: Gateway creation and configuration
        - **HTTPRoute Management**: HTTPRoute creation and routing rules
        - **Testing & Proxy**: Enhanced HTTP testing with reliable kubectl proxy management, comprehensive error handling, and seamless endpoint validation
        - **TLS Management**: Complete certificate lifecycle management with intelligent prerequisite detection and automated cert-manager installation
        - **Traffic Splitting**: Comprehensive canary deployment and traffic management with wizard-based setup, advanced controls, and synthetic traffic generation

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

2.  **Using the Built-in Testing & Proxy Tab**:
    *   Navigate to the **Testing & Proxy** tab
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

4.  **Extension Testing & Proxy Features**:
    *   **Proxy Management**: Start/stop kubectl proxy for internal service access
    *   **Request History**: Track and replay previous requests
    *   **Response Display**: View detailed response data including headers and body
    *   **cURL Generation**: Generate equivalent cURL commands for external testing
    *   **Unified Workflow**: Seamless proxy setup to HTTP testing workflow

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

This demo showcases the extension's comprehensive TLS Management capabilities, including intelligent prerequisite detection, automated cert-manager installation, and complete certificate lifecycle management for secure HTTPS endpoints.

### Step 4.1: Certificate Management and Infrastructure Setup

The extension provides end-to-end certificate management with automatic prerequisite detection and installation.

1.  **Access TLS Management Tab**:
    *   Navigate to the **TLS Management** tab in the extension
    *   The extension automatically checks for cert-manager prerequisites

2.  **Automatic Prerequisite Detection**:
    *   **CRD Detection**: Extension checks for `certificates.cert-manager.io` CRD
    *   **Status Indicators**: Visual feedback showing cert-manager installation status:
        - ⏳ **Checking**: "Checking for cert-manager..." with loading indicator
        - ⚠️ **Missing**: "Cert-manager Not Found" with installation option
        - ✅ **Ready**: "Certificate Management" interface with full functionality

3.  **One-Click Cert-manager Installation** (if needed):
    *   If cert-manager is not detected, you'll see an installation card:
        - **Warning Icon**: Clear indication that cert-manager is required
        - **Version Info**: "Cert-manager is required... Version v1.14.5 will be installed"
        - **Install Button**: "Install Cert-manager (v1.14.5)" button
    *   Click **"Install Cert-manager (v1.14.5)"** to begin automated installation:
        - **Progress Feedback**: "Installing cert-manager v1.14.5... This may take a few moments"
        - **Toast Notifications**: Real-time installation progress updates
        - **30-Second Wait**: Automatic wait for CRD registration
        - **Status Re-check**: Automatic verification of successful installation

4.  **Generate Self-Signed Certificate**:
    *   Once cert-manager is ready, the interface shows certificate management options
    *   Click **"Generate Certificate"** to open the certificate creation dialog
    *   **Certificate Configuration**:
        - **Certificate Name**: `demo-tls-cert`
        - **Namespace**: `demo` (matches your services)
        - **Issuer Type**: Select `Self-Signed (for testing)`
        - **DNS Names**: Add multiple domains as needed:
            - `secure.local.demo`
            - `api.local.demo`
            - `*.local.demo` (wildcard for subdomains)
    *   Click **"Generate Certificate"** to create the certificate
    *   **Status Monitoring**: Watch certificate status transition from `PENDING` → `READY`

5.  **Certificate Status Verification**:
    *   **Visual Indicators**: Color-coded status chips (READY = green, PENDING = yellow, FAILED = red)
    *   **Certificate Details**: View namespace, secret name, DNS names, and issuer information
    *   **Actions Available**: View certificate YAML or delete if needed

### Step 4.2: HTTPS Gateway with TLS Termination

Create secure HTTPS endpoints using the certificates generated in the TLS Management tab.

1.  **Create HTTPS Gateway with Certificate Integration**:
    *   Navigate to **Gateway Management** tab
    *   Click **"+ Create Gateway"**
    *   **Basic Configuration**:
        - **Gateway Name**: `secure-gateway`
        - **Namespace**: `demo`
        - **Gateway Class**: `envoy-gateway`

2.  **Configure HTTPS Listener with Certificate Selection**:
    *   Add a new listener or modify the default one:
    *   **HTTPS Listener Settings**:
        - **Name**: `https-listener`
        - **Port**: `443`
        - **Protocol**: Select `HTTPS` from dropdown
        - **TLS Mode**: Select `Terminate`
    *   **Certificate Selection** (Enhanced Integration):
        - **Certificate Secret**: Dropdown shows available certificates from TLS Management tab
        - Select `demo-tls-cert-tls` (the secret created by your certificate)
        - **Visual Indicators**: Certificates show status (Ready/Pending) with security icons
        - **Quick Access**: "Manage Certificates" button opens TLS Management directly

3.  **Alternative Certificate Management from Gateway Form**:
    *   **Integrated Workflow**: Click the security icon next to certificate selection
    *   **Direct Access**: Opens TLS Management dialog within Gateway creation
    *   **Seamless Experience**: Create certificates without leaving Gateway configuration

4.  **Complete Gateway Creation**:
    *   **Route Configuration**: Set `Allowed Routes From` to `Same`
    *   **Route Kinds**: Ensure `HTTPRoute` is selected
    *   Click **"Create Gateway"** and monitor creation progress
    *   **Expected Status**: Gateway transitions to `Ready` with assigned IP

5.  **Create HTTPS HTTPRoute**:
    *   Navigate to **HTTPRoute Management** tab
    *   Click **"+ Create HTTPRoute"**
    *   **Route Configuration**:
        - **Route Name**: `secure-echo-route`
        - **Parent Gateway**: `secure-gateway`
        - **Hostname**: `secure.local.demo` (matches certificate DNS names)
        - **Path Matching**: PathPrefix `/`
        - **Backend Service**: `echo-service`
        - **Port**: `80`

### Step 4.3: Testing HTTPS Connectivity

Test HTTPS functionality using the extension's enhanced HTTP testing capabilities with TLS support.

1.  **Advanced HTTPS Testing with TLS Options**:
    *   Navigate to **Testing & Proxy** tab
    *   **Configure HTTPS Request**:
        - **URL**: `https://<GATEWAY_HTTPS_IP>/` (use the secure gateway's IP)
        - **Method**: `GET`
        - **Headers**: Add `Host: secure.local.demo` if using hostname
    *   **TLS Configuration Options** (Enhanced in v0.6.0):
        - **Expand TLS Options accordion** for advanced HTTPS testing
        - **Verify SSL**: Toggle to enable/disable certificate verification
        - **Ignore Certificate Errors**: Enable for self-signed certificates
        - **Client Certificate**: Optional client certificate for mutual TLS
        - **CA Certificate**: Custom CA for certificate validation
    *   Click **"Send Request"** and examine HTTPS response

2.  **Certificate Testing Scenarios**:
    *   **Self-Signed Certificate Test**:
        - Enable **"Ignore Certificate Errors"** for self-signed certificates
        - Verify successful HTTPS connection with warning indicators
    *   **Strict Certificate Validation**:
        - Disable **"Ignore Certificate Errors"** to test certificate validation
        - Observe certificate validation errors for self-signed certificates
    *   **Custom CA Testing** (Advanced):
        - Upload custom CA certificate for validation
        - Test certificate chain validation

3.  **Enhanced cURL Generation with TLS Options**:
    *   **Automatic cURL Generation**: Extension generates HTTPS-aware cURL commands
    *   **TLS Flags Included**: Generated commands include appropriate TLS flags:
        ```bash
        # Generated cURL with TLS options
        curl -k https://172.18.200.2/ \
          -H "Host: secure.local.demo" \
          --insecure  # For self-signed certificates
        ```
    *   **Copy to Clipboard**: One-click copy of generated HTTPS commands

4.  **HTTPS Response Analysis**:
    *   **Security Headers**: Examine HTTPS-specific headers and security information
    *   **TLS Connection Details**: View TLS handshake and certificate information
    *   **Performance Metrics**: Monitor HTTPS request/response times
    *   **Error Diagnostics**: Detailed TLS error messages and resolution guidance

5.  **External Testing with cURL**:
    ```bash
    # Test HTTPS endpoint (allow self-signed certificates)
    curl -k https://172.18.200.2/
    
    # Test with hostname
    curl -k -H "Host: secure.local.demo" https://172.18.200.2/
    
    # Strict certificate validation (will fail for self-signed)
    curl https://172.18.200.2/
    ```

6.  **Certificate Verification and Troubleshooting**:
    ```bash
    # Verify certificate information
    openssl s_client -connect 172.18.200.2:443 -servername secure.local.demo -showcerts
    
    # Check certificate details
    echo | openssl s_client -connect 172.18.200.2:443 2>/dev/null | openssl x509 -noout -text
    
    # Test certificate expiration
    echo | openssl s_client -connect 172.18.200.2:443 2>/dev/null | openssl x509 -noout -dates
    ```

7.  **Integration with TLS Management**:
    *   **Certificate Status Monitoring**: Use TLS Management tab to monitor certificate health
    *   **Certificate Renewal**: Generate new certificates when needed
    *   **Multi-Domain Testing**: Test different DNS names from the same certificate

**Expected Results**:
- HTTPS Gateway shows `Ready` status with assigned IP address
- HTTPRoute shows `Accepted` and `ResolvedRefs` as `True`
- HTTPS requests return successful responses with proper TLS encryption
- Extension's HTTP client successfully connects via HTTPS

---

## Demo 5: Traffic Splitting & Canary Deployments

This demo showcases the extension's comprehensive traffic splitting capabilities, enabling sophisticated canary deployments, blue-green deployments, and A/B testing through an intuitive wizard-based interface with real-time traffic management controls.

### Step 5.1: Traffic Splitting Wizard Setup

The Traffic Splitting tab provides a guided wizard for implementing advanced deployment patterns with minimal complexity.

1.  **Access Traffic Splitting Management**:
    *   Navigate to the **Traffic Splitting** tab in the extension
    *   **Interface Options**: Choose between Quick Start Wizard and Advanced Management
    *   **Tabbed Design**: Professional interface with integrated deployment monitoring

2.  **Quick Start Wizard - Pattern Selection**:
    *   Click the **"Quick Start Wizard"** tab to begin guided setup
    *   **Choose Deployment Strategy** (Step 1 of 4):
        - **Canary Deployment** 🐤: Gradual traffic shift from old to new version
            - Initial: 90% v1, 10% v2 → Testing: 70% v1, 30% v2 → Final: 0% v1, 100% v2
            - Best for: Risk-averse deployments with gradual validation
        - **Blue-Green Deployment** 🔄: Instant switch between complete environments
            - Active: 100% Blue → Ready: Green deployed but not serving → Switch: 100% Green
            - Best for: Zero-downtime deployments with instant rollback capability
        - **A/B Testing** ⚖️: Equal or weighted traffic for comparison
            - Equal: 50% v1, 50% v2 → Weighted: 70% v1, 30% v2 → Winner: 100% best performing
            - Best for: Feature comparison and performance testing

3.  **Service Configuration** (Step 2 of 4):
    *   **Route Configuration**:
        - **Route Name**: `traffic-split-route` (customizable)
        - **Gateway Name**: `demo-gateway` (selects from existing gateways)
        - **Namespace**: `demo` (matches your existing resources)
    *   **Service Version Configuration**:
        - **Service V1**: `echo-service-v1` with weight assignment
        - **Service V2**: `echo-service-v2` with complementary weight
        - **Replicas**: Configure replica count for each version (1-10)
        - **Images**: Specify container images (defaults to `ealen/echo-server:latest`)
    *   **Weight Validation**: Total weights must equal 100% to proceed

### Step 5.2: Deployment Pattern Implementation

Deploy the multi-version infrastructure and implement traffic splitting patterns.

1.  **Infrastructure Deployment** (Step 3 of 4):
    *   **Automated Deployment Process**:
        - **Namespace Creation**: Creates or verifies `demo` namespace
        - **Service Deployment**: Deploys both v1 and v2 services with specified configurations
        - **Gateway Configuration**: Configures or updates the specified gateway
        - **HTTPRoute Creation**: Creates weighted routing rules for traffic splitting
    *   **Real-time Progress Monitoring**:
        - **Visual Indicators**: Check marks, loading spinners, and error states
        - **Status Messages**: Detailed progress information for each deployment step
        - **Error Handling**: Comprehensive error messages with resolution guidance

2.  **Deployment Status Verification**:
    *   **Service Status Cards**: Real-time status for v1 and v2 deployments
        - **Ready Status**: Green indicators when services are operational
        - **Replica Information**: Current ready/total replica counts
        - **Health Monitoring**: Continuous health status updates
    *   **Gateway Integration**: Verify gateway readiness and IP assignment
    *   **HTTPRoute Configuration**: Confirm traffic splitting rule implementation

3.  **Template Integration**:
    *   **GitHub Template Application**: Leverages existing traffic-splitting template
    *   **YAML Generation**: Dynamic HTTPRoute creation with weighted backend references
    *   **Infrastructure Validation**: Ensures complete deployment before traffic management

### Step 5.3: Advanced Traffic Management

Control and monitor traffic distribution with real-time adjustment capabilities.

1.  **Traffic Distribution Control** (Step 4 of 4):
    *   **Current Distribution Display**:
        - **Visual Progress Bars**: Linear progress indicators showing traffic percentages
        - **Percentage Cards**: Clear display of current v1/v2 traffic allocation
        - **Real-time Updates**: Live traffic distribution visualization
    *   **Dynamic Weight Adjustment**:
        - **Slider Control**: Intuitive slider for adjusting v1/v2 traffic split
        - **Percentage Display**: Real-time percentage calculation (v1: X%, v2: Y%)
        - **Apply Changes**: One-click application of new traffic weights
        - **Validation**: Automatic validation ensures weights total 100%

2.  **Deployment Pattern Scenarios**:
    *   **Scenario Management**: Expandable accordion with pre-configured scenarios
    *   **Pattern-Specific Stages**:
        - **Canary Scenarios**: Progressive rollout stages with recommended percentages
        - **Blue-Green Scenarios**: Environment preparation and switching stages
        - **A/B Testing Scenarios**: Equal split and result evaluation stages
    *   **One-Click Application**: Apply any scenario with single click
    *   **Custom Adjustments**: Fine-tune weights between scenario applications

3.  **Advanced Management Interface**:
    *   **Switch to Advanced Tab**: Access direct deployment and traffic controls
    *   **Deployment Status Dashboard**:
        - **Service Cards**: Detailed status for each service version
        - **Gateway Status**: External IP and configuration verification
        - **HTTPRoute Status**: Traffic splitting rule verification
    *   **Manual Traffic Control**:
        - **Weight Slider**: Direct traffic percentage adjustment
        - **Apply Changes**: Immediate traffic rule updates
        - **Status Monitoring**: Real-time deployment health checking

4.  **Traffic Simulation and Testing**:
    *   **Built-in Traffic Simulator**: Generate test traffic to verify distribution
    *   **Configurable RPS**: Set requests per second for simulation load
    *   **Distribution Verification**: Monitor actual vs. expected traffic patterns
    *   **Integration with HTTP Testing**: Use Testing & Proxy tab for endpoint validation

5.  **Operational Features**:
    *   **Auto-refresh**: Toggle automatic status updates every 5 seconds
    *   **Manual Refresh**: On-demand status updates with refresh button
    *   **Reset Demo**: Complete cleanup and restoration to initial state
    *   **Error Handling**: Comprehensive error feedback with resolution guidance

**Expected Results**:
- Multiple service versions deployed and operational
- Gateway configured with appropriate IP assignment
- HTTPRoute implementing weighted traffic distribution
- Real-time traffic control with immediate weight updates
- Successful traffic splitting verification through testing

**Integration with Other Features**:
- **TLS Support**: Combine with TLS Management for secure traffic splitting
- **HTTP Testing**: Validate traffic distribution using built-in HTTP client
- **Resource Visualization**: Monitor traffic splitting resources in Resources tab
- **LoadBalancer Integration**: Ensure proper IP assignment for traffic splitting endpoints

---

## Demo 6: Synthetic Traffic Generation & Performance Testing

This demo showcases the extension's comprehensive synthetic traffic generation and performance testing capabilities, enabling developers to validate gateway configurations under realistic load conditions, test traffic splitting scenarios, and analyze performance metrics through advanced visualization tools.

### Step 6.1: Advanced Traffic Generator Configuration

The extension provides a powerful traffic generator that enables realistic load testing with configurable parameters and real-time monitoring capabilities.

1.  **Access Traffic Generation Tools**:
    *   Navigate to the **Testing & Proxy** tab in the extension
    *   Locate the **Synthetic Traffic Generator** section
    *   **Interface Design**: Professional tabbed interface with Configuration and Live Visualization tabs

2.  **Basic Traffic Configuration**:
    *   **Target URL Configuration**:
        - **URL**: Enter your gateway endpoint (e.g., `http://172.18.200.1/`)
        - **Auto-detection**: Extension detects gateway addresses from deployed resources
        - **URL Validation**: Real-time validation ensures proper URL format
    *   **Request Parameters**:
        - **HTTP Method**: Select from GET, POST, PUT, DELETE, PATCH
        - **Requests Per Second (RPS)**: Configure 1-1000 RPS with slider control
        - **Duration**: Set test duration in seconds (default: 60 seconds)
        - **Concurrent Connections**: Configure 1-100 concurrent connections

3.  **Advanced Configuration Options**:
    *   **Expand Advanced Settings** panel for detailed configuration:
    *   **Custom Headers Management**:
        - **Add Headers**: Click "Add Header" to include custom HTTP headers
        - **Header Examples**: Host headers for hostname routing, API keys, authentication tokens
        - **Dynamic Values**: Support for both static values and test-specific headers
    *   **Request Body Configuration**:
        - **Content Type**: Automatic content-type header management
        - **Body Data**: Custom request bodies for POST/PUT operations
        - **JSON Support**: Proper formatting and validation for JSON payloads
    *   **Connection Management**:
        - **Timeout Settings**: Configure request timeout (default: 10 seconds)
        - **Connection Limiting**: Semaphore-based connection management
        - **Keep-Alive**: Efficient connection reuse for realistic load patterns

4.  **Configuration Validation**:
    *   **Real-time Validation**: Form validates all inputs before enabling start button
    *   **Error Feedback**: Clear error messages for invalid configurations
    *   **Smart Defaults**: Sensible default values for quick testing scenarios
    *   **Configuration Persistence**: Settings maintained during session

### Step 6.2: Performance Testing and Metrics Collection

Execute load tests and monitor comprehensive performance metrics with real-time visualization and analytics.

1.  **Start Traffic Generation**:
    *   **Configuration Review**: Verify all settings in the Configuration tab
    *   **Start Test**: Click "Start Traffic Test" to begin synthetic traffic generation
    *   **Real-time Feedback**: Immediate status updates and progress indicators
    *   **Live Controls**: Start/stop functionality with graceful test lifecycle management

2.  **Real-time Metrics Monitoring**:
    *   **Switch to Live Visualization Tab** to monitor performance in real-time
    *   **Key Performance Indicators**:
        - **Response Times**: Live min/avg/max response time tracking
        - **Success Rate**: Percentage of successful requests (2xx status codes)
        - **Requests Per Second**: Actual RPS vs. configured RPS comparison
        - **Total Requests**: Running count of completed requests
        - **Error Rate**: Percentage and count of failed requests

3.  **Interactive Performance Visualization**:
    *   **Response Time Distribution Chart**:
        - **SVG-based Visualization**: Custom charts without external dependencies
        - **Real-time Updates**: Chart updates every 2 seconds with new data points
        - **Data Points**: Maintains last 50 data points for trend analysis
        - **Visual Indicators**: Color-coded performance zones and trend lines
    *   **RPS Trend Analysis**:
        - **Throughput Monitoring**: Real-time RPS tracking with target comparison
        - **Performance Correlation**: Visual correlation between RPS and response times
        - **Trend Detection**: Identify performance degradation or improvement patterns

4.  **Comprehensive Status Code Analytics**:
    *   **Status Code Breakdown**: Color-coded distribution of HTTP status codes
        - **2xx Success**: Green indicators for successful requests
        - **4xx Client Errors**: Yellow indicators for client-side errors
        - **5xx Server Errors**: Red indicators for server-side errors
    *   **Progress Bar Visualization**: Visual representation of status code percentages
    *   **Error Analysis**: Detailed breakdown of error types and frequencies
    *   **Success Rate Monitoring**: Real-time success rate calculation and display

5.  **Advanced Analytics Features**:
    *   **Performance Statistics**:
        - **Response Time Analysis**: Min, average, max response time tracking
        - **Percentile Analysis**: P50, P95, P99 response time percentiles
        - **Error Categorization**: Breakdown of errors by type and frequency
        - **Throughput Analysis**: Actual vs. target RPS comparison
    *   **Historical Trending**:
        - **Time Series Data**: Maintains performance history during test execution
        - **Trend Visualization**: Charts show performance trends over time
        - **Performance Correlation**: Identify relationships between metrics

### Step 6.3: Traffic Splitting Validation with Load Testing

Combine synthetic traffic generation with traffic splitting scenarios to validate canary deployments and load distribution under realistic conditions.

1.  **Traffic Splitting Integration**:
    *   **Navigate to Traffic Splitting Tab** in the extension
    *   **Access Traffic Testing Sub-tab**: Dedicated testing interface for traffic splitting scenarios
    *   **Context-Aware Configuration**: Traffic generator automatically detects gateway addresses and routing configurations

2.  **Load Testing Traffic Distribution**:
    *   **Configure Traffic Split**: Use the traffic splitting wizard to set up canary deployment (e.g., 80% v1, 20% v2)
    *   **Generate Realistic Load**: Configure traffic generator for realistic testing:
        - **Target URL**: Use the gateway address from traffic splitting configuration
        - **Load Pattern**: 100-500 RPS for meaningful distribution validation
        - **Duration**: 2-5 minutes for comprehensive validation
        - **Headers**: Include routing headers if using header-based splitting

3.  **Distribution Validation**:
    *   **Real-time Monitoring**: Monitor traffic distribution across service versions
    *   **Performance Comparison**: Compare response times between service versions
        - **Version-specific Metrics**: Track performance for each service version
        - **Load Impact Analysis**: Understand how traffic distribution affects performance
        - **Error Rate Comparison**: Monitor error rates across different versions
    *   **Visual Confirmation**: Use status code and response data to verify routing

4.  **Advanced Testing Scenarios**:
    *   **Canary Validation Workflow**:
        - **Initial Split**: Test with 90% v1, 10% v2 distribution
        - **Load Generation**: Generate 200-500 RPS to validate routing accuracy
        - **Performance Validation**: Confirm v2 performs acceptably under load
        - **Progressive Rollout**: Adjust traffic split to 70% v1, 30% v2 and re-test
        - **Final Validation**: Test 100% v2 traffic before complete rollout
    *   **A/B Testing Scenarios**:
        - **Equal Distribution**: Configure 50%/50% traffic split for A/B comparison
        - **Performance Comparison**: Generate sustained load to compare performance metrics
        - **Statistical Significance**: Run tests for sufficient duration to gather meaningful data
        - **Winner Selection**: Use performance data to determine optimal version

5.  **Performance Under Load**:
    *   **Stress Testing**: Generate high RPS (500-1000) to test gateway performance under load
    *   **Scalability Validation**: Monitor how traffic splitting performs as load increases
    *   **Resource Monitoring**: Track CPU, memory, and network usage during load tests
    *   **Failure Scenarios**: Test traffic splitting behavior during service failures

6.  **Integration with Existing Features**:
    *   **TLS Testing**: Combine traffic generation with HTTPS endpoints for secure load testing
    *   **Certificate Validation**: Test TLS performance under load conditions
    *   **Multi-Protocol Testing**: Validate both HTTP and HTTPS endpoint performance
    *   **Resource Visualization**: Monitor gateway and route status during load testing

**Expected Results**:
- Successful generation of synthetic traffic with configurable RPS and realistic load patterns
- Real-time performance metrics showing response times, success rates, and status code distribution
- Interactive visualizations providing insights into performance trends and bottlenecks
- Validation of traffic splitting configurations under load with accurate distribution verification
- Comprehensive analytics enabling data-driven decisions about service deployments and performance optimization

**Use Cases Demonstrated**:
- **Performance Baseline Establishment**: Create performance baselines for API endpoints before production deployment
- **Canary Deployment Validation**: Verify that new service versions perform acceptably under realistic load
- **Traffic Distribution Accuracy**: Confirm that traffic splitting configurations work correctly with actual load
- **Performance Regression Testing**: Detect performance regressions when deploying new versions
- **Load Testing Integration**: Combine gateway configuration with comprehensive load testing workflows

---

## Demo 7: Monitoring and Observability

This final demo covers the extension's monitoring capabilities and operational best practices.

### Step 7.1: Gateway and HTTPRoute Status Monitoring

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

### Step 7.2: Deployment Status and Troubleshooting

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
- **Complete TLS Management (v0.6.0)**: Intelligent prerequisite detection, automated cert-manager installation, certificate lifecycle management, and advanced HTTPS testing
- **Traffic Splitting & Canary Deployments (v0.7.0)**: Comprehensive traffic management with wizard-based setup, deployment patterns, and real-time traffic control
- **Synthetic Traffic Generation & Performance Testing (v0.8.0)**: Advanced traffic generator with configurable RPS, real-time metrics collection, interactive visualizations, and traffic splitting validation under load
- **Visual Resource Management (v0.6.0)**: Enhanced resource cards, relationship visualization, and interactive management actions
- **Monitoring & Troubleshooting**: Real-time status monitoring and diagnostic tools

The extension's enhanced tabbed interface provides intuitive visual access to core Envoy Gateway features while maintaining the power and flexibility of the underlying Gateway API. The latest v0.8.0 capabilities include comprehensive synthetic traffic generation and performance testing that validates gateway configurations under realistic load conditions. Combined with v0.7.0 traffic splitting management, v0.6.0 TLS management workflow, and enhanced resource visualization, this transforms complex deployment patterns and performance validation from manual processes to streamlined, guided experiences with real-time analytics.

### Next Steps

- **Explore v0.8.0 Synthetic Traffic Generation**: Master comprehensive load testing and performance validation with configurable RPS, real-time metrics, and advanced visualizations
- **Performance Testing Workflows**: Establish performance baselines, conduct canary validation, and implement data-driven deployment decisions
- **Traffic Splitting with Load Testing**: Combine traffic splitting patterns with realistic load testing for complete deployment validation
- **Advanced Traffic Patterns**: Experiment with high RPS scenarios, concurrent connection management, and complex load testing scenarios
- **Explore v0.7.0 Traffic Splitting**: Experience the comprehensive traffic management wizard with canary deployments, blue-green deployments, and A/B testing
- **Explore v0.6.0 TLS Features**: Experience the complete certificate lifecycle management with automated cert-manager installation
- **HTTPS Load Testing**: Combine TLS management with synthetic traffic generation for secure endpoint performance validation
- **Visual Resource Management**: Leverage the new resource cards and relationship visualization for efficient gateway management
- **Use GitHub Templates**: Apply additional templates for complex scenarios
- **Advanced Configuration**: Experiment with Gateway API features through YAML configuration
- **Operational Excellence**: Review the troubleshooting guide for best practices
- **Custom Development**: Build custom templates for your specific use cases