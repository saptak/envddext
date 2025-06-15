# Demo 5: Advanced Deployments with Traffic Splitting

**What you'll learn**: Canary deployments, traffic splitting, and advanced deployment patterns

## Understanding Traffic Splitting

Traffic splitting allows you to:

* **Gradually roll out new versions** (Canary deployments)
* **Instantly switch between versions** (Blue-Green deployments)
* **Compare versions with real traffic** (A/B testing)

## Step 5.1: Traffic Splitting Wizard

1. **Access Traffic Splitting**:
   * Navigate to the **Traffic & Testing** tab
   * Click the **Traffic Splitting** sub-tab
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

## Step 5.2: Deploy and Monitor

1. **Deploy Infrastructure**:
   * Click through the wizard to deploy services
   * Monitor real-time deployment status
   * Verify both service versions are running

2. **Test Traffic Distribution**:
   * Use **Port Forward Manager** for easy gateway access
   * Send multiple requests to see distribution
   * Monitor the percentage split in real-time

## Step 5.3: Dynamic Traffic Management

1. **Adjust Traffic Weights**:
   * Use the slider to change traffic distribution
   * Try: 70% v1, 30% v2
   * Apply changes and test immediately

2. **Scenario Management**:
   * Use pre-configured scenarios for common patterns
   * **Canary Stages**: Progressive rollout phases
   * **Emergency Rollback**: Instant return to stable version

## Key Concepts Learned

* **Traffic Splitting**: Distributing requests between service versions
* **Canary Deployments**: Gradual rollout with risk mitigation
* **Blue-Green Deployments**: Instant switching with rollback capability
* **A/B Testing**: Comparing versions with live traffic

## Cleanup

Before moving to the next demo:

1. **Keep Infrastructure**: All services and routes will be used in Demo 6 for performance testing
2. **Traffic Management**: Continue using traffic splitting for performance validation

---

**Next:** [Demo 6: Performance Testing](./07-demo-06-performance.md) - Validate your setup under load