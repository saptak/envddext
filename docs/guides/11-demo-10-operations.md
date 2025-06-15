# Demo 10: Operational Monitoring and Troubleshooting

**What you'll learn**: System monitoring, troubleshooting, and operational best practices

## Understanding Operational Excellence

Production gateways require:

* **Real-time monitoring**: Know what's happening now
* **Comprehensive troubleshooting**: Quickly identify and fix issues
* **Proactive management**: Prevent problems before they occur

## Step 10.1: System Health Monitoring

1. **Consolidated Dashboard**:
   * Navigate to the **Quick Start** tab
   * Click the **Overview** sub-tab
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
   * **Port Forward Status**: Active port forwards for testing (v0.12.2)
   * **Proxy Status**: kubectl proxy reliability (v0.8.1)

## Step 10.2: Enhanced Troubleshooting (v0.8.1)

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

## Step 10.3: Best Practices

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

## Key Concepts Learned

* **Operational Visibility**: Understanding system health at a glance
* **Proactive Troubleshooting**: Identifying issues before they become problems
* **Performance Monitoring**: Tracking key metrics for optimization
* **Maintenance Practices**: Keeping your gateway healthy and secure
* **Environment Management**: Complete lifecycle management from deployment to cleanup

## Complete Environment Reset

**IMPORTANT**: Demo 10 focuses on operational monitoring and troubleshooting. After completing the operational demonstrations, you should perform a complete environment reset to return to a clean state.

**Complete Cleanup (All Demo Resources):**

1. **Remove All HTTPRoutes**:
   ```bash
   kubectl delete httproutes --all -n demo
   ```

2. **Remove All Gateways**:
   ```bash
   kubectl delete gateways --all -n demo
   ```

3. **Remove Demo Services**:
   ```bash
   kubectl delete services echo-service echo-service-v1 echo-service-v2 -n demo
   kubectl delete deployments echo-service echo-service-v1 echo-service-v2 -n demo
   ```

4. **Remove TLS Certificates**:
   ```bash
   kubectl delete certificates --all -n demo
   kubectl delete secrets --all -n demo
   ```

5. **Remove Demo Namespace** (Optional):
   ```bash
   kubectl delete namespace demo
   ```

6. **Reset Extension State**:
   * Go to **Traffic & Testing** tab → **HTTP Testing** sub-tab
   * **Stop**: kubectl proxy if running
   * **Clear**: All saved configurations and request history
   * **Reset**: Template gallery to undeployed state

**Infrastructure to Preserve** (if desired):
- ✅ **Keep**: cert-manager installation (cluster-wide utility)
- ✅ **Keep**: MetalLB LoadBalancer configuration (cluster infrastructure)
- ✅ **Keep**: Envoy Gateway installation (cluster infrastructure)

**Verification of Clean State**:
```bash
# Verify demo resources removed
kubectl get all -n demo
# Should show: No resources found

# Verify cluster infrastructure remains
kubectl get gatewayclasses
# Should show: envoy-gateway

# Verify LoadBalancer remains functional
kubectl get pods -n metallb-system
# Should show MetalLB pods running
```

**Return to Clean State:**
After this cleanup, you can:
- Start fresh with Demo 1 for new learning scenarios
- Use the clean environment for your own Envoy Gateway projects
- Apply the learned concepts to production deployments
- Experiment with different configurations without conflicts

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