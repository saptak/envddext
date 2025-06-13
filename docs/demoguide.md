# Envoy Gateway Docker Desktop Extension: Getting Started Guide

Welcome to the Envoy Gateway Docker Desktop Extension v0.12.0! This performance-optimized guide will help you understand and explore API Gateway concepts through hands-on demonstrations. With 40-50% faster load times and enterprise-grade performance, this extension provides a structured learning path from basic concepts to advanced traffic management.

## What You'll Learn

By the end of this guide, you'll understand:

* How API Gateways work and why they're essential for modern applications
* The difference between traditional proxies and modern gateway solutions
* How to configure secure, scalable, and reliable traffic management
* Advanced patterns like canary deployments, traffic splitting, rate limiting, and performance testing

## Before You Begin

### What is an API Gateway?

An API Gateway is like a "front door" for your applications. Instead of clients connecting directly to your backend services, they connect to the gateway, which then routes requests to the appropriate services. This provides several benefits:

* **Centralized Management**: All routing rules, security policies, and monitoring in one place
* **Service Protection**: Backend services are hidden from direct access
* **Traffic Control**: Advanced routing, load balancing, and traffic splitting capabilities
* **Security**: Authentication, authorization, rate limiting, and advanced policies at the gateway level

### What is Envoy Gateway?

Envoy Gateway builds on the powerful Envoy Proxy and integrates with Kubernetes' Gateway API to provide:

* **Modern Standards**: Uses the Kubernetes Gateway API instead of legacy Ingress
* **Advanced Features**: Traffic splitting, security policies, and observability
* **Ease of Use**: Simplifies complex Envoy Proxy configuration
* **Extensibility**: Custom policies and filters for advanced use cases

## Prerequisites

### System Requirements

* Docker Desktop with Kubernetes enabled
* Minimum 4GB RAM allocated to Docker Desktop
* Envoy Gateway Docker Desktop Extension v0.11.0+

### Setup Verification

1. **Enable Kubernetes in Docker Desktop**:
   * Open Docker Desktop → Settings → Kubernetes
   * Check "Enable Kubernetes" and click "Apply & Restart"

2. **Install the Extension**:
   * Open Docker Desktop Extensions tab
   * Search for "Envoy Gateway" and install

3. **Verify Installation**:
   * Open the Envoy Gateway extension
   * You should see a 9-tab interface with Resilience Policies, contextual help system, and interactive tutorials

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
   * Navigate to the **Templates** tab
   * This tab contains pre-configured examples for quick setup

2. **Deploy the Echo Service**:
   * Find the **"Echo Service - Basic HTTP"** template
   * Click **"Apply Template"**
   * This deploys a simple service that echoes back request information

3. **Verify Deployment**:
   * Watch the notification for deployment status
   * The echo service will be deployed to the `demo` namespace

**What happened?** You just deployed a simple web service that will help us test our gateway configuration. The echo service responds with details about incoming requests, making it perfect for learning.

### Step 1.2: Create Your First Gateway

A Gateway defines how external traffic enters your cluster.

1. **Navigate to Gateway Management**:
   * Click the **"Gateway Management"** tab
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
   * Click the **"HTTPRoute Management"** tab

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

1. **Navigate to Testing & Proxy**:
   * Click the **"Testing & Proxy"** tab
   * This tab includes enhanced proxy reliability features (v0.8.1)

2. **Start the Proxy** (Enhanced Reliability):
   * Click **"Start Proxy"** in the Proxy Manager section
   * **New in v0.8.1**: Automatic kubeconfig detection and enhanced error handling
   * Wait for status to show "Running"

3. **Get Gateway Information**:
   * Return to **Gateway Management** tab
   * Note the **External IP** of your gateway (if LoadBalancer is configured)
   * If no external IP, we'll use the proxy for testing

4. **Test with HTTP Client**:
   * Return to **Testing & Proxy** tab
   * **URL**: `http://echo.local/` (add Host header)
   * **Method**: `GET`
   * **Headers**: Add `Host: echo.local`
   * Click **"Send Request"**

5. **Examine the Response**:
   * You should see JSON containing request details
   * Notice headers added by the gateway (like `x-envoy-*`)

**What happened?** Your first request traveled through the gateway to your service! The echo service returned details about the request, showing that routing worked correctly.

### Key Concepts Learned

* **Gateway**: Entry point for external traffic
* **HTTPRoute**: Routing rules that match requests to services
* **Path Matching**: How URLs are matched to routes
* **Backend References**: How routes connect to services

### Next Steps

You've successfully created your first gateway! In the next demo, we'll explore more sophisticated routing patterns.

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
   * In the **Templates** tab, apply the **"Traffic Splitting"** template
   * This creates multiple versions of a service for demonstration

2. **Verify Deployments**:
   * Services `app-v1` and `app-v2` should now be running
   * Each responds with different content to show routing

### Step 2.2: Header-Based Routing

Create routes that respond to request headers.

1. **Create Version-Specific Route**:
   * **Route Name**: `api-v2-route`
   * **Parent Gateway**: `my-first-gateway`
   * **Hostname**: `api.local`

