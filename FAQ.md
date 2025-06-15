# Envoy Gateway Docker Desktop Extension v0.12.2 - FAQ

## Getting Started

### I'm new to API gateways. Is this for me?

Absolutely! This extension was designed specifically for developers who want API gateway capabilities without the complexity. You don't need any prior experience with Kubernetes, YAML, or networking concepts. The visual interface guides you through everything.

### What will I be able to do in the first 5 minutes?

- Install and configure Envoy Gateway
- Monitor your complete system status from the unified Dashboard with health indicators
- Create basic Gateway resources with visual forms
- Set up HTTP routing rules (HTTPRoutes) with path matching and validation
- Deploy a working example application from templates
- **NEW: One-click port forwarding** for instant gateway access without complex networking
- Set up traffic splitting between service versions with the guided wizard
- Configure TLS certificates with automatic cert-manager installation
- Test your routes and HTTPS endpoints with the built-in HTTP client
- Generate synthetic traffic with the advanced traffic generator and view real-time performance metrics with optimized rendering
- Validate traffic splitting configurations with load testing and visualization
- Configure comprehensive security policies including JWT Authentication, Basic Authentication, CORS, IP Filtering, Mutual TLS, and advanced Rate Limiting
- Use the Resource Creation Wizard for guided step-by-step configuration of complex resources
- Edit YAML configurations with the professional YAML editor including syntax highlighting and validation
- Browse and deploy templates from the enhanced Template Gallery with search and filtering
- See real-time status of your Gateways and routes with enhanced visual cards in the consolidated Dashboard
- Test rate limiting policies with advanced burst testing and real-time analytics
- Configure JWT authentication with policy management, token testing, and claim mapping
- Use the comprehensive JWT testing tools with token validation and generation
- Test HTTP requests with JWT authentication support in the enhanced HTTP client
- Access contextual help throughout the interface with smart tooltips and detailed explanations
- Follow interactive step-by-step tutorials for Gateway setup, JWT authentication, and traffic splitting
- Configure advanced resilience policies with timeout and retry management for production reliability
- Access everything from a streamlined four-tab interface with progressive complexity design
- **NEW: Port Forward Manager** - eliminate manual kubectl commands with one-click gateway access

### I'm already using Kubernetes tools. Why switch?

You don't have to switch! This extension works alongside your existing tools. It's perfect for:
- **Rapid prototyping**: Test basic HTTP routing without writing YAML
- **Team onboarding**: Get new developers productive with Gateway basics immediately  
- **Local development**: Consistent basic gateway environment for all team members
- **Learning**: Understand how Gateway and HTTPRoute configurations work before writing them manually

### Do I need to know Kubernetes?

Not at all. The extension handles all Kubernetes complexity behind the scenes. You work with simple forms and get immediate visual feedback. However, if you do know Kubernetes, you can still view and edit the generated YAML when needed.

## Installation and Setup

### Is installation complicated?

Not at all! It's literally three clicks:
1. Open Docker Desktop
2. Go to Extensions → Search "Envoy Gateway"
3. Click Install

The extension handles everything else automatically.

### What do I need before installing?

Just Docker Desktop with Kubernetes turned on. If you can run containers, you're ready to go. The extension includes everything else you need.

### Will this mess up my existing Docker setup?

No. The extension creates its own resources and doesn't interfere with your existing containers or configurations. You can uninstall it cleanly anytime.

### I clicked install, now what?

Open the extension and click "Install Envoy Gateway" if prompted. Then click "Quick Start" to deploy your first working example. You'll have a running API gateway in under 2 minutes.

## Using the Extension

### What's the fastest way to see results?

Click "Quick Start" and choose "Basic HTTP" template. You'll have a working Gateway and HTTPRoute with a test service running in 30 seconds. Then use the built-in HTTP client to test it immediately.

### I don't want to use templates. Can I create custom gateways?

Of course! Go to "Infrastructure" tab, then "Gateways" sub-tab and click "Create New Gateway". Fill out the simple form for basic Gateway configuration - no YAML required. Then create HTTPRoutes to define your routing rules using the "HTTP Routes" sub-tab. The extension shows you exactly what it's creating, validates everything in real-time, clears validation errors when you fix them, and automatically closes forms after successful creation.

### How do I know if my gateway is working?

