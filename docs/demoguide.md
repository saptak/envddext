# Envoy Gateway Docker Desktop Extension: Complete Demo Guide

🚀 **Welcome to your API Gateway mastery journey!**

This comprehensive guide transforms the Envoy Gateway Docker Desktop Extension into your complete learning laboratory for mastering modern gateway concepts through hands-on scenarios that mirror real-world production challenges.

## 🎓 Complete Skill Mastery

**By completing this guide, you'll master:**

**🏗️ Foundation Skills:**
- ✅ API Gateway architecture and modern networking concepts
- ✅ Kubernetes Gateway API vs legacy Ingress patterns
- ✅ Request routing, load balancing, and traffic control

**🔐 Enterprise Security:**
- ✅ JWT authentication with provider configuration and claim mapping
- ✅ Mutual TLS (mTLS) for the highest security standards
- ✅ Advanced rate limiting with multi-dimensional policies
- ✅ CORS, Basic Auth, and IP filtering for comprehensive protection

**🚦 Advanced Traffic Management:**
- ✅ Canary deployments and blue-green strategies
- ✅ A/B testing with real-time traffic splitting
- ✅ Synthetic load testing and performance validation

**🛡️ Production Operations:**
- ✅ Resilience policies with timeout and retry strategies
- ✅ Monitoring, troubleshooting, and operational excellence
- ✅ Performance optimization and enterprise-grade reliability

## 🏗️ Understanding the Foundation

### 🚪 What is an API Gateway?

**Think of an API Gateway as the "intelligent reception desk" for your digital services:**

```
🌐 [Client Apps] → 🏢 [API Gateway] → 🔧 [Microservices]
       ↓                ↓                ↓
   📱 Mobile App     🔐 Security      👤 User Service
   💻 Web App        🚦 Routing       🛒 Order Service
   🔌 Partner API    📊 Monitoring    💳 Payment Service
```

**🎯 Key Benefits:**
- **🎯 Single Entry Point**: One URL to manage all traffic
- **🛡️ Security Layer**: Authentication, authorization, rate limiting
- **🔀 Smart Routing**: Path-based, header-based, method-based routing
- **📈 Observability**: Centralized logging, metrics, and tracing
- **⚡ Performance**: Caching, compression, load balancing
- **🔧 Service Protection**: Backend services hidden from direct access

### ⚡ Why Envoy Gateway?

**The evolution from legacy to modern:**

| 📊 Aspect | ❌ Legacy Ingress | ✅ Gateway API | 🚀 Envoy Gateway |
|-----------|------------------|----------------|------------------|
| **Routing** | Basic paths only | Rich HTTP matching | **Advanced traffic control** |
| **Security** | Basic TLS | Some policies | **Enterprise-grade policies** |
| **Traffic Control** | Limited | Basic splitting | **Canary, A/B, blue-green** |
| **Observability** | Minimal | Basic metrics | **Full tracing & monitoring** |
| **Extensibility** | Vendor-specific | Standardized | **Production-tested at scale** |

**🎯 Envoy Gateway Advantages:**
- 🎨 **Declarative**: YAML-based, GitOps-ready configuration
- 🏭 **Battle-Tested**: Powers Lyft, Uber, Netflix at massive scale
- 📊 **Observable**: Built-in metrics, tracing, and logging
- 🔌 **Extensible**: Custom filters and policies
- 🛡️ **Secure**: Comprehensive security policy framework

## Prerequisites

### System Requirements

* Docker Desktop with Kubernetes enabled
* Minimum 4GB RAM allocated to Docker Desktop
* Envoy Gateway Docker Desktop Extension v0.12.1+ (Production Ready)

### Setup Verification

1. **Enable Kubernetes in Docker Desktop**:
   * Open Docker Desktop → Settings → Kubernetes
   * Check "Enable Kubernetes" and click "Apply & Restart"

2. **Install the Extension**:
   * Open Docker Desktop Extensions tab
   * Search for "Envoy Gateway" and install

3. **Verify Installation**:
   * Open the Envoy Gateway extension
   * You should see a clean 4-tab interface with Envoy branding:
     - **Quick Start**: Overview dashboard with dynamic deployment monitoring and enhanced template gallery
     - **Infrastructure**: Gateways, HTTP Routes, and TLS certificates
     - **Security & Policies**: Security policies and resilience configuration
     - **Traffic & Testing**: Traffic splitting, HTTP testing, and performance validation

## 🧪 Testing with Envoy Gateway: Essential Knowledge

### Understanding Testing URLs vs Actual Endpoints

**Important**: When working with Envoy Gateway, understand the difference between routing configuration and actual testing:

- **Routing Configuration**: Use domains like `echo.local`, `api.local` in your Gateway and HTTPRoute configs
- **Actual Testing**: Use real IPs or proxy endpoints to make HTTP requests

### 🎯 Three Methods for Testing Your Gateway

#### Method 1: kubectl proxy (Recommended for Docker Desktop)
```bash
# 1. Start kubectl proxy (use Proxy Manager in extension)
kubectl proxy --port=8001

# 2. Use proxy URL in HTTP Client  
URL: http://localhost:8001/api/v1/namespaces/<NAMESPACE>/services/<SERVICE-NAME>:<PORT>/proxy/<PATH>
Example: http://localhost:8001/api/v1/namespaces/demo/services/echo-service:80/proxy/
Headers: (No Host header needed)

# To find kubectl proxy URL in the extension:
# - Go to Traffic & Testing tab → HTTP Testing sub-tab → Proxy Manager section
# - Ensure proxy shows "Running on http://localhost:8001"
# - Use format above with your specific namespace, service name, port, and path
```

#### Method 2: Gateway External IP (if reachable)
```bash
# 1. Find your Gateway's external IP
Go to Infrastructure tab → Gateways section → Note the External IP

# 2. Test if reachable first
curl http://<GATEWAY-EXTERNAL-IP>/

# 3. If successful, use in HTTP Client
URL: http://<GATEWAY-EXTERNAL-IP>/
Headers: Host: echo.local

# Note: In Docker Desktop, external IPs may not be reachable
# If you get "no route to host", use kubectl proxy instead
```

#### Method 3: Port Forwarding
```bash
# 1. Set up port forwarding to the Gateway service
kubectl port-forward service/<gateway-name> 8080:80 -n envoy-gateway-system

# 2. Use forwarded port
URL: http://localhost:8080/
Headers: Host: echo.local
```

### 🔍 Why This Matters

**The `.local` Domain Issue**: Domains ending in `.local` (like `echo.local`, `api.local`) are for routing rules only. They cannot be resolved by DNS, so direct HTTP requests to `http://echo.local/` will fail with "Network error: Failed to fetch".

**Smart URL Analysis (v0.12.1)**: The HTTP Client now automatically detects potentially problematic URLs and provides proactive guidance:
- **`.local` Domain Detection**: Shows helpful info alert with specific testing suggestions
- **Private IP Detection**: Warns when using private IPs that may not be reachable in Docker Desktop
- **Alternative Method Suggestions**: Recommends kubectl proxy or port forwarding automatically

**Enhanced Error Handling**: The extension's backend detects connectivity issues and provides comprehensive guidance with formatted error messages and actionable solutions.

**Docker Desktop Networking**: External IPs from LoadBalancer services may not be reachable due to Docker Desktop's networking limitations. The "no route to host" error is common and expected - the HTTP Client will guide you to use kubectl proxy instead.

**Enhanced Headers Interface**: Version 0.12.1 introduces a professional headers management interface with:
- Toggle controls for individual headers
- Visual header count indicators  
- "Add Header" functionality
- Integration with JWT and TLS testing

## Learning Path

This guide is organized as a progressive learning journey:

