# Overview & Prerequisites

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

## Learning Path

This guide is organized as a progressive learning journey:

1. **[Getting Started](./02-demo-01-first-gateway.md)** - Deploy your first gateway and understand basic concepts
2. **[HTTP Routing](./03-demo-02-advanced-routing.md)** - Learn advanced routing patterns and request matching
3. **[Infrastructure Setup](./04-demo-03-infrastructure.md)** - Configure the underlying infrastructure
4. **[Security with HTTPS](./05-demo-04-tls-security.md)** - Add encryption and certificate management
5. **[Advanced Deployments](./06-demo-05-traffic-splitting.md)** - Implement canary deployments and traffic splitting
6. **[Performance Testing](./07-demo-06-performance.md)** - Validate your setup under load
7. **[Security Policies](./08-demo-07-security-policies.md)** - Configure enterprise security with JWT authentication, access control, and advanced rate limiting
8. **[JWT Authentication](./09-demo-08-jwt-auth.md)** - Implement comprehensive JWT authentication with provider configuration, token testing, and claim mapping
9. **[Resilience Policies](./10-demo-09-resilience.md)** - Configure timeout and retry policies for production-grade reliability
10. **[Production Operations](./11-demo-10-operations.md)** - Monitor and troubleshoot your gateway

Each demo builds on the previous one, introducing new concepts while reinforcing what you've learned.

---

**Next:** [Testing Methods](./01-testing-methods.md) - Learn the essential testing approaches for your gateway