The extension shows you everything visually:
- Green checkmarks for healthy Gateways and HTTPRoutes
- Red warnings for problems (with solutions)
- Real-time status updates for all resources
- Built-in testing so you can verify routing functionality immediately

### What if I want to test my routes?

No need for external tools! The extension includes a full HTTP client:
- Test any endpoint with any HTTP method
- See beautifully formatted responses  
- Save requests to replay later
- Generate cURL commands to share with teammates

### Can I route traffic to my own applications?

Absolutely! Create HTTPRoutes that point to your existing Kubernetes services. The extension helps you configure:
- Path-based routing (exact paths, prefixes, regex)
- Header and query parameter matching
- Backend service selection and weighting
- Basic timeout configuration
All through visual forms - no YAML required.

### What routing features are currently supported?

The extension currently supports HTTP routing with:
- **Path matching**: Exact, PathPrefix, and RegularExpression
- **Header matching**: Exact values and presence checks
- **Query parameter matching**: Exact values
- **Backend services**: Multiple backends with traffic weighting
- **Timeouts**: Request and backend timeout configuration
- **Gateway integration**: Automatic parent Gateway validation

### What's not supported yet?

The extension now supports comprehensive Gateway and HTTPRoute management, TLS termination, traffic splitting, JWT authentication, comprehensive security policy management, and advanced rate limiting. Not yet supported:
- **Resource editing**: You can create and delete but not edit existing resources
- **Advanced protocols**: TCP, UDP, or gRPC routing (HTTP only)
- **Advanced Envoy features**: EnvoyProxy custom resources or patches

## Common Questions

### Something's not working. What do I check first?

Look at the status indicators in the extension - they'll tell you exactly what's wrong and how to fix it. Most issues are solved by:

1. Making sure Kubernetes is running in Docker Desktop
2. Clicking "Configure LoadBalancer" if prompted
3. Waiting a minute for services to start up
4. Using the "Refresh Resources" button

### My gateway has no IP address

This means you need to set up the LoadBalancer. The extension will show you a "Configure LoadBalancer" button when this happens. Click it and follow the prompts - it's completely automated.

### I can't reach my services from outside

**NEW: Try Port Forward Manager first!** Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab and use the **Port Forward Manager** section. Click "Start Gateway Port Forward" for one-click access with localhost URLs that work reliably in Docker Desktop.

If you need external access: First, check that your gateway has an IP address (green status). Then make sure you're using the right URL format: `http://[gateway-ip]/your-path`. The HTTP client in the extension shows you exactly what URLs to use.

### Nothing happens when I click buttons

This usually means Docker Desktop needs more memory. Try:
1. Increase Docker Desktop memory to 6GB or more
2. Restart Docker Desktop
3. Wait for Kubernetes to be fully ready (green indicator)

### The extension seems slow or unresponsive

Version 0.12.0 includes comprehensive performance optimizations that deliver 40-50% faster load times and improved responsiveness. The extension performs real Kubernetes operations with optimized API caching and memory management. Look for loading indicators and status messages. If you experience any performance issues:

1. Try refreshing the extension
2. Check the performance metrics in the new optimization framework
3. Restart Docker Desktop if needed

The latest performance improvements include optimized component rendering, API call deduplication, and intelligent caching strategies.

### The tabs don't fit on my screen

The extension includes responsive design with a streamlined 4-tab interface. The new progressive complexity design organizes functionality into logical groups (Quick Start, Infrastructure, Security & Policies, Traffic & Testing), making navigation intuitive on any screen size. The interface automatically adapts to your screen width and includes scrollable sub-tabs when needed.

### What's new about the Dashboard?

The Dashboard consolidates what used to be separate Resources and Deployment Status tabs into a single comprehensive view:

- **System Overview**: See counts and health status for all your Gateways, HTTP Routes, and Services at a glance
- **Health Monitoring**: Intelligent status detection with color-coded alerts (healthy/warning/critical) 
- **Collapsible Sections**: Expand or collapse Resource Relationships and Deployment Status sections as needed
- **Unified Management**: All resource actions (view YAML, delete, refresh) accessible from one place
- **Better Organization**: Related functionality grouped logically with professional Material-UI design

This reduces navigation and provides a more intuitive overview of your entire system state.

### What about the Security Policies features?

The extension now includes comprehensive security policy management (v0.10.0):