1. **[Getting Started](#demo-1-your-first-gateway)** - Deploy your first gateway and understand basic concepts
2. **[HTTP Routing](#demo-2-intelligent-http-routing)** - Learn advanced routing patterns and request matching
3. **[Infrastructure Setup](#demo-3-infrastructure-and-loadbalancer-setup)** - Configure the underlying infrastructure
4. **[Security with HTTPS](#demo-4-security-with-tls-and-https)** - Add encryption and certificate management
5. **[Advanced Deployments](#demo-5-advanced-deployments-with-traffic-splitting)** - Implement canary deployments and traffic splitting
6. **[Performance Testing](#demo-6-performance-testing-and-load-validation)** - Validate your setup under load
7. **[Security Policies](#demo-7-security-policies-and-access-control)** - Configure enterprise security with JWT authentication, access control, and advanced rate limiting
8. **[JWT Authentication](#demo-8-jwt-authentication-and-policy-management)** - Implement comprehensive JWT authentication with provider configuration, token testing, and claim mapping
9. **[Resilience Policies](#demo-9-resilience-policies-and-reliability)** - Configure timeout and retry policies for production-grade reliability
10. **[Production Operations](#demo-10-operational-monitoring-and-troubleshooting)** - Monitor and troubleshoot your gateway

Each demo builds on the previous one, introducing new concepts while reinforcing what you've learned.

---

## Demo 1: Your First Gateway

**What you'll learn**: Basic gateway concepts, simple HTTP routing, and testing

### Understanding the Basics

Before diving into configuration, let's understand the key components:

* **Gateway**: The entry point that listens for incoming traffic
* **HTTPRoute**: Rules that determine how requests are routed to services
* **Backend Service**: Your application that serves requests

Think of it like a reception desk at a building: the Gateway is the desk, HTTPRoutes are the directory rules, and backend services are the actual offices.

### Step 1.1: Deploy a Sample Application

We'll start with a simple echo service that returns information about incoming requests.

1. **Open the Extension**:
   * Navigate to the **Quick Start** tab
   * Click on the **Template Gallery** sub-tab
   * This contains pre-configured examples for quick setup

2. **Deploy the Echo Service**:
   * Find the **"Echo Service - Basic HTTP"** template
   * Click **"Apply Template"**
   * This deploys a simple service that echoes back request information
   * Watch for deployment notifications in the bottom-right corner

3. **Verify Deployment**:
   * Switch to the **Overview** sub-tab to see the dashboard
   * The dashboard automatically discovers and monitors deployed services
   * Notice the template now shows a **"Deployed"** badge in the Template Gallery
   * The echo service will be deployed to the `demo` namespace with dynamic monitoring

**What happened?** You just deployed a simple web service that will help us test our gateway configuration. The echo service responds with details about incoming requests, making it perfect for learning.

### Step 1.2: Create Your First Gateway

A Gateway defines how external traffic enters your cluster.

1. **Navigate to Gateway Management**:
   * Click the **Infrastructure** tab
   * Click the **Gateways** sub-tab
   * This is where you configure entry points for your traffic

2. **Check Prerequisites**:
   * Look at the **LoadBalancer Configuration** section
   * If it shows "NOT CONFIGURED", we'll fix this in Demo 3
   * For now, we can still create the Gateway

3. **Create the Gateway**:
   * Click **"+ Create Gateway"**
   * **Gateway Name**: `my-first-gateway`
   * **Namespace**: `demo`
   * **Gateway Class**: `envoy-gateway`

4. **Configure the Listener**:
   * **Listener Name**: `http`
   * **Port**: `80`
   * **Protocol**: `HTTP`
   * **Hostname**: Leave empty (accepts all hostnames)

5. **Set Route Permissions**:
   * **Allowed Routes From**: `Same` (routes from same namespace)
   * Click **"Create Gateway"**

**What happened?** You created a gateway that listens on port 80 for HTTP traffic. It's ready to accept routing rules from the same namespace.

### Step 1.3: Create Your First Route

HTTPRoutes define how requests are matched and forwarded to services.

1. **Navigate to HTTPRoute Management**:
   * Click the **Infrastructure** tab
   * Click the **HTTP Routes** sub-tab

2. **Create the Route**:
   * Click **"+ Create HTTPRoute"**
   * **Route Name**: `echo-route`
   * **Namespace**: `demo`
   * **Parent Gateway**: Select `my-first-gateway`

3. **Configure Routing Rules**:
   * **Hostname**: `echo.local` (we'll use this for testing)
   * **Path Type**: `PathPrefix`
   * **Path Value**: `/` (matches all paths)
   * **HTTP Method**: `GET`
   * **Backend Service**: `echo-service`
   * **Port**: `80`
   * **Weight**: `100`

4. **Create the Route**:
   * Click **"Create HTTPRoute"**

**What happened?** You created a routing rule that sends all GET requests to `echo.local` to your echo service.

### Step 1.4: Test Your Setup

Now let's test the gateway you just created.

1. **Navigate to HTTP Testing**:
   * Click the **Traffic & Testing** tab
   * Click the **HTTP Testing** sub-tab

2. **Start the Proxy** (Enhanced Reliability):
   * Click **"Start Proxy"** in the Proxy Manager section
   * Wait for status to show "Running"

3. **Get Gateway Information**:
   * Return to **Infrastructure** tab, **Gateways** sub-tab
   * Note the **External IP** of your gateway (if LoadBalancer is configured)
   * If no external IP, we'll use the proxy for testing

4. **Test with HTTP Client**:
   * In the **HTTP Testing** sub-tab
   * **Important**: `echo.local` is for routing configuration only. For actual testing, use one of these options:
   
   **Option A - Gateway External IP (Recommended)**:
   * Go to **Infrastructure** tab → **Gateways** section
   * Find your gateway's **External IP** (e.g., `10.96.1.100`)
   * **URL**: `http://<GATEWAY-EXTERNAL-IP>/` (replace with actual IP)
   * **Smart URL Detection**: If you enter a private IP, the HTTP Client will show a helpful info alert
   * **Headers**: Click to expand the Headers section (new in v0.12.1)
     * Add custom header: `Host: echo.local`
     * Toggle headers on/off as needed
     * Use "Add Header" button for additional headers
   * Click **"Send Request"**
   
   **Option B - kubectl proxy**:
   * **URL**: `http://localhost:8001/api/v1/namespaces/demo/services/echo-service:80/proxy/`
   * **Headers**: No Host header needed for proxy testing
   * Click **"Send Request"**
   
   **Option C - If you accidentally use `.local` domains**:
   * The HTTP Client will automatically detect URLs like `http://echo.local/`
   * Shows an informational alert with specific guidance
   * Provides direct suggestions for kubectl proxy or port forwarding

5. **Examine the Response**:
   * You should see JSON containing request details
   * Notice headers added by the gateway (like `x-envoy-*`)

**What happened?** Your first request traveled through the gateway to your service! The echo service returned details about the request, showing that routing worked correctly.

### Key Concepts Learned

* **Gateway**: Entry point for external traffic
* **HTTPRoute**: Routing rules that match requests to services
* **Path Matching**: How URLs are matched to routes
* **Backend References**: How routes connect to services

### Demo 1 Cleanup

**Resources to Keep for Next Demo:**
- ✅ **Keep**: `my-first-gateway` (or `demo-gateway`) - needed for Demo 2
- ✅ **Keep**: `echo-route` - will be used as reference in Demo 2
- ✅ **Keep**: `echo-service` - backend service for testing

**Nothing to Clean Up:**
- All resources created in Demo 1 are foundational and will be used in subsequent demos
- The gateway and route you created form the base infrastructure for advanced routing patterns

**Verification:**
```bash
# Confirm your foundation is ready for Demo 2
kubectl get gateways -n demo
kubectl get httproutes -n demo
kubectl get services -n demo
```

### Next Steps

You've successfully created your first gateway! In the next demo, we'll explore more sophisticated routing patterns that build on this foundation.

---

## Demo 2: Intelligent HTTP Routing

**What you'll learn**: Advanced request matching, header-based routing, and multi-service architectures

### Understanding Advanced Routing

Real applications need more than simple path matching. You might need to:

* Route different API versions to different services
* Direct mobile traffic to specialized backends
* Implement feature flags through headers
* Route based on user types or geographical location

### Step 2.1: Deploy Multi-Service Architecture

Let's create a more realistic scenario with multiple services.

1. **Deploy Additional Services**:
   * In the **Quick Start** tab, click the **Template Gallery** sub-tab
   * Apply the **"Traffic Splitting"** template
   * This creates multiple versions of a service for demonstration
   * Notice the template shows "Deployed" badge after successful deployment

2. **Verify Deployments**:
   * Services `echo-service-v1` and `echo-service-v2` should now be running
   * Each responds with different content to show routing
   * The Dashboard dynamically detects and monitors these new deployments

3. **Template Management Features** (v0.12.1):
   * **Deployment Status**: Templates show real-time deployment status with "Deployed" badges
   * **Undeploy Functionality**: Click the "Undeploy" button on deployed templates
   * **Confirmation Dialogs**: Safe undeploy process with resource preview
   * **Smart Detection**: Extension accurately tracks which templates are actually deployed

### Step 2.2: Header-Based Routing

Header-based routing allows you to direct traffic based on specific HTTP headers, enabling powerful use cases like API versioning, feature flags, and A/B testing.

1. **Navigate to HTTPRoute Management**:
   * Click the **Infrastructure** tab
   * Click the **HTTP Routes** sub-tab
   * You should see your existing `echo-route` from Demo 1

2. **Create Version-Specific Route for V2**:
   * Click **"+ Create HTTPRoute"**
   * **Route Name**: `api-v2-route`
   * **Namespace**: `demo`
   * **Parent Gateway**: Select `my-first-gateway` (or `demo-gateway`)

3. **Configure V2 Route Matching Rules**:
   * **Hostname**: `api.local`
   * **Path Type**: `PathPrefix`
   * **Path Value**: `/api`
   * **HTTP Method**: `GET` (leave others unchecked)
   
4. **Add Header Matching**:
   * In the **Advanced Matching** section, click **"Add Header Match"**
   * **Header Name**: `X-API-Version`
   * **Header Value**: `v2`
   * **Match Type**: `Exact`

5. **Configure Backend Service**:
   * **Backend Service**: `echo-service-v2`
   * **Port**: `80`
   * **Weight**: `100`
   * Click **"Create HTTPRoute"**

6. **Create Default Route for V1**:
   * Click **"+ Create HTTPRoute"** again
   * **Route Name**: `api-default-route`
   * **Namespace**: `demo`
   * **Parent Gateway**: Select `my-first-gateway`
   * **Hostname**: `api.local`
   * **Path Type**: `PathPrefix`
   * **Path Value**: `/api`
   * **HTTP Method**: `GET`
   * **Backend Service**: `echo-service-v1`
   * **Port**: `80`
   * **Weight**: `100`
   * Click **"Create HTTPRoute"**

**What happened?** You created two routes with different matching priorities. The v2 route has more specific matching (includes header requirement) so it will be evaluated first. Traffic with the `X-API-Version: v2` header goes to v2 service, everything else goes to v1.

### Step 2.3: Method-Based Routing

Method-based routing lets you direct different HTTP operations to specialized services. This is common in microservices where read operations might go to optimized read-replicas and write operations go to primary databases.

1. **Create POST Route for Write Operations**:
   * Click **"+ Create HTTPRoute"**
   * **Route Name**: `api-post-route`
   * **Namespace**: `demo`
   * **Parent Gateway**: Select `my-first-gateway`
   * **Hostname**: `api.local`

2. **Configure POST Route Matching**:
   * **Path Type**: `Exact`
   * **Path Value**: `/api/data`
   * **HTTP Method**: Check only `POST` (uncheck others)
   * **Backend Service**: `echo-service-v2`
   * **Port**: `80`
   * **Weight**: `100`
   * Click **"Create HTTPRoute"**

3. **Create GET Route for Read Operations**:
   * Click **"+ Create HTTPRoute"**
   * **Route Name**: `api-get-route`
   * **Namespace**: `demo`
   * **Parent Gateway**: Select `my-first-gateway`
   * **Hostname**: `api.local`
   * **Path Type**: `Exact`
   * **Path Value**: `/api/data`
   * **HTTP Method**: Check only `GET`
   * **Backend Service**: `echo-service-v1`
   * **Port**: `80`
   * **Weight**: `100`
   * Click **"Create HTTPRoute"**

**What happened?** You created method-specific routing where POST requests to `/api/data` go to the v2 service (write operations) and GET requests to the same path go to the v1 service (read operations). This enables read/write splitting patterns.

### Step 2.4: Test Advanced Routing

Now let's verify that your advanced routing rules work correctly using the enhanced HTTP Testing client.

#### Test 1: Header-Based Routing

1. **Navigate to HTTP Testing**:
   * Click the **Traffic & Testing** tab
   * Click the **HTTP Testing** sub-tab
   * Ensure the kubectl proxy is running (click "Start Proxy" if needed)

2. **Test V2 Route with Header**:
   * **URL Options**:
     * **Option A - Gateway External IP**: `http://10.96.1.100/api` (replace with your actual gateway IP from Infrastructure tab)
     * **Option B - kubectl proxy URL**: `http://localhost:8001/api/v1/namespaces/demo/services/echo-service-v2:80/proxy/api`
       * To find kubectl proxy URL: Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab → **Proxy Manager** section
       * Ensure proxy shows "Running on http://localhost:8001"
       * Format: `http://localhost:8001/api/v1/namespaces/<NAMESPACE>/services/<SERVICE-NAME>:<PORT>/proxy/<PATH>`
       * For this test: `http://localhost:8001/api/v1/namespaces/demo/services/echo-service-v2:80/proxy/api`
   * **Method**: `GET`
   * **Headers Section** (click to expand):
     * **For Gateway External IP**: Add `Host: api.local` and `X-API-Version: v2`
     * **For kubectl proxy URL**: Only add `X-API-Version: v2` (no Host header needed)
     * Use the toggle controls to enable/disable headers as needed
   * Click **"Send Request"**
   * **Expected Result**: Response should come from `echo-service-v2` (check the response body for version indicators)

3. **Test Default Route (No Version Header)**:
   * **URL Options**:
     * **Option A - Gateway External IP**: Keep same URL as above
     * **Option B - kubectl proxy URL**: `http://localhost:8001/api/v1/namespaces/demo/services/echo-service-v1:80/proxy/api`
   * **Headers**: 
     * **For Gateway External IP**: Remove `X-API-Version` header, keep only `Host: api.local`
     * **For kubectl proxy URL**: Remove `X-API-Version` header (no Host header needed)
   * Click **"Send Request"**
   * **Expected Result**: Response should come from `echo-service-v1` (default route)

#### Test 2: Method-Based Routing

**⚠️ Important**: Method-based routing only works through the Gateway! kubectl proxy URLs bypass gateway routing and go directly to services.

**🔧 Docker Desktop Limitation**: Gateway External IPs are often not accessible from Docker Desktop. If you get "Network error" or "no route to host", this is expected behavior.

**📋 Testing Options (in order of preference):**

**Option 1: Port Forwarding (Recommended for Docker Desktop)**
1. **Set up port forwarding**:
   ```bash
   kubectl port-forward service/envoy-gateway-lb 8080:80 -n envoy-gateway-system
   ```
   
2. **Test POST to Data Endpoint**:
   * **URL**: `http://localhost:8080/api/data`
   * **Method**: `POST`
   * **Headers**: `Host: api.local`
   * **Request Body**: `{"action": "create", "data": "test"}`
   * **Expected Result**: Routed to `echo-service-v2`

3. **Test GET to Same Endpoint**:
   * **URL**: `http://localhost:8080/api/data`
   * **Method**: `GET`
   * **Headers**: `Host: api.local`
   * **Expected Result**: Routed to `echo-service-v1`

**Option 2: Gateway External IP (if accessible)**
* **URL**: `http://<GATEWAY-EXTERNAL-IP>/api/data` (find IP in Infrastructure tab)
* **Note**: May not work in Docker Desktop - if it fails, use port forwarding instead

**Why kubectl proxy doesn't work for this test:**
* kubectl proxy URLs bypass the gateway entirely and go directly to services
* Method-based routing rules are ignored when bypassing the gateway
* Use kubectl proxy only for service connectivity testing, not for routing rule testing

#### Verify Results

1. **Check Response Details**:
   * Look for service identification in the response body
   * V1 service might show different metadata than V2
   * Check response headers for service-specific information

2. **View Request History**:
   * Use the Request History feature to compare different test results
   * Save successful configurations for future testing

3. **Troubleshooting**:
   * If routes don't work as expected, verify your HTTPRoute configurations in the Infrastructure tab
   * Check that the services are actually running in the Dashboard
   * Ensure hostname matching is correct (`api.local` vs other hostnames)

### Step 2.5: Understanding Route Priority and Cleanup

When you have multiple routes that could match the same request, understanding priority is crucial.

#### Route Matching Priority

Envoy Gateway evaluates HTTPRoutes based on specificity:

1. **Most Specific Matches First**: Routes with more specific matching criteria (headers, exact paths, methods) are evaluated before generic ones
2. **Path Specificity**: `Exact` paths take priority over `PathPrefix` matches
3. **Header Presence**: Routes with header requirements are more specific than those without
4. **Method Constraints**: Routes with specific HTTP methods are more specific than catch-all routes

#### Example Priority Order

For our `api.local` routes, the evaluation order would be:

1. `api-v2-route` (has header requirement: `X-API-Version: v2`)
2. `api-post-route` (specific method: POST, exact path: `/api/data`)
3. `api-get-route` (specific method: GET, exact path: `/api/data`)  
4. `api-default-route` (no header requirement, generic path prefix)

#### Clean Up Your Routes

To keep your environment clean for the next demo:

**⚠️ Mandatory Cleanup Required:**

To prevent conflicts with subsequent demos, you MUST clean up the test routes created in this demo.

1. **Navigate to Route Management**:
   * Go to **Infrastructure** tab → **HTTP Routes** sub-tab
   * You should see your original `echo-route` plus the new routes you created

2. **Delete Test Routes (REQUIRED)**:
   * **Delete**: `api-v2-route` - click the delete icon and confirm
   * **Delete**: `api-default-route` - click the delete icon and confirm  
   * **Delete**: `api-post-route` - click the delete icon and confirm
   * **Delete**: `api-get-route` - click the delete icon and confirm
   * **Keep**: `echo-route` from Demo 1 - needed for subsequent demos

3. **Resources to Keep for Next Demo**:
   * ✅ **Keep**: `my-first-gateway` (or `demo-gateway`) - infrastructure for Demo 3
   * ✅ **Keep**: `echo-route` - will be used for testing external IP access
   * ✅ **Keep**: `echo-service`, `echo-service-v1`, `echo-service-v2` - backend services for testing

4. **Verification Commands**:
   ```bash
   # Verify only foundation routes remain
   kubectl get httproutes -n demo
   # Should show only: echo-route
   
   # Verify services are still available
   kubectl get services -n demo
   # Should show: echo-service, echo-service-v1, echo-service-v2
   ```

**Why This Cleanup is Critical:**
- Multiple routes on same hostname (`api.local`) will conflict with Demo 4's TLS setup
- Route priority conflicts may cause unpredictable behavior in security demos
- Clean foundation ensures reliable infrastructure testing in Demo 3

### Key Concepts Learned

* **Header Matching**: Route based on request headers for feature flags and API versioning
* **Method Matching**: Different HTTP methods to different services for read/write splitting  
* **Route Priority**: How multiple matching rules are evaluated based on specificity
* **Service Versioning**: Using routing for API version management and gradual rollouts
* **Real-world Testing**: Using the enhanced HTTP Client with headers management for comprehensive testing
* **Route Organization**: Managing multiple routes and understanding their interaction

---

## Demo 3: Infrastructure and LoadBalancer Setup

**What you'll learn**: LoadBalancer configuration, gateway IP assignment, networking fundamentals, and production-ready infrastructure management

### Understanding LoadBalancers in Kubernetes

LoadBalancers are essential for exposing services to external traffic. In production environments, cloud providers manage this automatically, but in Docker Desktop, we need MetalLB to provide this functionality.

**🔍 Key Concepts:**
* **LoadBalancer Service**: Kubernetes service type that provisions an external IP
* **MetalLB**: Bare-metal LoadBalancer implementation for local development
* **External IP Assignment**: How services become accessible from outside the cluster
* **IP Range Management**: Configuring safe IP ranges for LoadBalancer allocation

### Step 3.1: Analyze Current Infrastructure

Before configuring LoadBalancers, let's understand your current setup.

1. **Navigate to Infrastructure Overview**:
   * Click the **Infrastructure** tab
   * Click the **Gateways** sub-tab
   * You should see your existing gateway from previous demos

2. **Examine Current Gateway Status**:
   * Look at your gateway's **Status** column
   * Check the **External IP** column - likely shows "Pending" or empty
   * Note the **Addresses** section - this will be populated after LoadBalancer setup

3. **Understanding the Problem**:
   * Without a LoadBalancer, gateways can't receive external IPs
   * Services remain accessible only via kubectl proxy or port forwarding
   * This is not suitable for production-like testing

4. **Check LoadBalancer Configuration Status**:
   * Look for the **LoadBalancer Configuration** section
   * Current status likely shows **"NOT CONFIGURED"** or **"MetalLB not detected"**
   * This indicates no LoadBalancer controller is available

### Step 3.2: Configure MetalLB LoadBalancer

MetalLB provides LoadBalancer functionality for bare-metal Kubernetes clusters, including Docker Desktop.

1. **Access LoadBalancer Management**:
   * In the **Infrastructure** tab → **Gateways** sub-tab
   * Locate the **LoadBalancer Configuration** section at the top
   * Click **"Configure LoadBalancer"** button

2. **Understand IP Range Selection**:
   * **Auto-detect IP range** (Recommended): Extension automatically detects Docker Desktop's IP range
   * **Manual IP range**: Specify custom range if needed
   * **Important**: IP range must not conflict with existing network infrastructure

3. **Enable Auto-Detection** (Recommended Path):
   * Check the **"Auto-detect IP range"** checkbox
   * The extension will:
     * Detect Docker Desktop's internal network
     * Calculate a safe IP range for LoadBalancer services
     * Avoid conflicts with existing services
   * Example detected range: `10.96.1.100-10.96.1.200`

4. **Install and Configure MetalLB**:
   * Click **"Install & Configure"**
   * **Wait for completion** (typically 30-60 seconds)
   * Watch the status change from "Installing..." to "Configuring..."
   * Final status should show **"CONFIGURED"** with IP range details

5. **Verify Installation**:
   * Status section should now show:
     * **MetalLB Status**: "Running"
     * **IP Pool**: Your configured range
     * **Available IPs**: Number of available addresses

### Step 3.3: Verify Gateway IP Assignment

With MetalLB configured, existing gateways should automatically receive external IPs.

1. **Check Gateway Status Update**:
   * Refresh the **Gateways** sub-tab (click refresh icon if needed)
   * Your gateway status should change from "Pending" to "Ready"
   * **External IP** column should now show an assigned IP (e.g., `10.96.1.100`)

2. **Understand IP Assignment Process**:
   * MetalLB controller watches for LoadBalancer services
   * When a gateway creates a LoadBalancer service, MetalLB assigns an IP from the pool
   * The IP becomes the gateway's external address

3. **Examine Gateway Details**:
   * Click on your gateway name to view details
   * **Addresses** section should show:
     * **Type**: "IPAddress"  
     * **Value**: Your assigned external IP
   * **Listeners** should show your configured ports (80, 443)

4. **Document Your External IP**:
   * Note the assigned IP address (e.g., `10.96.1.100`)
   * You'll use this for direct testing in subsequent steps

### Step 3.4: Test External Access with Direct IP

Now you can test your services using the external IP directly, without kubectl proxy.

1. **Navigate to HTTP Testing**:
   * Click the **Traffic & Testing** tab
   * Click the **HTTP Testing** sub-tab
   * Ensure you're on the HTTP Testing interface

2. **Configure Direct External IP Test**:
   * **URL**: `http://<EXTERNAL-IP>/` (replace with your actual IP, e.g., `http://10.96.1.100/`)
   * **Method**: `GET`
   * **Headers Section** (click to expand - enhanced in v0.12.1):
     * Click **"Add Header"**
     * **Header Name**: `Host`
     * **Header Value**: `echo.local`
     * Use the toggle switch to enable this header
   * **Body**: Leave empty for GET requests

3. **Send Test Request**:
   * Click **"Send Request"**
   * **Expected Result**: Response from your echo service
   * **Key Difference**: This request goes directly through the external IP, not kubectl proxy

4. **Compare with Proxy Testing**:
   * Test the same service using kubectl proxy URL: `http://localhost:8001/api/v1/namespaces/demo/services/echo-service:80/proxy/`
   * Notice that both methods work, but external IP is more production-like

5. **Smart URL Analysis** (v0.12.1 Feature):
   * If you enter a private IP range (like 10.x.x.x or 192.168.x.x), the HTTP client shows an informational alert
   * This helps distinguish between external IPs and proxy URLs
   * The alert provides context about network accessibility

### Step 3.5: Enhanced Proxy Management and Troubleshooting

While external IPs are preferred, kubectl proxy remains useful for debugging and development.

1. **Access Proxy Management**:
   * In the **Traffic & Testing** tab → **HTTP Testing** sub-tab
   * Locate the **Proxy Manager** section above the HTTP client

2. **Proxy Manager Features** (Enhanced in v0.8.1):
   * **Automatic kubeconfig detection**: No hardcoded paths, works with any cluster
   * **Pre-flight connectivity testing**: Validates cluster access before starting proxy
   * **Enhanced error reporting**: Specific, actionable error messages
   * **Robust process management**: Reliable PID tracking and cleanup

3. **Start Proxy for Testing**:
   * Click **"Start Proxy"** if not already running
   * Wait for status to show "Running on http://localhost:8001"
   * **Generated URL**: Use this for accessing Kubernetes API directly

4. **Advanced Proxy Operations**:
   * **API Server Access**: Access `http://localhost:8001/api/v1` for raw API exploration
   * **Resource Inspection**: Browse services, pods, and deployments directly
   * **Development Workflow**: Useful for extension development and debugging

5. **Troubleshooting Network Issues**:
   * **Gateway Pending IP**: Check MetalLB installation and IP pool configuration
   * **Connection Refused**: Verify external IP is accessible and service is running
   * **DNS Issues**: Use IP addresses instead of hostnames for testing
   * **Proxy Errors**: Restart proxy if kubectl connectivity fails

### Step 3.6: Understanding Network Architecture

Let's explore how traffic flows through your infrastructure.

1. **Traffic Flow Analysis**:
   ```
   📱 Client Request
         ↓
   🌐 External IP (10.96.1.100:80)
         ↓
   🚪 Envoy Gateway (LoadBalancer Service)
         ↓
   🔀 HTTPRoute Matching (based on Host/Path)
         ↓
   🏢 Backend Service (echo-service:80)
         ↓
   🐳 Pod (echo-service container)
   ```

2. **Component Responsibilities**:
   * **MetalLB**: Assigns and announces external IPs
   * **LoadBalancer Service**: Kubernetes service exposing the gateway
   * **Envoy Gateway**: Processes HTTP rules and forwards traffic
   * **HTTPRoute**: Defines routing logic and backend services
   * **Service**: Kubernetes abstraction for pod access
   * **Pod**: Running application container

3. **Network Layers**:
   * **L4 (Transport)**: MetalLB handles IP assignment and basic routing
   * **L7 (Application)**: Envoy Gateway processes HTTP headers, paths, and methods
   * **Service Discovery**: Kubernetes services provide stable endpoints for pods

### Step 3.7: Production Readiness Considerations

Understanding what makes infrastructure production-ready.

1. **High Availability Setup**:
   * **Multiple Gateway Replicas**: Scale Envoy Gateway for redundancy
   * **IP Pool Management**: Ensure sufficient IPs for all services
   * **Health Checks**: Configure liveness and readiness probes

2. **Security Considerations**:
   * **Network Policies**: Restrict traffic between namespaces
   * **Firewall Rules**: Limit external access to necessary ports
   * **TLS Termination**: Use HTTPS for production traffic (covered in Demo 4)

3. **Monitoring and Observability**:
   * **Metrics Collection**: Monitor traffic patterns and performance
   * **Logging**: Centralize gateway and application logs
   * **Alerting**: Set up notifications for service failures

4. **Resource Management**:
   * **Resource Limits**: Set CPU and memory limits for gateway pods
   * **Scaling Policies**: Configure horizontal pod autoscaling
   * **IP Pool Monitoring**: Track IP address usage and availability

### Demo 3 Cleanup

**Resources to Keep for Next Demo:**
- ✅ **Keep**: `my-first-gateway` (or `demo-gateway`) - needed for TLS configuration in Demo 4
- ✅ **Keep**: `echo-route` - will be used to compare HTTP vs HTTPS behavior
- ✅ **Keep**: MetalLB configuration - permanent infrastructure needed for external IPs
- ✅ **Keep**: All services (`echo-service`, `echo-service-v1`, `echo-service-v2`) - backend services for testing

**Nothing to Clean Up:**
- All infrastructure created in Demo 3 is foundational and will be used in subsequent demos
- MetalLB LoadBalancer is permanent cluster infrastructure
- External IP assignment is required for TLS testing in Demo 4

**Verification:**
```bash
# Verify LoadBalancer is working
kubectl get gateways -n demo
# Should show External IP assigned (e.g., 10.96.1.100)

# Verify services are accessible via external IP
curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
```

### Key Concepts Learned

* **LoadBalancer Services**: How external IPs are assigned and managed in Kubernetes
* **MetalLB Configuration**: Setting up bare-metal LoadBalancer for local development
* **Network Architecture**: Understanding traffic flow from client to application
* **External IP vs Proxy**: Different methods for accessing services and their use cases
* **Proxy Management**: Reliable kubectl connectivity for debugging and development
* **Smart URL Analysis**: v0.12.1 feature helping distinguish network access patterns
* **Production Readiness**: Infrastructure considerations for real-world deployments
* **Troubleshooting**: Common networking issues and resolution strategies

---

## Demo 4: Security with TLS and HTTPS

**What you'll learn**: TLS termination, certificate management, and secure communications

### Understanding HTTPS at the Gateway

TLS termination at the gateway means:

* **Centralized Certificate Management**: One place for all certificates
* **Simplified Backend Services**: Services don't need TLS configuration
* **Performance Benefits**: Dedicated TLS processing
* **Security Compliance**: Encrypted communication with clients

### Step 4.1: Certificate Infrastructure Setup

The extension provides automated certificate management.

1. **Access TLS Management**:
   * Navigate to the **Infrastructure** tab
   * Click the **TLS Certificates** sub-tab
   * The extension automatically checks for cert-manager

2. **Install Certificate Manager**:
   * If cert-manager is missing, click **"Install Cert-manager (v1.14.5)"**
   * Wait for installation to complete (about 30 seconds)
   * Status will change to show certificate management options

3. **Generate Test Certificate**:
   * Click **"Generate Certificate"**
   * **Certificate Name**: `demo-tls-cert`
   * **Namespace**: `demo`
   * **Issuer Type**: `Self-Signed (for testing)`
   * **DNS Names**: 
     * `secure.local`
     * `api.local`
     * `*.local`

### Step 4.2: Create HTTPS Gateway

1. **Create Secure Gateway**:
   * **Gateway Name**: `secure-gateway`
   * **Namespace**: `demo`
   * **Gateway Class**: `envoy-gateway`

2. **Configure HTTPS Listener**:
   * **Name**: `https`
   * **Port**: `443`
   * **Protocol**: `HTTPS`
   * **TLS Mode**: `Terminate`
   * **Certificate Secret**: Select `demo-tls-cert-tls`

### Step 4.3: Create HTTPS Routes

1. **Secure Echo Route**:
   * **Route Name**: `secure-echo-route`
   * **Parent Gateway**: `secure-gateway`
   * **Hostname**: `secure.local`
   * **Path**: `/` (PathPrefix)
   * **Backend**: `echo-service`

### Step 4.4: Test HTTPS Connectivity

1. **Advanced HTTPS Testing**:
   * In **Traffic & Testing** tab, **HTTP Testing** sub-tab
   * **URL**: `https://<SECURE-GATEWAY-IP>/`
   * **Headers**: Use the Headers section (v0.12.1)
     * Add `Host: secure.local`
     * Manage multiple headers with the enhanced interface
   * **TLS Options**: Expand and enable "Ignore Certificate Errors" for self-signed certificates

2. **Verify Secure Communication**:
   * Response should include TLS connection details
   * Headers show secure connection established

### Demo 4 Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: `secure-gateway` - will conflict with security demo TLS configurations
- ❌ **DELETE**: `secure-echo-route` - prevents routing conflicts with subsequent demos

**Resources to Keep for Next Demo:**
- ✅ **Keep**: `demo-tls-cert` - certificate needed for security policy demos
- ✅ **Keep**: cert-manager installation - permanent infrastructure for TLS management
- ✅ **Keep**: All original Demo 1-3 resources (my-first-gateway, echo-route, echo-service)

**Why This Cleanup is Critical:**
- The secure gateway and route will interfere with security policy testing in Demo 7
- Multiple gateways listening on port 443 can cause TLS conflicts
- Security demos require clean TLS certificate setup without conflicting routes

**Cleanup Steps:**
1. **Navigate to Infrastructure Management**:
   * Go to **Infrastructure** tab → **HTTP Routes** sub-tab
   * **Delete**: `secure-echo-route` - click delete icon and confirm

2. **Delete Secure Gateway**:
   * Go to **Infrastructure** tab → **Gateways** sub-tab
   * **Delete**: `secure-gateway` - click delete icon and confirm

3. **Verification Commands**:
   ```bash
   # Verify secure resources are removed
   kubectl get httproutes -n demo
   # Should NOT show: secure-echo-route
   
   kubectl get gateways -n demo
   # Should NOT show: secure-gateway
   # Should still show: my-first-gateway (or demo-gateway)
   
   # Verify certificates remain available
   kubectl get certificates -n demo
   # Should show: demo-tls-cert
   ```

**Expected State After Cleanup:**
- Original Demo 1-3 infrastructure intact (gateway, route, services)
- TLS certificate available but no conflicting HTTPS routes
- Clean foundation for security policy demonstrations

### Key Concepts Learned

* **TLS Termination**: Gateway handles encryption/decryption
* **Certificate Management**: Automated certificate lifecycle
* **Self-Signed Certificates**: For development and testing
* **Security Policies**: How to configure secure communications

---

## Demo 5: Advanced Deployments with Traffic Splitting

**What you'll learn**: Canary deployments, traffic splitting, and advanced deployment patterns

### Understanding Traffic Splitting

Traffic splitting allows you to:

* **Gradually roll out new versions** (Canary deployments)
* **Instantly switch between versions** (Blue-Green deployments)
* **Compare versions with real traffic** (A/B testing)

### Step 5.1: Traffic Splitting Wizard

1. **Access Traffic Splitting**:
   * Navigate to the **Traffic & Testing** tab
   * Click the **Traffic Splitting** sub-tab
   * Choose **Quick Start Wizard**

2. **Select Deployment Pattern**:
   * **Canary Deployment**: Gradual rollout (90% → 70% → 100%)
   * **Blue-Green Deployment**: Instant switch with rollback capability
   * **A/B Testing**: Compare versions with equal traffic

3. **Configure Services**:
   * **Route Name**: `canary-route`
   * **Gateway**: `my-first-gateway`
   * **Service V1**: `app-v1` (stable version)
   * **Service V2**: `app-v2` (new version)
   * **Initial Weights**: 90% v1, 10% v2

### Step 5.2: Deploy and Monitor

1. **Deploy Infrastructure**:
   * Click through the wizard to deploy services
   * Monitor real-time deployment status
   * Verify both service versions are running

2. **Test Traffic Distribution**:
   * Send multiple requests to see distribution
   * Monitor the percentage split in real-time

### Step 5.3: Dynamic Traffic Management

1. **Adjust Traffic Weights**:
   * Use the slider to change traffic distribution
   * Try: 70% v1, 30% v2
   * Apply changes and test immediately

2. **Scenario Management**:
   * Use pre-configured scenarios for common patterns
   * **Canary Stages**: Progressive rollout phases
   * **Emergency Rollback**: Instant return to stable version

### Demo 5 Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: `canary-route` - traffic splitting route conflicts with performance testing
- ❌ **DELETE**: All traffic splitting configurations and weighted routes
- ❌ **DELETE**: Any canary deployment HTTPRoutes created during wizard

**Resources to Keep for Next Demo:**
- ✅ **Keep**: `my-first-gateway` (or `demo-gateway`) - base infrastructure for performance testing
- ✅ **Keep**: `echo-route` - foundation route for load testing
- ✅ **Keep**: `echo-service`, `echo-service-v1`, `echo-service-v2` - backend services for testing
- ✅ **Keep**: All Demo 1-3 foundational infrastructure

**Why This Cleanup is Critical:**
- Traffic splitting routes will interfere with performance testing baseline metrics
- Multiple weighted routes cause unpredictable load distribution during performance tests
- Clean routing setup ensures accurate performance measurements in Demo 6

**Cleanup Steps:**
1. **Navigate to Traffic Splitting Management**:
   * Go to **Traffic & Testing** tab → **Traffic Splitting** sub-tab
   * **Remove**: All active traffic splitting configurations
   * Click **"Reset Traffic Splitting"** if available

2. **Delete Traffic Splitting Routes**:
   * Go to **Infrastructure** tab → **HTTP Routes** sub-tab
   * **Delete**: `canary-route` - click delete icon and confirm
   * **Delete**: Any other traffic splitting routes created during wizard

3. **Clean Up Wizard Resources**:
   * **Undeploy**: Traffic splitting templates if deployed
   * **Reset**: Traffic distribution to default single-service routing

4. **Verification Commands**:
   ```bash
   # Verify only foundation routes remain
   kubectl get httproutes -n demo
   # Should show only: echo-route (from Demo 1)
   
   # Verify services are available for performance testing
   kubectl get services -n demo
   # Should show: echo-service, echo-service-v1, echo-service-v2
   
   # Test baseline routing for performance testing
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   ```

**Expected State After Cleanup:**
- Single, predictable routing configuration for performance baseline
- All backend services available for load testing scenarios
- Clean foundation for accurate performance measurement in Demo 6

### Key Concepts Learned

* **Weighted Routing**: Distributing traffic by percentage
* **Deployment Patterns**: Different strategies for releasing software
* **Risk Management**: Minimizing impact of new releases
* **Real-time Control**: Adjusting traffic without downtime

---

## Demo 6: Performance Testing and Load Validation

**What you'll learn**: Synthetic traffic generation, performance monitoring, and load testing

### Understanding Performance Testing

Performance testing with gateways helps you:

* **Validate routing under load**: Ensure traffic splitting works correctly
* **Establish performance baselines**: Know normal response times
* **Test scalability**: Understand capacity limits
* **Detect issues early**: Find problems before they affect users

### Step 6.1: Configure Traffic Generator

1. **Access Traffic Generator**:
   * In **Traffic & Testing** tab, click **Performance Testing** sub-tab
   * Find **Synthetic Traffic Generator**
   * Switch to **Configuration** tab

2. **Basic Configuration**:
   * **Target URL**: Use your gateway IP
   * **HTTP Method**: `GET`
   * **Requests Per Second**: Start with `50`
   * **Duration**: `60` seconds
   * **Concurrent Connections**: `10`

3. **Advanced Settings**:
   * **Custom Headers**: Use the enhanced Headers interface (v0.12.1)
     * Add `Host: api.local`
     * Toggle headers on/off during testing
     * Easily add multiple headers with "Add Header" button
   * **Request Body**: (for POST requests)
   * **Timeout**: `10` seconds

### Step 6.2: Monitor Real-time Metrics

1. **Start Traffic Test**:
   * Click **"Start Traffic Test"**
   * Switch to **Live Visualization** tab

2. **Monitor Key Metrics**:
   * **Response Times**: Min/Avg/Max latency
   * **Success Rate**: Percentage of successful requests
   * **Status Code Distribution**: 2xx, 4xx, 5xx breakdown
   * **Throughput**: Actual vs. target RPS

3. **Interactive Charts**:
   * **Response Time Distribution**: See performance trends
   * **RPS Monitoring**: Validate target load achievement
   * **Error Analysis**: Identify failure patterns

### Step 6.3: Validate Traffic Splitting Under Load

1. **Configure Canary Test**:
   * Set up traffic splitting (80% v1, 20% v2)
   * Generate load at 200-500 RPS
   * Monitor distribution accuracy

2. **Performance Comparison**:
   * Compare response times between versions
   * Analyze error rates for each service
   * Validate that traffic splitting maintains performance

### Demo 6 Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: All traffic generator configurations and test scenarios
- ❌ **DELETE**: Performance testing profiles and saved configurations
- ❌ **DELETE**: Any temporary routes created for load testing

**Resources to Keep for Next Demo:**
- ✅ **Keep**: All foundational infrastructure (gateways, routes, services)
- ✅ **Keep**: `demo-tls-cert` and cert-manager - needed for security policies
- ✅ **Keep**: MetalLB LoadBalancer configuration - required for external access

**Why This Cleanup is Critical:**
- Running traffic generators can interfere with security policy testing
- High load scenarios may mask security policy enforcement behavior
- Clean baseline needed for accurate security policy validation in Demo 7

**Cleanup Steps:**
1. **Stop All Traffic Generation**:
   * Go to **Traffic & Testing** tab → **Performance Testing** sub-tab
   * **Stop**: Any running traffic tests - click "Stop Traffic Test"
   * **Clear**: Saved test configurations and profiles

2. **Reset Traffic Generator**:
   * **Clear**: All target URLs and configuration parameters
   * **Reset**: Request rates and concurrency settings to defaults
   * **Remove**: Any custom headers or request bodies

3. **Clean Test Data**:
   * **Clear**: Performance metrics and historical data
   * **Reset**: Live visualization charts and dashboards

4. **Verification Commands**:
   ```bash
   # Verify no background traffic generation
   kubectl get pods -n demo
   # Should NOT show traffic generator or load testing pods
   
   # Test normal routing for security demos
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should receive normal response without load
   
   # Verify infrastructure ready for security policies
   kubectl get gateways,httproutes,services -n demo
   ```

**Expected State After Cleanup:**
- No background load generation affecting security testing
- Clean performance metrics baseline for security policy evaluation
- All infrastructure ready for security policy demonstrations

### Key Concepts Learned

* **Load Testing**: Validating performance under realistic conditions
* **Metrics Collection**: Understanding key performance indicators
* **Traffic Validation**: Ensuring routing works correctly under load
* **Performance Analysis**: Using data to make deployment decisions

---

## Demo 7: Security Policies and Access Control

**What you'll learn**: Enterprise security policies, authentication mechanisms, and access control implementation

### Understanding Security Policies

Modern applications require comprehensive security policies to protect against threats and ensure compliance. The extension provides six core security policy types:

* **JWT Authentication**: Token-based authentication with provider configuration and claim mapping
* **Basic Authentication**: Username/password protection with Secret management
* **CORS Policies**: Cross-origin resource sharing configuration for web applications  
* **IP Filtering**: Allow/deny lists for network-based access control
* **Mutual TLS (mTLS)**: Client certificate authentication for the highest security
* **Rate Limiting**: Advanced traffic control with multi-dimensional rate limiting policies

### Step 7.1: Explore the Security Policies Tab

1. **Access Security Management**:
   * Navigate to the **Security & Policies** tab
   * Click the **Security Policies** sub-tab (new in v0.9.0)
   * This provides comprehensive security policy management

2. **Review Security Policy Overview**:
   * The tab shows all six security policy types including JWT Authentication
   * Each has dedicated management interfaces with professional cards
   * Status indicators show current policy configurations

### Step 7.2: Configure Basic Authentication

1. **Create Basic Auth Policy**:
   * Click on **Basic Authentication** section
   * Click **"Add Basic Auth"**
   * **Policy Name**: `api-basic-auth`
   * **Target Type**: `HTTPRoute`
   * **Target Name**: `echo-route` (from Demo 1)

2. **Configure Credentials**:
   * **Username**: `demo`
   * **Password**: `secure123`
   * **Realm**: `Demo API`
   * Choose **"Create new Secret"** to automatically manage credentials

3. **Test Authentication**:
   * In **Traffic & Testing** tab, **HTTP Testing** sub-tab, test the protected route
   * Use the Headers section (v0.12.1) to add authentication:
     * Add `Authorization: Basic ZGVtbzpzZWN1cmUxMjM=` (base64 of demo:secure123)
     * Toggle header on/off to test access control
   * Verify access is restricted without proper credentials

### Step 7.3: Implement CORS Policy

1. **Configure CORS**:
   * In **Security & Policies** tab, **Security Policies** sub-tab, find **CORS Policy** section
   * Click **"Add CORS Policy"**
   * **Policy Name**: `api-cors-policy`
   * **Target**: Your Gateway or HTTPRoute

2. **Set CORS Rules**:
   * **Allowed Origins**: `https://example.com`, `https://app.local`
   * **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`
   * **Allowed Headers**: `Content-Type`, `Authorization`, `X-API-Key`
   * **Max Age**: `3600` seconds

3. **Test CORS**:
   * Use browser developer tools or HTTP client
   * Send preflight OPTIONS request
   * Verify CORS headers in response

### Step 7.4: Set Up IP Filtering

1. **Create IP Filter Policy**:
   * **Policy Name**: `office-access-only`
   * **Action Type**: `Allow` (whitelist mode)
   * **IP Rules**: Add your current IP range

2. **Configure Rules**:
   * **Rule 1**: `192.168.1.0/24` (home network)
   * **Rule 2**: `10.0.0.0/8` (corporate network)
   * **Priority**: Ensure rules are ordered correctly

3. **Test Access Control**:
   * Verify access from allowed IP ranges
   * Simulate blocked access (using proxy or VPN)

### Step 7.5: Advanced Security with mTLS

1. **mTLS Configuration Wizard**:
   * Click **"Configure mTLS"** in Mutual TLS section
   * Follow the step-by-step wizard for complex PKI setup

2. **Step 1 - Basic Configuration**:
   * **Configuration Name**: `secure-gateway-mtls`
   * **Target Gateway**: `secure-gateway` (from Demo 4)

3. **Step 2 - CA Certificate Setup**:
   * Choose **"Create new CA certificate secret"**
   * Paste your CA certificate (or use the provided test certificate)
   * Configure CA private key for certificate generation

4. **Step 3 - Client Validation**:
   * **Client Certificate Mode**: `Required`
   * Configure Certificate Revocation List (CRL) if needed

5. **Step 4 - Review and Apply**:
   * Review complete mTLS configuration
   * Apply settings to enable client certificate authentication

### Step 7.6: Advanced Rate Limiting (v0.9.1)

1. **Rate Limiting Overview**:
   * Navigate to the **Security & Policies** tab, **Security Policies** sub-tab
   * Find the **Rate Limiting** section
   * Configure sophisticated traffic control policies
   * Multi-dimensional rate limiting with burst allowances

2. **Create Rate Limiting Policy**:
   * Click **"Add Rate Limit Policy"**
   * **Policy Name**: `api-rate-limit`
   * **Target Type**: `HTTPRoute`
   * **Target Name**: `echo-route` (from Demo 1)

3. **Configure Rate Limits**:
   * **Requests per Time Unit**: `100 requests per minute`
   * **Dimension**: Choose from:
     * `Global` - Apply to all traffic
     * `Per-IP` - Limit per client IP address
     * `Per-Header` - Rate limit based on header values
     * `Per-User` - User-specific rate limiting
   * **Burst Allowance**: `10` (extra requests allowed in bursts)
   * **Enforcement Mode**: `Enforce` (or `Shadow` for monitoring)

4. **Test Rate Limiting**:
   * Navigate to **Traffic & Testing** tab, **Performance Testing** sub-tab
   * Find the **Rate Limit Testing** section
   * **Burst Test Configuration**:
     * **URL**: Your echo service endpoint
     * **Request Count**: `150` (exceeds limit)
     * **Concurrency**: `10` concurrent connections
     * **Delay**: `100ms` between requests
   * Click **"Start Burst Test"**

5. **Analyze Results**:
   * Monitor real-time metrics and response times
   * Observe 429 (Too Many Requests) responses
   * Check rate limit headers in HTTP client Response tab:
     * `X-RateLimit-Limit`: Total requests allowed
     * `X-RateLimit-Remaining`: Requests remaining
     * `X-RateLimit-Reset`: When limit resets
     * `Retry-After`: Suggested retry timing
   * Use the enhanced Headers interface (v0.12.1) to add custom headers for testing

6. **Advanced Configuration**:
   * **Per-IP Rate Limiting**: Limit requests per client IP
   * **Header-based Limiting**: Rate limit based on API keys or user tokens
   * **Time Unit Flexibility**: Configure limits per second, minute, hour, or day
   * **Shadow Mode**: Monitor without enforcement for testing

### Step 7.7: Resource Creation Wizard

1. **Guided Resource Creation**:
   * Use the **Resource Creation Wizard** (new in v0.9.0)
   * Navigate through multi-step guided interface
   * Create complex configurations with contextual help

2. **YAML Editor for Power Users**:
   * Access the **YAML Editor** for advanced configurations
   * Syntax highlighting and real-time validation
   * Template insertion and comprehensive error reporting

### Demo 7 Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: `api-basic-auth` policy - BasicAuth conflicts with JWT authentication
- ❌ **DELETE**: `api-cors-policy` - CORS policies can interfere with JWT headers
- ❌ **DELETE**: `office-access-only` IP filtering policy - IP restrictions conflict with JWT testing
- ❌ **DELETE**: `api-rate-limit` policy - rate limiting interferes with JWT authentication flow

**Resources to Keep for Next Demo:**
- ✅ **Keep**: mTLS configurations (if created) - can coexist with JWT authentication
- ✅ **Keep**: All foundational infrastructure (gateways, routes, services, certificates)
- ✅ **Keep**: cert-manager and TLS certificate for potential HTTPS JWT endpoints

**Why This Cleanup is Critical:**
- BasicAuth and JWT authentication cannot be applied to the same route simultaneously
- CORS policies may interfere with JWT token headers (Authorization, Bearer tokens)
- IP filtering can block JWT authentication testing from different network contexts
- Rate limiting policies may throttle JWT authentication flows during testing

**Cleanup Steps:**
1. **Remove Authentication Policies**:
   * Go to **Security & Policies** tab → **Security Policies** sub-tab
   * **Delete**: `api-basic-auth` policy - click delete icon and confirm
   * **Remove**: BasicAuth enforcement from all routes

2. **Remove Access Control Policies**:
   * **Delete**: `api-cors-policy` - click delete icon and confirm
   * **Delete**: `office-access-only` IP filtering policy - click delete icon and confirm

3. **Remove Rate Limiting**:
   * **Delete**: `api-rate-limit` policy - click delete icon and confirm
   * **Stop**: Any running burst tests in Performance Testing section

4. **Preserve mTLS (if configured)**:
   * **Keep**: mTLS configurations as they can work alongside JWT
   * **Review**: mTLS settings to ensure they don't conflict with JWT testing

5. **Verification Commands**:
   ```bash
   # Verify security policies are removed
   kubectl get securitypolicies -A
   # Should NOT show: api-basic-auth, api-cors-policy, office-access-only, api-rate-limit
   
   # Test route accessibility without authentication
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should work without authentication headers
   
   # Verify foundation remains intact
   kubectl get gateways,httproutes,certificates -n demo
   ```

**Expected State After Cleanup:**
- Routes accessible without conflicting authentication mechanisms
- No CORS or IP filtering policies interfering with JWT headers
- Clean foundation ready for JWT authentication configuration
- mTLS configurations preserved if they don't conflict with JWT testing

### Key Concepts Learned

* **Enterprise Security**: Implementing comprehensive security policies
* **Authentication Mechanisms**: Username/password and certificate-based authentication
* **Access Control**: Network-based and application-level restrictions
* **Rate Limiting**: Advanced traffic control with multi-dimensional policies
* **Burst Testing**: Validating rate limiting behavior under load
* **Professional Security Management**: Step-by-step wizards for complex configurations

---

## Demo 8: JWT Authentication and Policy Management

**What you'll learn**: JWT authentication implementation, provider configuration, token testing, and claim-to-header mapping

### Understanding JWT Authentication

JSON Web Tokens (JWT) provide a modern, stateless authentication mechanism that's perfect for microservices and API architectures. The extension provides comprehensive JWT authentication capabilities:

* **Provider Configuration**: Set up JWT providers with issuer, JWKS URI, and audience validation
* **Claim-to-Header Mapping**: Map JWT token claims to HTTP headers for downstream services
* **Token Testing**: Built-in JWT token validation and testing tools
* **Multi-Provider Support**: Configure multiple JWT providers per policy
* **Real-time Validation**: Client-side JWT parsing with comprehensive error handling

### Step 8.1: Explore JWT Authentication Interface

1. **Access JWT Management**:
   * Navigate to the **Security & Policies** tab
   * Click the **Security Policies** sub-tab
   * Find the **JWT Authentication** section (new in v0.10.0)
   * This provides complete JWT policy management capabilities

2. **Review JWT Authentication Overview**:
   * Professional cards showing JWT policies and providers
   * Status indicators for JWT policy configurations
   * Integration with existing security policy management

### Step 8.2: Configure JWT Provider

1. **Create JWT Authentication Policy**:
   * Click **"Add JWT Policy"** in the JWT Authentication section
   * **Policy Name**: `api-jwt-auth`
   * **Target Type**: `HTTPRoute`
   * **Target Name**: `echo-route` (from Demo 1)
   * **Namespace**: `demo`

2. **Configure JWT Provider - Step 1: Basic Information**:
   * **Provider Name**: `auth0-provider`
   * **Issuer**: `https://your-domain.auth0.com/`
   * **Audiences**: `["https://api.example.com", "your-api-identifier"]`

3. **Configure JWT Provider - Step 2: JWKS Configuration**:
   * **JWKS URI**: `https://your-domain.auth0.com/.well-known/jwks.json`
   * This endpoint provides the public keys for token validation
   * The extension will fetch keys automatically during validation

4. **Configure JWT Provider - Step 3: Claim Mapping**:
   * Map JWT claims to HTTP headers for downstream services:
     * **Claim**: `sub` → **Header**: `x-user-id`
     * **Claim**: `email` → **Header**: `x-user-email`
     * **Claim**: `role` → **Header**: `x-user-role`
   * Choose whether claims are **Required** or **Optional**

5. **Configure JWT Provider - Step 4: Policy Settings**:
   * **JWT Required**: `true` (enforce authentication)
   * **Strip Token**: `false` (pass token to backend)
   * **Review and Create Policy**

### Step 8.3: Test JWT Authentication

1. **Generate Test JWT Token**:
   * Navigate to the **Traffic & Testing** tab
   * Click the **HTTP Testing** sub-tab
   * Find the **JWT Testing Tools** section (new in v0.10.0)
   * Click **"JWT Token Generator"**

2. **Create Sample Token**:
   * **Issuer**: `https://your-domain.auth0.com/`
   * **Audience**: `https://api.example.com`
   * **Subject**: `user123`
   * **Claims**:
     * `email`: `user@example.com`
     * `role`: `admin`
     * `name`: `Test User`
   * **Expiration**: `1 hour from now`
   * Click **"Generate JWT Token"**

3. **Test JWT-Protected Endpoint**:
   * In the **HTTP Testing Client**, configure JWT authentication:
   * **URL**: Your echo service endpoint
   * **Method**: `GET`
   * **JWT Authentication**: Enable in the JWT Authentication accordion
   * **Token**: Paste the generated JWT token
   * **Header Name**: `Authorization`
   * **Token Prefix**: `Bearer `
   * **Headers**: The enhanced Headers interface (v0.12.1) will show the JWT header automatically
   * Click **"Send Request"**

4. **Analyze JWT Token Details**:
   * Use the **JWT Tester** component to analyze tokens:
   * **Token Input**: Paste any JWT token
   * **Validation Settings**:
     * **Validate Signature**: Enable for production tokens
     * **Check Expiration**: Enable
     * **Expected Issuer**: `https://your-domain.auth0.com/`
     * **Expected Audience**: `https://api.example.com`
   * Click **"Analyze Token"**

5. **Review Token Analysis**:
   * **Header**: Algorithm, token type, key ID
   * **Payload**: Claims including issuer, audience, expiration
   * **Validation Results**: Signature status, expiration check, issuer/audience validation
   * **Claim Extraction**: See how claims would be mapped to headers

### Step 8.4: Advanced JWT Testing Workflows

1. **Mock Request Testing**:
   * Configure mock HTTP requests with JWT authentication
   * Test different token scenarios (valid, expired, invalid issuer)
   * Verify claim mapping and header generation

2. **Token Validation Scenarios**:
   * **Valid Token**: Proper issuer, audience, and unexpired
   * **Expired Token**: Test expiration handling
   * **Invalid Issuer**: Wrong issuer URL
   * **Invalid Audience**: Audience mismatch
   * **Malformed Token**: Invalid JWT structure

3. **Integration with HTTP Client**:
   * Use the enhanced HTTP client with JWT authentication support
   * **JWT Configuration Panel**: Easy token management
   * **Headers Interface**: Enhanced header management (v0.12.1) with toggle controls
   * **Local Validation**: Client-side token validation before sending
   * **Request History**: Save and replay JWT-authenticated requests

### Step 8.5: Production JWT Configuration

1. **Real JWT Provider Setup**:
   * Configure actual JWT providers (Auth0, Okta, Azure AD, etc.)
   * Use real JWKS endpoints for production scenarios
   * Set up proper audience and issuer validation

2. **Claim Mapping Best Practices**:
   * Map essential user information to headers
   * Common patterns:
     * `sub` → `x-user-id` (user identifier)
     * `email` → `x-user-email` (user email)
     * `role` or `scope` → `x-user-role` (permissions)
     * `tenant` → `x-tenant-id` (multi-tenancy)

3. **Security Considerations**:
   * Always validate JWT signatures in production
   * Use HTTPS for all JWT-protected endpoints
   * Configure appropriate token expiration times
   * Monitor for suspicious authentication patterns

### Step 8.6: Multi-Provider JWT Setup

1. **Configure Multiple Providers**:
   * Add additional JWT providers for different user types
   * **Provider 2**: Internal service authentication
   * **Provider 3**: Partner API authentication
   * Each provider can have different claim mappings

2. **Provider Priority and Fallback**:
   * Configure provider evaluation order
   * Test fallback scenarios when primary provider fails
   * Validate provider-specific claim mapping

### Demo 8 Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: `api-jwt-auth` policy - JWT policies can conflict with resilience policy testing
- ❌ **DELETE**: `auth0-provider` JWT provider configuration
- ❌ **DELETE**: All JWT authentication policies and provider configurations
- ❌ **DELETE**: JWT testing tokens and saved authentication configurations

**Resources to Keep for Next Demo:**
- ✅ **Keep**: All foundational infrastructure (gateways, routes, services)
- ✅ **Keep**: TLS certificates - may be useful for resilience policy testing
- ✅ **Keep**: mTLS configurations - can coexist with resilience policies

**Why This Cleanup is Critical:**
- JWT authentication adds latency that interferes with accurate timeout policy testing
- Authentication failures can mask resilience policy behavior (retry vs auth failure)
- Clean routes needed to isolate resilience policy effects from authentication overhead
- Token validation timeouts can interfere with gateway timeout policy evaluation

**Cleanup Steps:**
1. **Remove JWT Authentication Policies**:
   * Go to **Security & Policies** tab → **Security Policies** sub-tab
   * **Delete**: `api-jwt-auth` policy - click delete icon and confirm
   * **Remove**: JWT authentication from all routes

2. **Clean JWT Provider Configuration**:
   * **Delete**: `auth0-provider` JWT provider - click delete icon and confirm
   * **Remove**: All JWT provider configurations
   * **Clear**: JWKS URI and audience configurations

3. **Reset JWT Testing Tools**:
   * Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab
   * **Clear**: JWT token configurations in HTTP client
   * **Remove**: Saved JWT tokens and authentication headers
   * **Reset**: JWT tester component configurations

4. **Clean Authentication Headers**:
   * **Remove**: Authorization headers from HTTP client
   * **Clear**: JWT token prefixes and Bearer token configurations
   * **Reset**: Headers interface to default state

5. **Verification Commands**:
   ```bash
   # Verify JWT policies are removed
   kubectl get securitypolicies -A
   # Should NOT show JWT authentication policies
   
   # Test route accessibility without JWT
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should work without JWT authentication
   
   # Verify clean routing for resilience testing
   kubectl get httproutes -n demo
   # Should show clean routes without authentication requirements
   ```

**Expected State After Cleanup:**
- Routes accessible without JWT authentication overhead
- Clean request/response patterns for accurate resilience policy testing
- No authentication-related timeouts interfering with gateway timeout policies
- Foundation ready for pure resilience policy evaluation

### Key Concepts Learned

* **JWT Authentication**: Modern token-based authentication implementation
* **Provider Configuration**: Setting up JWT issuers, JWKS endpoints, and audiences
* **Claim Mapping**: Converting JWT claims to HTTP headers for downstream services
* **Token Testing**: Comprehensive JWT validation and testing workflows
* **Multi-Provider Support**: Managing multiple JWT providers with different configurations
* **Security Best Practices**: Production-ready JWT authentication patterns

---

## Demo 9: Resilience Policies and Reliability

**What you'll learn**: Configure timeout and retry policies for production-grade reliability

### Understanding Resilience Policies

In production environments, your applications need to handle failures gracefully. Resilience policies help your gateway and services remain stable when things go wrong by:

* **Timeout Policies**: Preventing requests from hanging indefinitely
* **Retry Policies**: Automatically retrying failed requests with intelligent backoff
* **Circuit Breaking**: Stopping requests to failing services (future feature)
* **Bulkhead Isolation**: Limiting resource usage per client/service (future feature)

### Step 9.1: Configure Timeout Policies

Timeouts ensure that requests don't hang indefinitely, protecting your system from resource exhaustion.

1. **Navigate to Resilience Policies**:
   * Go to the **Security & Policies** tab
   * Click the **Resilience Policies** sub-tab
   * You'll see an overview dashboard with policy statistics

2. **Create a Timeout Policy**:
   * Click **"Add Timeout Policy"**
   * Configure the following timeouts:
     - **Request Timeout**: 30 seconds (maximum time for complete request)
     - **Backend Connection Timeout**: 10 seconds (time to establish connection)
     - **Backend Response Timeout**: 25 seconds (time to receive response)
     - **Idle Timeout**: 60 seconds (connection idle time)

3. **Apply to Your Gateway**:
   * Select your gateway as the target
   * Save the policy and observe it in the dashboard

### Step 9.2: Configure Retry Policies

Retry policies automatically retry failed requests, helping your application handle transient failures.

1. **Create a Retry Policy**:
   * Click **"Add Retry Policy"**
   * Configure retry settings:
     - **Max Retries**: 3 attempts
     - **Per-Try Timeout**: 10 seconds
     - **Retry Conditions**: HTTP 502, 503, 504 status codes
     - **Connection Failures**: Enable retry on connection errors

2. **Configure Exponential Backoff**:
   * **Base Interval**: 1000ms (1 second)
   * **Max Interval**: 30000ms (30 seconds)  
   * **Multiplier**: 2.0 (double the delay each retry)
   * **Jitter**: Enable to prevent thundering herd

3. **Preview Retry Timeline**:
   * The interface shows a timeline of retry attempts
   * First retry: ~1s, Second retry: ~2s, Third retry: ~4s
   * Total time with jitter: approximately 7-10 seconds

### Step 9.3: Test Resilience Policies

Test your policies to ensure they work as expected.

1. **Test Timeout Behavior**:
   * Use the HTTP Testing client to make requests
   * Try requesting a slow endpoint (if available)
   * Observe timeout enforcement after 30 seconds

2. **Test Retry Behavior**:
   * Configure your echo service to return 503 errors temporarily
   * Make requests and observe retry attempts in logs
   * See exponential backoff in action

3. **Monitor Policy Status**:
   * Check the Resilience Policies dashboard
   * View policy status and application targets
   * Monitor which policies are active

### Step 9.4: Production Best Practices

Apply these practices for production deployments:

1. **Timeout Guidelines**:
   * Set request timeouts based on your SLA requirements
   * Use shorter timeouts for fast APIs (5-15 seconds)
   * Use longer timeouts for complex operations (30-60 seconds)
   * Set backend timeouts slightly less than request timeouts

2. **Retry Guidelines**:
   * Limit retries to 3-5 attempts maximum
   * Only retry on transient errors (5xx status codes, connection errors)
   * Never retry on 4xx client errors
   * Use exponential backoff with jitter to prevent load spikes

3. **Testing Strategy**:
   * Test policies under normal and failure conditions
   * Verify timeout behavior with slow services
   * Validate retry limits prevent infinite loops
   * Monitor impact on overall system performance

### What You've Accomplished

In this demo, you've learned to:

* ✅ Configure comprehensive timeout policies for request protection
* ✅ Implement intelligent retry policies with exponential backoff
* ✅ Apply resilience policies to Gateways and HTTPRoutes
* ✅ Test policy behavior and monitor effectiveness
* ✅ Understand production best practices for reliability

Your gateway now has enterprise-grade resilience policies that will help maintain service availability even when individual components fail.

### Demo 9 Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: All timeout policies applied to gateways and routes
- ❌ **DELETE**: All retry policies with exponential backoff configurations
- ❌ **DELETE**: Resilience policy configurations from Demo 9

**Resources to Keep for Next Demo:**
- ✅ **Keep**: All foundational infrastructure (gateways, routes, services)
- ✅ **Keep**: TLS certificates and cert-manager for operational monitoring
- ✅ **Keep**: LoadBalancer configuration for external access monitoring

**Why This Cleanup is Critical:**
- Timeout and retry policies can mask operational issues during monitoring demos
- Resilience policies may affect normal response patterns needed for troubleshooting
- Clean baseline required for accurate operational health monitoring in Demo 10
- Retry policies can complicate error analysis and troubleshooting scenarios

**Cleanup Steps:**
1. **Remove Resilience Policies**:
   * Go to **Security & Policies** tab → **Resilience Policies** sub-tab
   * **Delete**: All timeout policies - click delete icon and confirm
   * **Delete**: All retry policies - click delete icon and confirm

2. **Reset Policy Dashboard**:
   * **Clear**: Policy statistics and monitoring data
   * **Reset**: Resilience policy dashboard to default state

3. **Verify Policy Removal**:
   * **Check**: No active resilience policies shown in dashboard
   * **Confirm**: Routes operate with default timeout/retry behavior

4. **Test Normal Operation**:
   * **Verify**: Routes respond normally without policy interference
   * **Confirm**: Clean request/response patterns for monitoring

5. **Verification Commands**:
   ```bash
   # Verify resilience policies removed
   kubectl get backendtrafficpolicies -A
   # Should NOT show timeout or retry policies
   
   # Test normal route behavior
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should respond with default timeout/retry behavior
   
   # Verify infrastructure ready for monitoring
   kubectl get gateways,httproutes,services -n demo
   ```

**Expected State After Cleanup:**
- Clean request/response patterns without resilience policy interference
- Default timeout and retry behavior for accurate operational monitoring
- All infrastructure ready for comprehensive operational monitoring in Demo 10

---

## Demo 10: Operational Monitoring and Troubleshooting

**What you'll learn**: System monitoring, troubleshooting, and operational best practices

### Understanding Operational Excellence

Production gateways require:

* **Real-time monitoring**: Know what's happening now
* **Comprehensive troubleshooting**: Quickly identify and fix issues
* **Proactive management**: Prevent problems before they occur

### Step 10.1: System Health Monitoring

1. **Consolidated Dashboard**:
   * Navigate to the **Quick Start** tab
   * Click the **Overview** sub-tab
   * View comprehensive system overview
   * Monitor gateway, route, and service health

2. **Health Indicators**:
   * **Green**: All resources operational
   * **Yellow**: Some issues but system functional
   * **Red**: Critical issues affecting operation

3. **Resource Status**:
   * **Gateway Count**: Number of deployed gateways
   * **Route Count**: Number of configured routes
   * **Service Health**: Backend service connectivity
   * **Proxy Status**: kubectl proxy reliability (v0.8.1)

### Step 10.2: Enhanced Troubleshooting (v0.8.1)

1. **Improved Error Reporting**:
   * **Specific Error Messages**: No more "Unknown error"
   * **Actionable Guidance**: Clear resolution steps
   * **Enhanced Logging**: Comprehensive troubleshooting information

2. **Common Issues and Solutions**:
   * **Gateway Not Ready**: Check LoadBalancer and DNS configuration
   * **HTTPRoute Not Accepted**: Verify parent references and backend services
   * **Service Connectivity**: Validate network policies and service endpoints
   * **Proxy Connectivity**: Enhanced kubectl proxy with automatic recovery

3. **Diagnostic Tools**:
   * **Resource Inspector**: View YAML configurations
   * **Event Analysis**: Kubernetes events correlation
   * **Connection Testing**: Validate network connectivity

### Step 10.3: Best Practices

1. **Regular Monitoring**:
   * Review dashboard status regularly
   * Monitor certificate expiration dates
   * Check LoadBalancer pool utilization

2. **Performance Optimization**:
   * Use traffic splitting for gradual rollouts
   * Monitor response times and error rates
   * Optimize backend service performance

3. **Security Maintenance**:
   * Keep certificates updated
   * Review and update security policies
   * Monitor for unusual traffic patterns

### Demo 10 Complete Environment Reset

**IMPORTANT**: Demo 10 focuses on operational monitoring and troubleshooting. After completing the operational demonstrations, you should perform a complete environment reset to return to a clean state.

**Complete Cleanup (All Demo Resources):**

1. **Remove All HTTPRoutes**:
   ```bash
   kubectl delete httproutes --all -n demo
   ```

2. **Remove All Gateways**:
   ```bash
   kubectl delete gateways --all -n demo
   ```

3. **Remove Demo Services**:
   ```bash
   kubectl delete services echo-service echo-service-v1 echo-service-v2 -n demo
   kubectl delete deployments echo-service echo-service-v1 echo-service-v2 -n demo
   ```

4. **Remove TLS Certificates**:
   ```bash
   kubectl delete certificates --all -n demo
   kubectl delete secrets --all -n demo
   ```

5. **Remove Demo Namespace** (Optional):
   ```bash
   kubectl delete namespace demo
   ```

6. **Reset Extension State**:
   * Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab
   * **Stop**: kubectl proxy if running
   * **Clear**: All saved configurations and request history
   * **Reset**: Template gallery to undeployed state

**Infrastructure to Preserve** (if desired):
- ✅ **Keep**: cert-manager installation (cluster-wide utility)
- ✅ **Keep**: MetalLB LoadBalancer configuration (cluster infrastructure)
- ✅ **Keep**: Envoy Gateway installation (cluster infrastructure)

**Verification of Clean State**:
```bash
# Verify demo resources removed
kubectl get all -n demo
# Should show: No resources found

# Verify cluster infrastructure remains
kubectl get gatewayclasses
# Should show: envoy-gateway

# Verify LoadBalancer remains functional
kubectl get pods -n metallb-system
# Should show MetalLB pods running
```

**Return to Clean State:**
After this cleanup, you can:
- Start fresh with Demo 1 for new learning scenarios
- Use the clean environment for your own Envoy Gateway projects
- Apply the learned concepts to production deployments
- Experiment with different configurations without conflicts

### Key Concepts Learned

* **Operational Visibility**: Understanding system health at a glance
* **Proactive Troubleshooting**: Identifying issues before they become problems
* **Performance Monitoring**: Tracking key metrics for optimization
* **Maintenance Practices**: Keeping your gateway healthy and secure
* **Environment Management**: Complete lifecycle management from deployment to cleanup

---

## Conclusion and Next Steps

Congratulations! You've completed a comprehensive tour of the Envoy Gateway Docker Desktop Extension. You've learned:

### Core Concepts Mastered

* **Gateway Fundamentals**: Entry points, routing rules, and service connections
* **Advanced Routing**: Header-based routing, method matching, and traffic control
* **Infrastructure Management**: LoadBalancer configuration and networking
* **Security Implementation**: TLS termination, certificate management, and HTTPS
* **Advanced Deployments**: Traffic splitting, canary deployments, and A/B testing
* **Performance Validation**: Load testing, metrics collection, and performance analysis
* **Enterprise Security**: Comprehensive security policies with authentication, access control, and advanced rate limiting
* **JWT Authentication**: Modern token-based authentication with provider configuration and claim mapping
* **Resilience Policies**: Production-grade timeout and retry policies for reliability
* **Operational Excellence**: Monitoring, troubleshooting, and maintenance

### Continue Learning

* **Explore Advanced Features**: Circuit breakers, custom policies, and advanced traffic management
* **Production Deployment**: Export configurations for production environments  
* **Integration**: Connect with monitoring and observability tools
* **Community**: Join the Envoy Gateway community for updates and support

### Additional Resources

* **Documentation**: [gateway.envoyproxy.io](https://gateway.envoyproxy.io)
* **GitHub Repository**: [envoyproxy/gateway](https://github.com/envoyproxy/gateway)
* **Community**: Join discussions and get support
* **Extension Updates**: Check for new features and improvements

You now have the knowledge and tools to implement modern, scalable, and secure API gateway solutions. Start applying these concepts to your own projects and continue exploring the powerful capabilities of Envoy Gateway!

## 🎉 What's New in v0.12.1 - Production Ready

This demo guide reflects the production-ready release of v0.12.1 with enhanced user experience and reliability improvements:

**🎯 Enhanced HTTP Client Experience**:
- **Professional headers interface** with toggle controls and visual header count indicators
- **"Add Header" functionality** for seamless management of multiple headers
- **Smart URL analysis** with proactive detection of `.local` domains and private IPs
- **Enhanced error handling** with comprehensive, formatted error messages and actionable solutions
- **Alternative method suggestions** with automatic recommendations for kubectl proxy or port forwarding
- **Seamless integration** with JWT authentication and TLS testing workflows

**🚀 Template Gallery Improvements**:
- **Real-time deployment status** with "Deployed" badges showing actual deployment state
- **Comprehensive undeploy functionality** for all templates with confirmation dialogs
- **Smart template detection** that accurately tracks which templates are actually deployed
- **Resource preview** during undeploy operations for safe resource management
- **Enhanced deployment notifications** with bottom-right corner alerts for clear feedback

**📊 Dynamic Dashboard Monitoring**:
- **Automatic deployment discovery** that detects services in demo namespace without hardcoding
- **Multi-template support** for different deployment patterns (Basic HTTP, Traffic Splitting, TLS Termination)
- **Real-time service monitoring** that adapts to actual deployed resources (echo-service, echo-service-v1/v2, etc.)
- **Intelligent resource tracking** that eliminates "Deployment not found" errors
- **Production-grade monitoring** with comprehensive deployment lifecycle management

**🛡️ Enterprise-Ready Architecture**:
- **VM service backend** with full system access eliminating Docker Desktop extension limitations
- **Robust error handling** throughout the application with user-friendly guidance
- **Performance optimizations** including API caching and memory leak prevention
- **Professional UI/UX** with Material-UI design patterns and responsive interface
- **Comprehensive testing support** with three reliable testing methods

**📚 Complete Documentation Updates**:
- **Updated demo guide** reflecting all v0.12.1 features and improvements
- **Enhanced testing instructions** with clear guidance for all deployment scenarios  
- **Best practices documentation** for enterprise API gateway management
- **Production deployment guidance** with real-world usage patterns

Version 0.12.1 represents the culmination of 12 major iterations, delivering a production-ready Docker Desktop Extension that provides enterprise-grade Envoy Gateway management capabilities with an intuitive, reliable user experience.
