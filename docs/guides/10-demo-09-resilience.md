# Demo 9: Resilience Policies and Reliability

**What you'll learn**: Configure timeout and retry policies for production-grade reliability

## Understanding Resilience Policies

In production environments, your applications need to handle failures gracefully. Resilience policies help your gateway and services remain stable when things go wrong by:

* **Timeout Policies**: Preventing requests from hanging indefinitely
* **Retry Policies**: Automatically retrying failed requests with intelligent backoff
* **Circuit Breaking**: Stopping requests to failing services (future feature)
* **Bulkhead Isolation**: Limiting resource usage per client/service (future feature)

## Step 9.1: Configure Timeout Policies

Timeouts ensure that requests don't hang indefinitely, protecting your system from resource exhaustion.

1. **Navigate to Resilience Policies**:
   * Go to the **Security & Policies** tab
   * Click the **Resilience Policies** sub-tab
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

## Step 9.2: Configure Retry Policies

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

## Step 9.3: Test Resilience Policies

Test your policies to ensure they work as expected.

1. **Test Timeout Behavior**:
   * Use **Port Forward Manager** to set up gateway access
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

## Step 9.4: Production Best Practices

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

## What You've Accomplished

In this demo, you've learned to:

* ✅ Configure comprehensive timeout policies for request protection
* ✅ Implement intelligent retry policies with exponential backoff
* ✅ Apply resilience policies to Gateways and HTTPRoutes
* ✅ Test policy behavior and monitor effectiveness
* ✅ Understand production best practices for reliability

Your gateway now has enterprise-grade resilience policies that will help maintain service availability even when individual components fail.

## Key Concepts Learned

* **Timeout Management**: Preventing resource exhaustion with appropriate timeouts
* **Retry Logic**: Intelligent retry patterns with exponential backoff
* **Failure Handling**: Graceful degradation when services fail
* **Production Reliability**: Best practices for enterprise-grade systems

## Cleanup

**Resources to Delete (REQUIRED):**
- ❌ **DELETE**: All timeout policies applied to gateways and routes
- ❌ **DELETE**: All retry policies with exponential backoff configurations
- ❌ **DELETE**: Resilience policy configurations from Demo 9

**Resources to Keep for Next Demo:**
- ✅ **Keep**: All foundational infrastructure (gateways, routes, services)
- ✅ **Keep**: TLS certificates and cert-manager for operational monitoring
- ✅ **Keep**: LoadBalancer configuration for external access monitoring

**Why This Cleanup is Critical:**
- Timeout and retry policies can mask operational issues during monitoring demos
- Resilience policies may affect normal response patterns needed for troubleshooting
- Clean baseline required for accurate operational health monitoring in Demo 10
- Retry policies can complicate error analysis and troubleshooting scenarios

**Cleanup Steps:**
1. **Remove Resilience Policies**:
   * Go to **Security & Policies** tab → **Resilience Policies** sub-tab
   * **Delete**: All timeout policies - click delete icon and confirm
   * **Delete**: All retry policies - click delete icon and confirm

2. **Reset Policy Dashboard**:
   * **Clear**: Policy statistics and monitoring data
   * **Reset**: Resilience policy dashboard to default state

3. **Verify Policy Removal**:
   * **Check**: No active resilience policies shown in dashboard
   * **Confirm**: Routes operate with default timeout/retry behavior

4. **Test Normal Operation**:
   ```bash
   # Verify normal request flow without resilience policies
   curl -H "Host: echo.local" http://<GATEWAY-EXTERNAL-IP>/
   # Should receive normal response without retry/timeout interference
   
   # Verify infrastructure ready for operational monitoring
   kubectl get gateways,httproutes,services -n demo
   ```

**Expected State After Cleanup:**
- Clean request/response patterns for operational monitoring
- No resilience policies affecting troubleshooting scenarios
- All infrastructure ready for production operations monitoring

---

**Next:** [Demo 10: Operations](./11-demo-10-operations.md) - Monitor and troubleshoot your gateway