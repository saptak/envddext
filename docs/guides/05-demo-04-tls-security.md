# Demo 4: Security with TLS and HTTPS

**What you'll learn**: TLS termination, certificate management, and secure communications

## Understanding HTTPS at the Gateway

TLS termination at the gateway means:

* **Centralized Certificate Management**: One place for all certificates
* **Simplified Backend Services**: Services don't need TLS configuration
* **Performance Benefits**: Dedicated TLS processing
* **Security Compliance**: Encrypted communication with clients

## Step 4.1: Certificate Infrastructure Setup

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

## Step 4.2: Create HTTPS Gateway

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

## Step 4.3: Create HTTPS Routes

1. **Secure Echo Route**:
   * **Route Name**: `secure-echo-route`
   * **Parent Gateway**: `secure-gateway`
   * **Hostname**: `secure.local`
   * **Path**: `/` (PathPrefix)
   * **Backend**: `echo-service`

## Step 4.4: Test HTTPS Connectivity

1. **Advanced HTTPS Testing**:
   * In **Traffic & Testing** tab, **HTTP Testing** sub-tab
   
   **Method 1 - Port Forward Manager (Recommended)**:
   * In **Port Forward Manager** section, manually configure:
     * **Service Name**: `secure-gateway` (or your secure gateway service)
     * **Namespace**: `demo`
     * **Service Port**: `443`
     * **Local Port**: `8443` (or auto-assigned)
   * Click **"Start"** - URL will auto-populate as `https://localhost:8443`
   * **Headers**: Add `Host: secure.local` using enhanced Headers interface
   * **TLS Options**: Enable "Ignore Certificate Errors" for self-signed certificates
   
   **Method 2 - Direct External IP** (if accessible):
   * **URL**: `https://<SECURE-GATEWAY-IP>/`
   * **Headers**: Use the Headers section (v0.12.1)
     * Add `Host: secure.local`
     * Manage multiple headers with the enhanced interface
   * **TLS Options**: Expand and enable "Ignore Certificate Errors" for self-signed certificates

2. **Verify Secure Communication**:
   * Response should include TLS connection details
   * Headers show secure connection established
   * Port Forward Manager makes HTTPS testing seamless in Docker Desktop

## Key Concepts Learned

* **TLS Termination**: Gateway handles encryption/decryption
* **Certificate Management**: Automated certificate lifecycle
* **Self-Signed Certificates**: For development and testing
* **Security Policies**: How to configure secure communications

## Cleanup

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

---

**Next:** [Demo 5: Advanced Deployments](./06-demo-05-traffic-splitting.md) - Implement canary deployments and traffic splitting