# Demo 8: JWT Authentication and Policy Management

**What you'll learn**: JWT authentication implementation, provider configuration, token testing, and claim-to-header mapping

## Understanding JWT Authentication

JSON Web Tokens (JWT) provide a modern, stateless authentication mechanism that's perfect for microservices and API architectures. The extension provides comprehensive JWT authentication capabilities:

* **Provider Configuration**: Set up JWT providers with issuer, JWKS URI, and audience validation
* **Claim-to-Header Mapping**: Map JWT token claims to HTTP headers for downstream services
* **Token Testing**: Built-in JWT token validation and testing tools
* **Multi-Provider Support**: Configure multiple JWT providers per policy
* **Real-time Validation**: Client-side JWT parsing with comprehensive error handling

## Step 8.1: Explore JWT Authentication Interface

1. **Access JWT Management**:
   * Navigate to the **Security & Policies** tab
   * Click the **Security Policies** sub-tab
   * Find the **JWT Authentication** section (new in v0.10.0)
   * This provides complete JWT policy management capabilities

2. **Review JWT Authentication Overview**:
   * Professional cards showing JWT policies and providers
   * Status indicators for JWT policy configurations
   * Integration with existing security policy management

## Step 8.2: Configure JWT Provider

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

## Step 8.3: Test JWT Authentication

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
   * Use **Port Forward Manager** to set up gateway access for proper JWT routing
   * In the **HTTP Testing Client**, configure JWT authentication:
   * **URL**: Use URL from Port Forward Manager
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

## Step 8.4: Advanced JWT Testing Workflows

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

## Step 8.5: Production JWT Configuration

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

## Step 8.6: Multi-Provider JWT Setup

1. **Configure Multiple Providers**:
   * Add additional JWT providers for different user types
   * **Provider 2**: Internal service authentication
   * **Provider 3**: Partner API authentication
   * Each provider can have different claim mappings

2. **Provider Priority and Fallback**:
   * Configure provider evaluation order
   * Test fallback scenarios when primary provider fails
   * Validate provider-specific claim mapping

## Key Concepts Learned

* **Modern Authentication**: Stateless token-based authentication for microservices
* **Provider Configuration**: Setting up JWT issuers and validation
* **Claim Mapping**: Converting JWT claims to HTTP headers for downstream services
* **Token Testing**: Comprehensive JWT validation and testing tools
* **Multi-Provider Support**: Handling different authentication sources

## Cleanup

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

**Cleanup Steps:**
1. **Remove JWT Policies**:
   * Go to **Security & Policies** tab → **Security Policies** sub-tab
   * **Delete**: `api-jwt-auth` policy - click delete icon and confirm
   * **Remove**: All JWT provider configurations

2. **Clear JWT Testing Data**:
   * Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab
   * **Clear**: JWT testing tokens from JWT Testing Tools section
   * **Reset**: JWT authentication configuration in HTTP client

3. **Verification Commands**:
   ```bash
   # Verify JWT policies are removed
   kubectl get securitypolicies -A
   # Should NOT show: api-jwt-auth
   
   # Test route accessibility without JWT
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should succeed without JWT authentication
   
   # Verify infrastructure ready for resilience demos
   kubectl get gateways,httproutes,services -n demo
   ```

**Expected State After Cleanup:**
- Routes accessible without JWT authentication requirements
- Clean authentication setup for resilience policy testing
- All infrastructure ready for timeout and retry policy demonstrations

---

**Next:** [Demo 9: Resilience Policies](./10-demo-09-resilience.md) - Configure timeout and retry policies for production-grade reliability