- **JWT Authentication**: Complete JWT token validation with policy management wizard, provider configuration (issuer, JWKS URI, audiences), claim-to-header mapping, and comprehensive testing tools
- **Basic Authentication**: Protect routes with username/password authentication, manage credentials via Kubernetes Secrets
- **CORS Policies**: Configure cross-origin resource sharing with origins, methods, headers, and credentials support
- **IP Filtering**: Set up allow/deny lists with CIDR range support for network-based access control
- **Mutual TLS (mTLS)**: Configure client certificate authentication with step-by-step wizard for PKI setup
- **Rate Limiting**: Configure multi-dimensional rate limiting (global, per-IP, per-header, per-user) with burst allowances and advanced testing

Each security policy type has its own professional interface with real-time validation, testing guidance, and comprehensive configuration options.

### What are the new Documentation & Help features?

Version 0.11.0 introduces comprehensive documentation and help capabilities:

- **Contextual Help System**: Smart help tooltips throughout the interface providing detailed explanations for Gateway, HTTPRoute, TLS, JWT, Rate Limiting, and LoadBalancer features
- **Interactive Tutorials**: Step-by-step guided tutorials for key use cases including "Your First Gateway", "JWT Authentication Setup", and "Canary Deployments with Traffic Splitting"
- **QuickHelp Components**: Inline help for form fields with descriptions, tips, and best practices guidance
- **Floating Tutorial Launcher**: Easy access to tutorials from any screen in the application
- **Professional Help Integration**: Context-aware assistance that doesn't disrupt existing workflows

### What are Resilience Policies?

New in v0.11.0, Resilience Policies provide enterprise-grade reliability features:

- **Timeout Configuration**: Configure request, idle, stream, and backend timeouts with flexible time units and professional validation
- **Retry Policy Management**: Sophisticated retry configuration with exponential backoff, jitter, HTTP status codes, and connection failure handling  
- **Visual Policy Management**: Professional dashboard with policy overview, status monitoring, and complete CRUD operations
- **Production-Ready Reliability**: Enterprise-grade policies for production deployments with comprehensive validation and best practices

### What about the enhanced user experience features?

Version 0.12.2 includes major UX improvements including the revolutionary **Port Forward Manager**:

- **Port Forward Manager**: One-click gateway port forwarding for seamless testing without manual kubectl commands
- **Smart Gateway Integration**: Automatic port discovery and URL generation for testing workflows
- **Resource Creation Wizard**: Multi-step guided interface for creating complex Gateways, HTTPRoutes, and Security Policies with contextual help
- **Advanced YAML Editor**: Professional editor with syntax highlighting, validation, templates, and real-time error reporting
- **Enhanced Template Gallery**: Comprehensive gallery with search, filtering, categorization, ratings, and one-click deployment
- **Professional Interface**: All features use Material-UI theming with responsive design and intuitive workflows

These features make complex configurations accessible to users of all experience levels while eliminating networking complexity.

### How does JWT authentication work?

The extension now includes comprehensive JWT authentication support (v0.10.0):

- **JWT Policy Management**: Create JWT authentication policies with a multi-step wizard that guides you through provider configuration
- **Provider Configuration**: Set up JWT providers with issuer URLs, JWKS endpoints, and audience validation
- **Claim Mapping**: Map JWT token claims to HTTP headers for downstream services (e.g., map `sub` claim to `x-user-id` header)
- **Token Testing**: Built-in JWT testing tools that validate tokens, extract claims, and test authentication workflows
- **Token Generator**: Generate sample JWT tokens for testing with configurable claims and expiration
- **HTTP Client Integration**: Test JWT-protected endpoints directly with the enhanced HTTP client that supports JWT authentication

The JWT testing tools show you exactly how tokens are parsed, what claims are extracted, and whether validation passes or fails with detailed error messages.

### How do I test JWT authentication?

The extension provides multiple ways to test JWT authentication:

1. **JWT Tester Component**: Dedicated testing interface with token validation, claim analysis, and mock request testing
2. **Token Generator**: Create sample JWT tokens with custom claims for testing purposes
3. **HTTP Client**: Test real endpoints with JWT authentication using the enhanced HTTP testing client
4. **Policy Testing**: Validate that your JWT policies are correctly configured and working as expected

All testing tools provide real-time feedback and detailed analysis of token structure, claims, and validation results.

## What Else Can I Do?

