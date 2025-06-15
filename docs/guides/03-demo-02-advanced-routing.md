# Demo 2: Intelligent HTTP Routing

**What you'll learn**: Advanced request matching, header-based routing, and multi-service architectures

## Understanding Advanced Routing

Real applications need more than simple path matching. You might need to:

* Route different API versions to different services
* Direct mobile traffic to specialized backends
* Implement feature flags through headers
* Route based on user types or geographical location

## Step 2.1: Deploy Multi-Service Architecture

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

## Step 2.2: Header-Based Routing

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

## Step 2.3: Method-Based Routing

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

## Step 2.4: Test Advanced Routing

Now let's verify that your advanced routing rules work correctly using the enhanced HTTP Testing client.

### Test 1: Header-Based Routing

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

### Test 2: Method-Based Routing

**⚠️ Important**: Method-based routing only works through the Gateway! kubectl proxy URLs bypass gateway routing and go directly to services.

**🔧 Docker Desktop Limitation**: Gateway External IPs are often not accessible from Docker Desktop. If you get "Network error" or "no route to host", this is expected behavior.

**📋 Testing Options (in order of preference):**

**Option 1: Port Forward Manager (Recommended - New in v0.12.2)**
1. **Use the built-in Port Forward Manager**:
   * Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab
   * In the **Port Forward Manager** section, click **"Start Gateway Port Forward"**
   * The URL will automatically populate in the HTTP Client below
   * Perfect for testing gateway routing rules!

**Option 2: Manual Port Forwarding (Command Line)**
1. **Set up port forwarding manually**:
   ```bash
   kubectl port-forward service/envoy-gateway-lb 8080:80 -n envoy-gateway-system
   ```

2. **Test POST to v2 service**:
   * **URL**: `http://localhost:8080/api/data` (or use URL from Port Forward Manager)
   * **Method**: `POST`
   * **Headers**: `Host: api.local`
   * **Expected**: Response from `echo-service-v2`

3. **Test GET to v1 service**:
   * **URL**: `http://localhost:8080/api/data` (or use URL from Port Forward Manager)
   * **Method**: `GET`
   * **Headers**: `Host: api.local`
   * **Expected**: Response from `echo-service-v1`

**Option 3: Gateway External IP (if accessible)**
* Use your gateway's external IP instead of localhost:8080
* Follow same URL patterns and headers as above

**Option 4: kubectl proxy (Limited - bypasses routing)**
* Only use for basic connectivity testing
* Does not properly test method-based routing

## Key Concepts Learned

* **Route Priority**: More specific routes (with headers) are evaluated before general routes
* **Header Matching**: Enables API versioning, feature flags, and A/B testing
* **Method-Based Routing**: Separates read and write operations to different services
* **Multi-Service Architecture**: Realistic patterns for microservices routing

## Cleanup

Before moving to the next demo:

1. **Keep Infrastructure**: Gateway and all HTTPRoutes will be used in Demo 3
2. **Keep Services**: All echo services will be used for continued testing

---

**Next:** [Demo 3: Infrastructure Setup](./04-demo-03-infrastructure.md) - Configure the underlying infrastructure