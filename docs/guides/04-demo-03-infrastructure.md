# Demo 3: Infrastructure and LoadBalancer Setup

**What you'll learn**: LoadBalancer configuration, gateway IP assignment, networking fundamentals, and production-ready infrastructure management

## Understanding LoadBalancers in Kubernetes

LoadBalancers are essential for exposing services to external traffic. In production environments, cloud providers manage this automatically, but in Docker Desktop, we need MetalLB to provide this functionality.

**🔍 Key Concepts:**
* **LoadBalancer Service**: Kubernetes service type that provisions an external IP
* **MetalLB**: Bare-metal LoadBalancer implementation for local development
* **External IP Assignment**: How services become accessible from outside the cluster
* **IP Range Management**: Configuring safe IP ranges for LoadBalancer allocation

## Step 3.1: Analyze Current Infrastructure

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

## Step 3.2: Configure MetalLB LoadBalancer

The extension provides automated MetalLB setup to provide LoadBalancer services in Docker Desktop.

1. **Access LoadBalancer Management**:
   * In the **Infrastructure** tab, **Gateways** sub-tab
   * Locate the **LoadBalancer Configuration** section
   * This section provides comprehensive LoadBalancer management

2. **Auto-Configure MetalLB**:
   * Click **"Auto-Configure MetalLB"**
   * The extension will automatically:
     * Install MetalLB if not present
     * Detect Docker Desktop's IP range
     * Configure a safe IP pool for LoadBalancer allocation
     * Set up the required MetalLB configuration

3. **Monitor Installation Progress**:
   * Watch the status change from "NOT CONFIGURED" to "CONFIGURING..."
   * Installation typically takes 30-60 seconds
   * Status will update to show MetalLB version and IP pool when complete

4. **Verify Configuration**:
   * Status should show **"CONFIGURED"** with MetalLB version
   * IP Pool information should display the allocated range
   * Example: "Pool: 192.168.65.100-192.168.65.150"

## Step 3.3: Validate Gateway External IP Assignment

Once MetalLB is configured, your gateways should automatically receive external IPs.

1. **Check Gateway Status Update**:
   * Return to the **Infrastructure** tab, **Gateways** sub-tab
   * Refresh the view (gateway status updates automatically)
   * Your gateway should now show an **External IP** from the MetalLB pool

2. **Verify External IP Assignment**:
   * External IP should be in the MetalLB range (e.g., 192.168.65.100)
   * Status should change from "Pending" to "Programmed" or "Ready"
   * Addresses section should populate with the assigned IP

3. **Understanding IP Assignment**:
   * Each LoadBalancer service gets a unique IP from the pool
   * IPs are automatically assigned and managed by MetalLB
   * Services retain their IPs until deleted

## Step 3.4: Test External IP Connectivity

Now test that your gateway is accessible via its external IP.

1. **Navigate to HTTP Testing**:
   * Click the **Traffic & Testing** tab
   * Click the **HTTP Testing** sub-tab

2. **Test Gateway External IP**:
   * **Method 1 - Port Forward Manager (Recommended)**:
     * Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab
     * In **Port Forward Manager** section, click **"Start Gateway Port Forward"**
     * URL automatically populates in HTTP Client below
     * Add `Host: echo.local` header and test
   
   * **Method 2 - Direct External IP** (if reachable):
     * **URL**: `http://<GATEWAY-EXTERNAL-IP>/` (use the IP from your gateway)
     * **Headers**: Add `Host: echo.local`
     * **Method**: `GET`
     * Click **"Send Request"**

3. **Troubleshooting External IP Access**:
   * **If successful**: You now have direct gateway access!
   * **If "Network error" or "no route to host"**: This is common in Docker Desktop
     * External IPs may not be reachable due to Docker Desktop networking
     * **Solution**: Use the Port Forward Manager instead - it always works!
     * The HTTP Client will provide guidance for alternatives

4. **Enhanced Error Handling (v0.12.1-v0.12.2)**:
   * Smart detection of Docker Desktop networking limitations
   * Automatic suggestions for Port Forward Manager when external IPs fail
   * Clear explanations of why external IPs might not be reachable
   * **Port Forward Manager**: One-click solution that bypasses networking issues

## Step 3.5: Network Architecture Understanding

Learn how LoadBalancers integrate with the overall networking stack.

### Traffic Flow with LoadBalancer

```
🌐 External Client
     ↓
💻 Docker Desktop (host network)
     ↓
🔌 MetalLB LoadBalancer (external IP)
     ↓  
🏢 Gateway Service (ClusterIP)
     ↓
🚦 Envoy Gateway (pods)
     ↓
🔧 Backend Services (echo-service)
```

### Key Networking Components

* **External IP**: Provided by MetalLB, accessible from host
* **Gateway Service**: LoadBalancer service that receives external IP
* **Envoy Proxy**: Processes requests and applies routing rules
* **Backend Services**: Your application services

### Production vs Development

| Environment | LoadBalancer Provider | External IPs | Access Method |
|-------------|----------------------|--------------|---------------|
| **Cloud (AWS/GCP/Azure)** | Cloud Provider | Real public IPs | Direct internet access |
| **Docker Desktop** | MetalLB | Private IPs | Limited to host network |
| **Local Development** | MetalLB/Kind | Private IPs | Port forwarding common |

## Key Concepts Learned

* **LoadBalancer Services**: How Kubernetes exposes services externally
* **MetalLB**: Bare-metal LoadBalancer for local development
* **External IP Assignment**: Automatic IP allocation from configured pools
* **Network Architecture**: Understanding traffic flow through the gateway stack
* **Docker Desktop Limitations**: Why external IPs may not be directly accessible

## Cleanup

Before moving to the next demo:

1. **Keep Infrastructure**: All gateways, routes, and LoadBalancer configuration will be used in Demo 4
2. **Verify Setup**: Ensure MetalLB is properly configured for TLS demos

---

**Next:** [Demo 4: Security with TLS](./05-demo-04-tls-security.md) - Add encryption and certificate management