### Can I use this for real projects?

The extension is perfect for basic HTTP routing scenarios in development and learning environments. For production use:

- **Gateway and HTTPRoute configurations** you create are standard Kubernetes resources
- **Export generated YAML** for production deployment
- **Learn routing patterns** you can apply in any Kubernetes environment
- **Prototype basic configurations** before production deployment

The extension now supports comprehensive security policies including JWT Authentication, Basic Authentication, CORS, IP Filtering, mTLS, and advanced Rate Limiting, making it suitable for many production scenarios with proper security configurations.

### What if I need to modify existing resources?

Currently, the extension supports creating and deleting resources but not editing them. To modify existing Gateways or HTTPRoutes:

- Delete the existing resource and recreate it with new settings
- Edit the YAML directly using kubectl or other Kubernetes tools
- Use the extension to understand the configuration structure, then manage updates externally

Resource editing is planned for future releases.

### Can my team use this together?

Yes! Teams find this extension valuable for:

- **Consistent basic routing environments** across all team members
- **New team member onboarding** with Gateway API basics
- **Shared learning** about Gateway and HTTPRoute configurations
- **Local development standardization** for basic HTTP scenarios

However, for complex production scenarios requiring policies and advanced features, teams typically need additional tools.

### What about advanced gateway features?

The extension now provides comprehensive Gateway and HTTPRoute management, TLS termination with certificate management, traffic splitting capabilities, synthetic traffic generation with performance testing, and comprehensive security policy management including Basic Authentication, CORS, IP Filtering, and mTLS. For additional advanced features like:

- **JWT Authentication**: Token-based authentication policies
- **Rate limiting** and traffic policies
- **Protocol routing** beyond HTTP
- **EnvoyProxy custom resources**

You'll need to use kubectl, Helm charts, or other Kubernetes tools. These features are planned for future extension releases.

### When should I use other tools instead?

Consider using kubectl, Helm, or other tools when you need:

- **JWT Authentication**: Token-based authentication policies
- **Rate limiting**: Advanced traffic throttling and quotas
- **Resource editing**: Modifying existing configurations
- **Production deployments**: Complex multi-environment scenarios
- **Advanced protocols**: TCP, UDP, or gRPC routing
- **Complex TLS scenarios**: Certificate rotation and advanced CA management

The extension excels at HTTP routing scenarios, security policy management, and learning Gateway API concepts with comprehensive basic authentication, CORS, IP filtering, and mTLS support.

## Getting Help

### I'm stuck. Where do I get help?

The extension includes built-in guidance:

- Status indicators tell you exactly what's wrong
- Error messages include specific solutions
- Each screen has contextual help
- The GitHub repository has detailed documentation

### Can I request new features?

Definitely! The development team actively listens to user feedback. Top requested features include:

- **Resource editing capabilities** (update existing Gateways and HTTPRoutes)
- **JWT Authentication** (token-based authentication policies)
- **Rate limiting interface** (traffic throttling and quotas)
- **Multi-protocol support** (TCP, UDP, gRPC routing)
- **Enhanced workflow automation** and advanced template features

Note: Comprehensive security policy management (Basic Auth, CORS, IP Filtering, mTLS), advanced YAML editor, Resource Creation Wizard, and enhanced Template Gallery have been completed in v0.9.0!

### Is this actively maintained?

Yes! The extension receives regular updates with the latest v0.12.2 release featuring the revolutionary Port Forward Manager for seamless testing. Major releases include:

- **v0.12.2**: Port Forward Manager & Testing Experience - One-click gateway access, eliminating networking complexity
- **v0.12.0**: Performance Optimization & Polish - 40-50% faster load times, 20-30% smaller bundle size, enterprise-grade performance monitoring
- **v0.11.0**: Documentation & Help System, Resilience Policies with contextual help and interactive tutorials
- **v0.10.0**: JWT Authentication & Policy Management with comprehensive token testing
- **v0.9.1**: Rate Limiting & Advanced Traffic Control with burst testing and analytics
- **v0.9.0**: Security Policies & Enhanced User Experience with comprehensive policy management

The development team is responsive to issues and feature requests, and v0.12.0 represents the completion of the comprehensive implementation plan with enterprise-grade performance characteristics.

---

*Ready to transform your API gateway development experience? Install the extension today and see the difference visual gateway management makes.*