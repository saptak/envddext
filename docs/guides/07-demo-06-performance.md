# Demo 6: Performance Testing and Load Validation

**What you'll learn**: Synthetic traffic generation, performance monitoring, and load testing

## Understanding Performance Testing

Performance testing with gateways helps you:

* **Validate routing under load**: Ensure traffic splitting works correctly
* **Establish performance baselines**: Know normal response times
* **Test scalability**: Understand capacity limits
* **Detect issues early**: Find problems before they affect users

## Step 6.1: Configure Traffic Generator

1. **Access Traffic Generator**:
   * In **Traffic & Testing** tab, click **Performance Testing** sub-tab
   * Find **Synthetic Traffic Generator**
   * Switch to **Configuration** tab

2. **Basic Configuration**:
   * **Target URL**: Use Port Forward Manager to get gateway URL
   * **HTTP Method**: `GET`
   * **Requests Per Second**: Start with `50`
   * **Duration**: `60` seconds
   * **Concurrent Connections**: `10`

3. **Advanced Settings**:
   * **Custom Headers**: Use the enhanced Headers interface (v0.12.1)
     * Add `Host: api.local`
     * Toggle headers on/off during testing
     * Easily add multiple headers with "Add Header" button
   * **Request Body**: (for POST requests)
   * **Timeout**: `10` seconds

## Step 6.2: Monitor Real-time Metrics

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

## Step 6.3: Validate Traffic Splitting Under Load

1. **Configure Canary Test**:
   * Set up traffic splitting (80% v1, 20% v2)
   * Generate load at 200-500 RPS
   * Monitor distribution accuracy

2. **Performance Comparison**:
   * Compare response times between versions
   * Analyze error rates for each service
   * Validate that traffic splitting maintains performance

## Key Concepts Learned

* **Load Testing**: Validating performance under realistic conditions
* **Metrics Collection**: Understanding key performance indicators
* **Traffic Validation**: Ensuring routing works correctly under load
* **Performance Analysis**: Using data to make deployment decisions

## Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: All traffic generator configurations and test scenarios
- ❌ **DELETE**: Performance testing profiles and saved configurations
- ❌ **DELETE**: Any temporary routes created for load testing

**Resources to Keep for Next Demo:**
- ✅ **Keep**: All foundational infrastructure (gateways, routes, services)
- ✅ **Keep**: `demo-tls-cert` and cert-manager - needed for security policies
- ✅ **Keep**: MetalLB LoadBalancer configuration - required for external access

**Why This Cleanup is Critical:**
- Running traffic generators can interfere with security policy testing
- High load scenarios may mask security policy enforcement behavior
- Clean baseline needed for accurate security policy validation in Demo 7

**Cleanup Steps:**
1. **Stop All Traffic Generation**:
   * Go to **Traffic & Testing** tab → **Performance Testing** sub-tab
   * **Stop**: Any running traffic tests - click "Stop Traffic Test"
   * **Clear**: Saved test configurations and profiles

2. **Reset Traffic Generator**:
   * **Clear**: All target URLs and configuration parameters
   * **Reset**: Request rates and concurrency settings to defaults
   * **Remove**: Any custom headers or request bodies

3. **Clean Test Data**:
   * **Clear**: Performance metrics and historical data
   * **Reset**: Live visualization charts and dashboards

4. **Verification Commands**:
   ```bash
   # Verify no background traffic generation
   kubectl get pods -n demo
   # Should NOT show traffic generator or load testing pods
   
   # Test normal routing for security demos
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should receive normal response without load
   
   # Verify infrastructure ready for security policies
   kubectl get gateways,httproutes,services -n demo
   ```

**Expected State After Cleanup:**
- No background load generation affecting security testing
- Clean performance metrics baseline for security policy evaluation
- All infrastructure ready for security policy demonstrations

---

**Next:** [Demo 7: Security Policies](./08-demo-07-security-policies.md) - Configure enterprise security with JWT authentication, access control, and advanced rate limiting