2. **Configure Advanced Matching**:
   * **Path**: `/api` (PathPrefix)
   * **Headers**: 
     * Name: `X-API-Version`
     * Value: `v2`
   * **Backend**: `app-v2` service

3. **Create Default Route**:
   * **Route Name**: `api-default-route`
   * **Hostname**: `api.local`
   * **Path**: `/api` (PathPrefix)
   * **Backend**: `app-v1` service

### Step 2.3: Method-Based Routing

Route different HTTP methods to different services.

1. **Create POST Route**:
   * **Route Name**: `api-post-route`
   * **Hostname**: `api.local`
   * **Path**: `/api/data`
   * **Method**: `POST`
   * **Backend**: `app-v2` (newer service handles writes)

2. **Create GET Route**:
   * **Route Name**: `api-get-route`
   * **Hostname**: `api.local`
   * **Path**: `/api/data`
   * **Method**: `GET`
   * **Backend**: `app-v1` (stable service handles reads)

### Step 2.4: Test Advanced Routing

1. **Test Header Routing**:
   * URL: `http://api.local/api`
   * Headers: `Host: api.local`, `X-API-Version: v2`
   * Expected: Response from v2 service

2. **Test Default Routing**:
   * URL: `http://api.local/api`
   * Headers: `Host: api.local`
   * Expected: Response from v1 service

3. **Test Method Routing**:
   * URL: `http://api.local/api/data`
   * Method: `POST`
   * Expected: Routed to v2 service

### Key Concepts Learned

* **Header Matching**: Route based on request headers
* **Method Matching**: Different HTTP methods to different services
* **Route Priority**: How multiple matching rules are evaluated
* **Service Versioning**: Using routing for API version management

---

## Demo 3: Infrastructure and LoadBalancer Setup

**What you'll learn**: LoadBalancer configuration, gateway IP assignment, and networking fundamentals

### Understanding LoadBalancers

In Docker Desktop, services need a LoadBalancer to receive external IP addresses. This demo shows how the extension handles this automatically.

### Step 3.1: Configure LoadBalancer

1. **Check Current Status**:
   * In **Gateway Management** tab, view LoadBalancer Configuration
   * Status should show current state (likely "NOT CONFIGURED")

2. **Auto-Configure MetalLB**:
   * Click **"Configure LoadBalancer"**
   * Enable **"Auto-detect IP range"**
   * Click **"Install & Configure"**
   * Wait for status to show "CONFIGURED"

### Step 3.2: Verify Gateway IP Assignment

1. **Check Gateway Status**:
   * Your gateway should now have an External IP
   * Status should show "Ready" with addresses populated

2. **Test External Access**:
   * Use the external IP directly in the HTTP client
   * URL: `http://<EXTERNAL-IP>/`
   * Headers: `Host: echo.local`

### Step 3.3: Enhanced Proxy Management (v0.8.1)

The proxy manager provides reliable kubectl access with comprehensive error handling.

1. **Proxy Features**:
   * **Automatic kubeconfig detection**: No hardcoded paths
   * **Pre-flight connectivity testing**: Validates cluster access
   * **Enhanced error reporting**: Specific, actionable error messages
   * **Robust process management**: Reliable PID tracking and cleanup

2. **Advanced Operations**:
   * **API Server Access**: Direct Kubernetes API exploration
   * **Resource Inspection**: Raw resource data with error feedback
   * **Development Workflow**: Improved extension development experience

### Key Concepts Learned

* **LoadBalancer Services**: How external IPs are assigned
* **MetalLB**: Local LoadBalancer implementation for development
* **Network Architecture**: How traffic flows from client to service
* **Proxy Management**: Reliable kubectl connectivity for testing

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
   * Navigate to the **TLS Management** tab
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
   * In **Testing & Proxy** tab, expand **TLS Options**
   * **URL**: `https://<SECURE-GATEWAY-IP>/`
   * **Headers**: `Host: secure.local`
   * **TLS Options**: Enable "Ignore Certificate Errors" for self-signed certificates

2. **Verify Secure Communication**:
   * Response should include TLS connection details
   * Headers show secure connection established

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
   * Navigate to the **Traffic Splitting** tab
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
   * In **Testing & Proxy** tab, find **Synthetic Traffic Generator**
   * Switch to **Configuration** tab

2. **Basic Configuration**:
   * **Target URL**: Use your gateway IP
   * **HTTP Method**: `GET`
   * **Requests Per Second**: Start with `50`
   * **Duration**: `60` seconds
   * **Concurrent Connections**: `10`

3. **Advanced Settings**:
   * **Custom Headers**: Add `Host: api.local`
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
   * Navigate to the **Security Policies** tab (new in v0.9.0)
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
   * In **Testing & Proxy** tab, test the protected route
   * Add Authorization header: `Basic ZGVtbzpzZWN1cmUxMjM=` (base64 of demo:secure123)
   * Verify access is restricted without proper credentials

### Step 7.3: Implement CORS Policy

