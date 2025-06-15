# Testing Methods for Envoy Gateway

## 🧪 Essential Knowledge for Gateway Testing

### Understanding Testing URLs vs Actual Endpoints

**Important**: When working with Envoy Gateway, understand the difference between routing configuration and actual testing:

- **Routing Configuration**: Use domains like `echo.local`, `api.local` in your Gateway and HTTPRoute configs
- **Actual Testing**: Use real IPs or proxy endpoints to make HTTP requests

### 🎯 Four Methods for Testing Your Gateway

#### Method 1: Port Forwarding via UI (New - Recommended for Gateway Routing)
```bash
# Use the built-in Port Forward Manager in the HTTP Testing tab
# 1. Go to Traffic & Testing tab → HTTP Testing sub-tab
# 2. Use Port Forward Manager section
# 3. Quick Actions: "Start Gateway Port Forward" button
# 4. Or manual setup: 
#    - Service Name: envoy-gateway-lb
#    - Namespace: envoy-gateway-system  
#    - Service Port: 80
#    - Local Port: 8080 (auto-assigned)
# 5. URL automatically populates in HTTP Client below
```

**✅ Best for**: Proper gateway routing tests including path-based, header-based, and method-based routing rules.

#### Method 2: kubectl proxy (Recommended for Service Testing)
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

**⚠️ Important Limitation**: kubectl proxy URLs bypass gateway routing entirely and go directly to services. This means:
- Routing rules (path-based, header-based, method-based) won't work as expected
- Use this method only for basic service connectivity testing
- For proper gateway routing tests, use port forwarding instead

#### Method 3: Gateway External IP (if reachable)
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

#### Method 4: Manual Port Forwarding (Command Line)
```bash
# 1. Set up port forwarding to the Gateway service
kubectl port-forward service/envoy-gateway-lb 8080:80 -n envoy-gateway-system

# 2. Use forwarded port for proper gateway routing
URL: http://localhost:8080/
Headers: Host: echo.local
```

**✅ This method properly tests gateway routing** including path-based, header-based, and method-based routing rules.

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

**Port Forward Manager (v0.12.2)**: New built-in port forwarding capabilities provide:
- **One-click Gateway Setup**: "Start Gateway Port Forward" button for instant testing
- **Auto Port Discovery**: Automatically finds available local ports
- **Seamless Integration**: URLs automatically populate in HTTP Client
- **Multi-Service Support**: Forward to any service, pod, or deployment
- **Real-time Status**: Live monitoring of active port forwards
- **Demo Templates**: Pre-configured settings for common demo services

### 🧭 Testing Strategy by Use Case

| Testing Scenario | Recommended Method | Notes |
|------------------|-------------------|--------|
| **Basic Service Connectivity** | kubectl proxy | Quick verification that services are running |
| **Gateway Routing Rules** | **Port Forward Manager (UI)** | **Easy one-click setup, proper gateway routing** |
| **Load Balancing** | Port Forward Manager (UI) | See traffic distribution across multiple pods |
| **TLS/HTTPS** | Port Forward Manager (UI) | Test certificate management and encryption |
| **Security Policies** | Port Forward Manager (UI) | Validate JWT, rate limiting, CORS policies |
| **Demo Workflows** | Port Forward Manager (UI) | **Seamless integration with HTTP testing** |
| **External Access** | Gateway External IP | Only if accessible from your environment |

### 🔧 Troubleshooting Common Issues

**"Network error: Failed to fetch"**
- Check if using `.local` domains directly (use proxy/port-forward instead)
- Verify kubectl proxy is running if using proxy URLs
- Confirm services are deployed and running

**"no route to host"**
- Common with Gateway External IPs in Docker Desktop
- Switch to kubectl proxy or port forwarding
- External IPs work in cloud environments but not Docker Desktop

**Routing rules not working**
- Confirm you're using port forwarding, not kubectl proxy
- Verify Host header matches your HTTPRoute configuration
- Check that Gateway and HTTPRoute are properly linked

---

**Next:** [Demo 1: Your First Gateway](./02-demo-01-first-gateway.md) - Deploy your first gateway and understand basic concepts