# Demo 1: Your First Gateway

**What you'll learn**: Basic gateway concepts, simple HTTP routing, and testing

## Understanding the Basics

Before diving into configuration, let's understand the key components:

* **Gateway**: The entry point that listens for incoming traffic
* **HTTPRoute**: Rules that determine how requests are routed to services
* **Backend Service**: Your application that serves requests

Think of it like a reception desk at a building: the Gateway is the desk, HTTPRoutes are the directory rules, and backend services are the actual offices.

## Step 1.1: Deploy a Sample Application

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

## Step 1.2: Create Your First Gateway

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

## Step 1.3: Create Your First Route

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

## Step 1.4: Test Your Setup

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
   
   **Option A - Port Forward Manager (Recommended - New in v0.12.2)**:
   * In the **Port Forward Manager** section (top of HTTP Testing)
   * Click **"Start Gateway Port Forward"** for instant setup
   * The URL will automatically populate in the HTTP Client below
   * **Headers**: Add `Host: echo.local` using the enhanced Headers interface
   * Click **"Send Request"** - perfect for testing gateway routing!
   
   **Option B - Gateway External IP (if accessible)**:
   * Go to **Infrastructure** tab → **Gateways** section
   * Find your gateway's **External IP** (e.g., `10.96.1.100`)
   * **URL**: `http://<GATEWAY-EXTERNAL-IP>/` (replace with actual IP)
   * **Smart URL Detection**: If you enter a private IP, the HTTP Client will show a helpful info alert
   * **Headers**: Click to expand the Headers section (new in v0.12.1)
     * Add custom header: `Host: echo.local`
     * Toggle headers on/off as needed
     * Use "Add Header" button for additional headers
   * Click **"Send Request"**
   
   **Option C - kubectl proxy (for service testing)**:
   * **URL**: `http://localhost:8001/api/v1/namespaces/demo/services/echo-service:80/proxy/`
   * **Headers**: No Host header needed for proxy testing
   * Click **"Send Request"**
   * **Note**: This bypasses gateway routing rules
   
   **Option D - If you accidentally use `.local` domains**:
   * The HTTP Client will automatically detect URLs like `http://echo.local/`
   * Shows an informational alert with specific guidance
   * Provides direct suggestions for Port Forward Manager or kubectl proxy

5. **Examine the Response**:
   * You should see JSON containing request details
   * Notice headers added by the gateway (like `x-envoy-*`)

**What happened?** Your first request traveled through the gateway to your service! The echo service returned details about the request, showing that routing worked correctly.

## Key Concepts Learned

* **Gateway**: Entry point for external traffic
* **HTTPRoute**: Routing rules that match requests and direct them to services
* **Host Headers**: Used by the gateway to determine routing decisions
* **Testing Methods**: Different approaches for testing in Docker Desktop environment

## Cleanup

Before moving to the next demo:

1. **Optional**: Delete the HTTPRoute and Gateway if you want a clean slate
2. **Keep the Echo Service**: We'll use it in the next demo for advanced routing

---

**Next:** [Demo 2: Intelligent HTTP Routing](./03-demo-02-advanced-routing.md) - Learn advanced routing patterns and request matching