1. **Configure CORS**:
   * In **Security Policies** tab, find **CORS Policy** section
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
   * Navigate to the **Rate Limiting** section in Security Policies tab
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
   * Navigate to **Testing & Proxy** tab
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
   * Check rate limit headers in HTTP client:
     * `X-RateLimit-Limit`: Total requests allowed
     * `X-RateLimit-Remaining`: Requests remaining
     * `X-RateLimit-Reset`: When limit resets
     * `Retry-After`: Suggested retry timing

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
   * Navigate to the **Security Policies** tab
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
   * Navigate to the **Testing & Proxy** tab
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
   * **JWT Authentication**: Enable
   * **Token**: Paste the generated JWT token
   * **Header Name**: `Authorization`
   * **Token Prefix**: `Bearer `
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

### Key Concepts Learned

* **JWT Authentication**: Modern token-based authentication implementation
* **Provider Configuration**: Setting up JWT issuers, JWKS endpoints, and audiences
* **Claim Mapping**: Converting JWT claims to HTTP headers for downstream services
* **Token Testing**: Comprehensive JWT validation and testing workflows
* **Multi-Provider Support**: Managing multiple JWT providers with different configurations
* **Security Best Practices**: Production-ready JWT authentication patterns

---

## Demo 9: Operational Monitoring and Troubleshooting

**What you'll learn**: System monitoring, troubleshooting, and operational best practices

### Understanding Operational Excellence

Production gateways require:

* **Real-time monitoring**: Know what's happening now
* **Comprehensive troubleshooting**: Quickly identify and fix issues
* **Proactive management**: Prevent problems before they occur

### Step 9.1: System Health Monitoring

1. **Consolidated Dashboard**:
   * Navigate to the **Dashboard** tab
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

### Step 9.2: Enhanced Troubleshooting (v0.8.1)

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

### Step 9.3: Best Practices

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

### Key Concepts Learned

* **Operational Visibility**: Understanding system health at a glance
* **Proactive Troubleshooting**: Identifying issues before they become problems
* **Performance Monitoring**: Tracking key metrics for optimization
* **Maintenance Practices**: Keeping your gateway healthy and secure

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
   * Go to the **Resilience Policies** tab
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

### Latest Enhancements (v0.11.0)

* **Comprehensive Documentation & Help System**: Smart contextual help throughout the interface with detailed explanations for all major features
* **Interactive Tutorial System**: Step-by-step guided tutorials for Gateway setup, JWT authentication, and traffic splitting with progress tracking
* **Advanced Resilience Policy Management**: Professional timeout and retry policy configuration with visual management interface
* **Professional Help Integration**: QuickHelp components for form fields, detailed help dialogs with examples and best practices
* **Unified Resilience Interface**: Comprehensive dashboard for managing timeout and retry policies with professional UI
* **Enhanced User Experience**: Material-UI consistency, responsive design, and comprehensive form validation throughout all new features

### Previous Enhancements (v0.10.0)

* **Comprehensive JWT Authentication**: Complete JWT authentication policy management with multi-step wizard for provider configuration
* **JWT Provider Configuration**: Advanced setup for JWT providers including issuer, JWKS URI, audiences, and claim-to-header mapping
* **JWT Testing Tools**: Sophisticated JWT token testing with validation, claim extraction, and token generator for testing purposes
* **Enhanced HTTP Client**: JWT authentication support integrated into HTTP testing tools with configurable token headers and validation
* **Token Validation**: Client-side JWT parsing with expiration checks, issuer/audience validation, and comprehensive error handling
* **Professional UI Integration**: Material-UI components with tabbed interface, professional theming, and intuitive JWT workflows

### Previous Enhancements (v0.9.1)

* **Advanced Rate Limiting & Traffic Control**: Comprehensive rate limiting with multi-dimensional policies (global, per-IP, per-header, per-user)
* **Sophisticated Burst Testing**: Advanced testing tools with configurable traffic patterns and real-time analytics
* **Enhanced HTTP Client**: Professional 429 response handling with rate limit header display and retry guidance
* **Rate Limit Service Integration**: Complete setup guides for Envoy Rate Limit Service deployment with Redis backend

### Previous Enhancements (v0.9.0)

* **Comprehensive Security Policy Management**: Basic Authentication, CORS, IP Filtering, and Mutual TLS (mTLS) support
* **Enhanced Template Gallery**: Professional gallery with search, filtering, categorization, and one-click deployment
* **Advanced YAML Editor**: Syntax highlighting, validation, templates, and real-time error reporting
* **Resource Creation Wizard**: Multi-step guided wizard for complex configurations with contextual help
* **Professional Security Interface**: Step-by-step wizards for enterprise-grade security policy management

### Previous Enhancements (v0.8.1)

* **Enhanced Kubectl Proxy Reliability**: Automatic kubeconfig detection and robust error handling
* **Comprehensive Error Reporting**: Specific, actionable error messages
* **Improved Troubleshooting**: Enhanced logging and diagnostic capabilities
* **Professional Operations**: Enterprise-grade reliability and error recovery

### Real-World Applications

The patterns you've learned apply to:

* **Microservices Architecture**: Managing communication between services
* **API Management**: Exposing and securing APIs
* **DevOps Workflows**: Implementing safe deployment practices
* **Performance Engineering**: Validating system performance under load

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