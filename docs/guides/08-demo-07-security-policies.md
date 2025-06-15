# Demo 7: Security Policies and Access Control

**What you'll learn**: Enterprise security policies, authentication mechanisms, and access control implementation

## Understanding Security Policies

Modern applications require comprehensive security policies to protect against threats and ensure compliance. The extension provides six core security policy types:

* **JWT Authentication**: Token-based authentication with provider configuration and claim mapping
* **Basic Authentication**: Username/password protection with Secret management
* **CORS Policies**: Cross-origin resource sharing configuration for web applications  
* **IP Filtering**: Allow/deny lists for network-based access control
* **Mutual TLS (mTLS)**: Client certificate authentication for the highest security
* **Rate Limiting**: Advanced traffic control with multi-dimensional rate limiting policies

## Step 7.1: Explore the Security Policies Tab

1. **Access Security Management**:
   * Navigate to the **Security & Policies** tab
   * Click the **Security Policies** sub-tab (new in v0.9.0)
   * This provides comprehensive security policy management

2. **Review Security Policy Overview**:
   * The tab shows all six security policy types including JWT Authentication
   * Each has dedicated management interfaces with professional cards
   * Status indicators show current policy configurations

## Step 7.2: Configure Basic Authentication

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
   * Use **Port Forward Manager** to set up gateway access
   * In **Traffic & Testing** tab, **HTTP Testing** sub-tab, test the protected route
   * Use the Headers section (v0.12.1) to add authentication:
     * Add `Authorization: Basic ZGVtbzpzZWN1cmUxMjM=` (base64 of demo:secure123)
     * Toggle header on/off to test access control
   * Verify access is restricted without proper credentials

## Step 7.3: Implement CORS Policy

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

## Step 7.4: Set Up IP Filtering

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

## Step 7.5: Advanced Security with mTLS

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

## Step 7.6: Advanced Rate Limiting (v0.9.1)

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

## Step 7.7: Resource Creation Wizard

1. **Guided Resource Creation**:
   * Use the **Resource Creation Wizard** (new in v0.9.0)
   * Navigate through multi-step guided interface
   * Create complex configurations with contextual help

2. **YAML Editor for Power Users**:
   * Access the **YAML Editor** for advanced configurations
   * Syntax highlighting and real-time validation
   * Template insertion and comprehensive error reporting

## Key Concepts Learned

* **Multi-layered Security**: Combining different authentication and authorization mechanisms
* **Access Control**: Network-based and identity-based restrictions
* **Rate Limiting**: Advanced traffic control with multi-dimensional policies
* **Certificate Management**: Client certificate authentication for highest security
* **CORS Configuration**: Secure cross-origin resource sharing

## Cleanup

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
   # Should succeed without authentication headers
   
   # Verify infrastructure ready for JWT demos
   kubectl get gateways,httproutes,certificates -n demo
   ```

**Expected State After Cleanup:**
- Clean routes without conflicting authentication mechanisms
- Infrastructure ready for JWT authentication testing
- Preserved foundational components for advanced authentication demos

---

**Next:** [Demo 8: JWT Authentication](./09-demo-08-jwt-auth.md) - Implement comprehensive JWT authentication with provider configuration, token testing, and claim mapping