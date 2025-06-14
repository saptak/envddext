# Troubleshooting Guide - Envoy Gateway Extension

This guide helps troubleshoot common issues with the Envoy Gateway extension (v0.12.1). **Note**: Previous Docker Desktop extension limitations have been resolved with the VM service backend architecture!

## Common Error Messages and Solutions

### Gateway/HTTPRoute Creation

**Current Status:**
- ✅ Gateway creation and HTTPRoute creation forms in the UI are functional.
- ✅ The backend Go service handles resource creation. It has been made more robust against kubeconfig issues (e.g., `KUBECONFIG` env var not set, hardcoded paths removed).
- ✅ Frontend error handling for backend API calls (`callBackendAPI` in `ui/src/helper/kubernetes.ts`) has been improved to display more specific error messages from the backend instead of generic errors like "socket hang up".

**Common Issues & Solutions:**

-   **Error: "socket hang up" or generic "Failed to create Gateway" during creation.**
    *   **Previous Cause**: Often due to the backend Go service crashing, possibly because of kubeconfig initialization problems (e.g., `KUBECONFIG` environment variable not set for the backend service in the VM, or previously, a hardcoded path being invalid). The frontend might also have obscured the detailed error.
    *   **Resolution**:
        *   The backend (`backend/main.go`) now relies solely on the `KUBECONFIG` environment variable being correctly set for its runtime environment. It will return a specific error if `KUBECONFIG` is not found.
        *   The backend's YAML application logic now fails faster and more cleanly if kubeconfig setup fails.
        *   The frontend's `callBackendAPI` function in `ui/src/helper/kubernetes.ts` has improved error parsing to show more detailed messages from the backend.
    *   **Troubleshooting**:
        1.  Ensure the `KUBECONFIG` environment variable is correctly configured and accessible by the Docker Desktop extension's backend VM service. This might involve checking `docker-compose.yaml` or `metadata.json` for how environment variables are passed to the service.
        2.  Check extension logs for more specific error messages from the backend.

-   **UI shows "Failed to create Gateway" but Gateway is actually created successfully (visible after UI refresh).**
    *   **Previous Cause**: This occurred when the backend *did* successfully create/configure the Gateway and sent a success response (e.g., `{"success":true, "data":"..."}`), but the frontend misinterpreted the structure of this response. Specifically, the `ddClient.extension.vm.service.post()` call (used by the frontend's `callBackendAPI` helper) was found to wrap the backend's actual JSON `APIResponse` inside a top-level `data` property (e.g., `ddClient` returns `{ data: { success: true, data: "..." }, headers: { ... } }`). Frontend helper functions like `createGateway` were expecting the `success` flag directly on the object returned by `callBackendAPI` instead of nested within its `.data` property.
    *   **Resolution**:
        *   The `callBackendAPI` function in `ui/src/helper/kubernetes.ts` was modified to return the raw response object it receives from `ddClient.extension.vm.service.post()` for successful HTTP operations. For errors it catches itself (e.g., if `ddClient` throws an exception), it still forms and returns a standard `APIResponse`-like object (e.g., `{ success: false, error: "details" }`).
        *   Helper functions that use `callBackendAPI` (such as `createGateway`, `listHostContexts`, `createHTTPRoute` in `ui/src/helper/kubernetes.ts`) were updated. They now inspect the structure of the response received from `callBackendAPI` to correctly locate the actual backend `APIResponse` payload – checking if it's the direct object or nested under a `.data` property. This allows them to accurately determine the operational success state.
        *   Additionally, the backend's `s.applyYAML` function (in `backend/main.go`) was refined to correctly interpret `kubectl apply` output indicating "unchanged" or "configured" as success (even if `kubectl` returned a non-zero exit code), ensuring the backend consistently signals success for these idempotent operations.
    *   **Outcome**: The UI now correctly reflects the success of Gateway creation operations. Misleading error messages for successful or idempotent creations have been eliminated.
    *   **Troubleshooting (if similar issues recur)**:
        1.  Check backend logs (`docker logs envoy-gateway-backend`) for success messages from the relevant handler (e.g., `handleCreateGateway: Successfully applied YAML...`).
        2.  Examine the detailed error message in the UI (which includes debug traces showing the structure of the response received by the frontend helpers). This was key to diagnosing this issue.

-   **Gateway created but in "FAILED" state with "AddressNotAssigned"**:
    *   This indicates an issue with the LoadBalancer configuration not providing an external IP. See the "LoadBalancer Configuration Issues" section.

**If Other Issues Occur:**
- **Check Host `kubectl` Setup**: While the backend handles creation, ensure `kubectl` on your host machine is configured correctly for general cluster checks.
- **Kubernetes Cluster Health**: Verify your Kubernetes cluster in Docker Desktop is running and healthy.
- **Extension Logs**: Check Docker Desktop extension logs for detailed output.
- **Resource YAML**: If possible, inspect the YAML being applied (e.g., from console logs if the UI outputs it) and try applying it manually on your host using `kubectl apply -f -` to see detailed errors.
### Kubectl Proxy Management - **Enhanced in v0.8.1!**

#### ✅ Complete Proxy Lifecycle Management with Enhanced Error Handling

**Current Status (v0.8.1):**
- ✅ Start proxy works reliably with enhanced error handling and automatic kubeconfig detection
- ✅ Comprehensive error reporting replaces generic "Unknown error" messages
- ✅ Automatic kubeconfig path detection eliminates hardcoded user dependencies
- ✅ Pre-flight connectivity testing ensures cluster accessibility before startup
- ✅ Stop proxy works perfectly with PID tracking
- ✅ Real-time status monitoring
- ✅ Automatic cleanup on extension restart

**How It Works Now:**
1. **Start**: Backend starts kubectl proxy and stores PID in `/tmp/kubectl-proxy-{port}.pid`
2. **Monitor**: Backend checks proxy status via HTTP connectivity tests
3. **Stop**: Backend uses stored PID for reliable process termination
4. **Cleanup**: Automatic PID file cleanup and process management

#### Troubleshooting Proxy Issues (v0.8.1 Enhanced)

**Common Issues & Solutions:**

**1. "Unknown error starting proxy" (RESOLVED in v0.8.1)**
- **Previous Issue**: Generic error messages with no actionable feedback
- **Resolution**: Enhanced error handling now provides specific error messages:
  - Kubeconfig detection issues
  - Kubernetes cluster connectivity problems
  - Docker VM service communication failures
  - Process management errors

**2. Hardcoded Path Dependencies (RESOLVED in v0.8.1)**
- **Previous Issue**: Extension failed for users without `/host_users/saptak/` directory
- **Resolution**: Dynamic kubeconfig path detection using environment variables

**3. Docker VM Service Communication (RESOLVED in v0.8.1)**
- **Previous Issue**: Frontend misinterpreted backend success responses
- **Resolution**: Proper response structure handling for Docker Desktop service wrapper

**Current Troubleshooting Steps:**

**If Proxy Won't Start:**
1. Check detailed error message in UI (now provides specific feedback)
2. Verify Kubernetes cluster connectivity: `kubectl cluster-info`
3. Check if port 8001 is already in use: `lsof -i :8001`
4. Verify Docker Desktop VM service is running
5. Check browser console for detailed error logs

**If Proxy Won't Stop:**
1. Backend handles this automatically with PID tracking
2. If needed, manual cleanup: `pkill -f "kubectl proxy"`
3. Check Docker Desktop extension logs for backend errors

**Enhanced Debugging (v0.8.1):**
```bash
# Check if proxy is responding
curl -s http://localhost:8001/api/v1 --connect-timeout 2

# Check for proxy processes
ps aux | grep "kubectl proxy"

# Verify kubeconfig accessibility
kubectl cluster-info

# Check Docker Desktop extension logs
docker logs $(docker ps --filter "ancestor=envoyproxy/envoy-gateway-extension" --format "{{.ID}}")
```

**Error Message Interpretation:**
- **"Kubeconfig setup failed"**: KUBECONFIG environment variable issues
- **"Cannot connect to Kubernetes cluster"**: Cluster connectivity problems  
- **"Kubectl proxy started but is not responding"**: Process started but not accessible
- **Specific kubectl errors**: Direct output from kubectl with actionable feedback

### GitHub Templates - **Applied via Host CLI**

#### ✅ Improved Template Application

**Current Status:**
- ✅ Templates are fetched from GitHub.
- ✅ Template application (e.g., `kubectl apply -f <URL>`) is now done using the **host's `kubectl`** via `ddClient.extension.host.cli.exec()`. This improves reliability by using the host's Kubernetes context and avoiding VM-to-host K8s API connectivity issues.
- ✅ Error messages from `kubectl apply` executed on the host are surfaced in the UI.

**If Template Application Fails:**
1. **Check Host `kubectl` Setup**: Ensure `kubectl` on your host machine is configured correctly and can connect to your Docker Desktop Kubernetes cluster (e.g., `kubectl get nodes`).
2. **Template URL Accessibility**: Verify the template URL is correct and accessible.
   ```bash
   curl -I <template_yaml_url>
   ```
3. **Manual `kubectl apply` on Host**: Try applying the template URL directly from your host's terminal:
   ```bash
   kubectl apply -f <template_yaml_url>
   ```
   This will give you direct feedback from `kubectl`. Common errors include issues within the template YAML itself or unmet dependencies in your cluster.
4. **Extension Logs**: Check Docker Desktop extension logs. These logs will show the command executed via `host.cli.exec()` and its output (stdout/stderr), which can help diagnose `kubectl` errors.
5. **Kubernetes Cluster State**: Ensure your Kubernetes cluster is healthy and can pull any images specified in the template.

### LoadBalancer Configuration Issues (e.g., MetalLB)

**Symptoms:**
- UI shows "LoadBalancer Not Configured" or an inaccurate "Configured" status (e.g., "Provider: UNKNOWN" but still marked "Configured").
- Gateways are "FAILED" with "AddressNotAssigned" because they don't receive an external IP.
- Errors during MetalLB configuration via the UI dialog, such as:
    - JavaScript TypeErrors (e.g., "e.includes is not a function").
    - Ambiguous messages like "Output: [[object Object]], Error: []".
    - The "Configure LoadBalancer" button might be missing even when the status is "NOT CONFIGURED" and an error is present.
- Errors like "Failed to install MetalLB" or issues applying `IPAddressPool`/`L2Advertisement`.

**Architectural Context:**
- **Initial MetalLB Manifest & Wait**: The `metallb-native.yaml` manifest and `kubectl wait` commands are applied using the **host's `kubectl`** (via `ddClient.extension.host.cli.exec()`). The `--validate=false` flag is used for the initial manifest to bypass potential K8s API connection issues from within a VM for schema validation (though this specific apply is now a host operation).
- **Dynamic YAML (IPAddressPool, L2Advertisement)**: These are applied using the **backend's `/apply-yaml` endpoint**. The success of these depends on the backend service's `kubectl` being able to communicate with the Kubernetes API.
- **Status Detection**: All LoadBalancer status checks (namespaces, deployments, pods, CRDs, services) are performed using the **host's `kubectl`**. MetalLB is considered "Configured" if its controller is ready and `IPAddressPools` exist.

**Troubleshooting Steps:**
1.  **Verify Kubernetes Node Status**:
    *   Command: `kubectl get nodes`
    *   Look for: Node should be in `Ready` state. If `NotReady` or `Unknown` (e.g., due to "Kubelet stopped posting node status"), address node health first. This often involves restarting Kubernetes within Docker Desktop or restarting Docker Desktop itself. This is a common root cause for many subsequent issues.
2.  **Check `metallb-system` Namespace and Pods (after configuration attempt)**:
    *   Command: `kubectl get all -n metallb-system`
    *   Look for:
        *   `deployment.apps/controller` should have ready pods (e.g., `1/1 AVAILABLE`).
        *   `daemonset.apps/speaker` should have pods running on your Linux nodes (usually 1 for Docker Desktop).
    *   If pods are `Pending` or in an error state, use `kubectl describe pod <pod-name> -n metallb-system` to investigate (e.g., node taints, resource limits, image pull errors).
3.  **Inspect IPAddressPools and L2Advertisements (after configuration attempt)**:
    *   Commands:
        *   `kubectl get ipaddresspools.metallb.io -n metallb-system -o yaml`
        *   `kubectl get l2advertisements.metallb.io -n metallb-system -o yaml`
    *   Look for: Ensure these custom resources are created and configured with the expected IP range. The UI logic requires `IPAddressPools` to exist for MetalLB to be considered fully configured.
4.  **UI Status and Configuration Dialog Behavior**:
    *   **Accurate Status**: The "LoadBalancer Configuration" status in the UI (`ui/src/components/LoadBalancerManager.tsx` driven by `ui/src/services/loadBalancerService.ts`) is now stricter. It will only show "CONFIGURED" if MetalLB is confirmed operational (namespace exists, controller ready, and `IPAddressPools` are present). If `metallb-system` namespace is not found, it will correctly show "NOT CONFIGURED".
    *   **"Configure LoadBalancer" Button Visibility**: The button to configure MetalLB in `LoadBalancerManager.tsx` is now displayed correctly when the status is "NOT CONFIGURED", even if an error message (like "MetalLB namespace 'metallb-system' not found...") is also present.
    *   **Improved Configuration Dialog Feedback**:
        *   JavaScript TypeErrors (like "e.includes is not a function") during MetalLB configuration in `configureMetalLB` (`loadBalancerService.ts`) due to unsafe string operations on non-string variables from backend responses have been mitigated by coercing variables to strings (e.g., `String(poolResponse?.data || "")`).
        *   Misleading errors like "Output: [[object Object]], Error: []" (when the backend's `/apply-yaml` reported `success: false` but sent complex objects in `data`) are now handled better. The frontend in `configureMetalLB` now attempts to parse nested error messages from `response.data.error` and provides clearer feedback in the dialog if ambiguous errors occur, suggesting the operation might have succeeded.
5.  **Error Messages During Configuration**:\n    *   Pay close attention to any error messages displayed in the UI during the \"Configure LoadBalancer\" process. With recent fixes, these messages should be more informative.\n    *   If errors mention \"connection refused\" when applying `IPAddressPool` or `L2Advertisement` (less likely now for this specific error but possible for others), it points to the backend service\'s `kubectl` (used via `/apply-yaml`) having trouble reaching the K8s API. Ensure your K8s API server address in `~/.kube/config` is accessible from *within* Docker containers/VMs (e.g., needs to be `host.docker.internal` or `kubernetes.docker.internal`).
6.  **Extension Logs**:\n    *   Check Docker Desktop extension logs for detailed output from both host CLI commands and backend service operations. This is crucial for diagnosing `kubectl` command failures.
7.  **UI Status Refresh**:\n    *   After attempting configuration or manual `kubectl` checks, click the \"Refresh\" button for the LoadBalancer status in the UI to trigger a fresh status assessment.
4.  **Error Messages During Configuration**:
    *   Pay close attention to any error messages displayed in the UI during the "Configure LoadBalancer" process.
    *   If errors mention "connection refused" when applying `IPAddressPool` or `L2Advertisement`, it points to the backend service's `kubectl` (used via `/apply-yaml`) having trouble reaching the K8s API. This is less common now but check if your K8s API server address in `~/.kube/config` is accessible from *within* Docker containers/VMs (e.g., needs to be `host.docker.internal` or `kubernetes.docker.internal` if the backend isn't using the host's `kubectl` environment directly for these specific operations).
5.  **Extension Logs**:
    *   Check Docker Desktop extension logs for detailed output from both host CLI commands and backend service operations. This is crucial for diagnosing `kubectl` command failures.
6.  **UI Status Refresh**:
    *   After attempting configuration or manual `kubectl` checks, click the "Refresh" button for the LoadBalancer status in the UI to trigger a fresh status assessment.

### Traffic Splitting & Canary Deployments - **v0.7.0 Features**

#### ✅ Comprehensive Traffic Management

**Current Status:**
- ✅ Traffic Splitting Wizard with step-by-step setup
- ✅ Deployment pattern support (Canary, Blue-Green, A/B Testing)
- ✅ Real-time traffic distribution control
- ✅ Multi-version application deployment with status monitoring

**Common Issues & Solutions:**

**Traffic Splitting Wizard Issues:**

- **Wizard stuck on deployment step or shows deployment failure**:
  * **Cause**: Infrastructure deployment via GitHub template may fail due to cluster issues or namespace conflicts
  * **Solution**:
    1. Check that the demo namespace is clean: `kubectl get all -n demo`
    2. Delete conflicting resources if needed: `kubectl delete namespace demo`
    3. Verify LoadBalancer is configured (see LoadBalancer section)
    4. Retry deployment from Step 3 in wizard
    5. Check extension logs for detailed error messages

- **Services show "Not Ready" status after deployment**:
  * **Cause**: Pods may be pending or failing to start
  * **Solution**:
    1. Check pod status: `kubectl get pods -n demo`
    2. Describe failing pods: `kubectl describe pod <pod-name> -n demo`
    3. Check for image pull issues or resource constraints
    4. Verify Docker Desktop has sufficient resources (4GB+ RAM recommended)

- **Traffic distribution not updating**:
  * **Cause**: HTTPRoute update may fail or backend API issues
  * **Solution**:
    1. Check HTTPRoute status: `kubectl get httproute -n demo -o yaml`
    2. Verify backend service connectivity in extension logs
    3. Use Advanced Management tab to manually verify and update weights
    4. Check that total weights equal 100%

**Advanced Management Issues:**

- **Deployment status cards show incorrect information**:
  * **Cause**: Status polling may be delayed or cluster connectivity issues
  * **Solution**:
    1. Toggle auto-refresh off and on to force status update
    2. Click manual refresh button
    3. Check that Kubernetes cluster is responsive: `kubectl get nodes`
    4. Verify services exist: `kubectl get svc -n demo`

- **Traffic simulation not working**:
  * **Cause**: Gateway IP not assigned or services not ready
  * **Solution**:
    1. Verify Gateway has external IP: `kubectl get gateway -n demo`
    2. Check LoadBalancer configuration (see LoadBalancer section)
    3. Ensure all services are ready before starting simulation
    4. Try manual testing with HTTP Testing tab first

**Troubleshooting Commands for Traffic Splitting:**

```bash
# Check traffic splitting deployment status
kubectl get all -n demo

# Verify HTTPRoute traffic weights
kubectl get httproute -n demo -o yaml | grep -A 10 "backendRefs"

# Check service endpoints
kubectl get endpoints -n demo

# Test traffic distribution manually
curl -H "Host: demo.local" http://<GATEWAY_IP>/

# Check Gateway status and IP assignment
kubectl get gateway -n demo -o wide
```

### General Extension Issues

#### Backend Service Issues

**Symptoms:**
- Extension loads but operations fail
- "Backend service not responding" errors
- API calls timeout

**Root Cause:**
VM service backend not properly started or configured.

**Solution:**
1. **Check VM Service**: Verify Docker Desktop VM service is running
2. **Restart Extension**: Uninstall and reinstall to restart VM service
   ```bash
   docker extension uninstall envoyproxy/envoy-gateway-extension
   ./build-and-install-github-templates.sh
   ```
3. **Docker Desktop Restart**: Restart Docker Desktop if VM issues persist

#### Error: kubectl not found or accessible

**Symptoms:**
- Extension UI reports `kubectl` connectivity issues (e.g., "connection refused", "server not found") or commands fail.
- Kubernetes operations fail.

**Root Cause & Architecture Context:**
- Most Kubernetes interactions from the extension UI (reading resources, status checks, applying URL-based templates, initial MetalLB manifest) are now performed using the **host's `kubectl`** via `ddClient.extension.host.cli.exec()`.
- If these operations fail, it usually indicates an issue with:
    1.  Your host machine's `kubectl` configuration (`~/.kube/config`).
    2.  The health or accessibility of your Docker Desktop Kubernetes cluster itself.
    3.  The specific `kubectl` command being invalid.
- Operations that use the **backend VM service's `kubectl`** (e.g., applying dynamically generated YAML like MetalLB's `IPAddressPool` via `/apply-yaml`) can fail if the backend cannot reach the Kubernetes API server (typically needs to use `host.docker.internal` or `kubernetes.docker.internal` instead of `127.0.0.1` from within the VM).

**Solution:**
1. **Verify Host `kubectl` and Cluster**:
   *   On your host machine, ensure `kubectl version` runs and shows both client and server versions.
   *   Ensure `kubectl config current-context` is set to `docker-desktop` (or your active Docker K8s context).
   *   Run `kubectl get nodes`. The node should be `Ready`. If not, address the Kubernetes cluster health (see LoadBalancer troubleshooting).
2. **Check Extension Logs**: View `docker extension logs envoyproxy/envoy-gateway-extension` for detailed error output from `kubectl` commands (both host and backend initiated).
3. **Restart Docker Desktop & Kubernetes**: This can often resolve transient connectivity issues.
4. **Reinstall Extension**: As a last resort if other steps fail:

**Solution:**
1. Restart Docker Desktop
2. Verify kubectl works: `kubectl version`
3. Check Kubernetes context: `kubectl config current-context`
4. Reinstall extension: `./build-and-install-github-templates.sh`

#### Error: Extension UI not responding

**Symptoms:**
- Extension tab loads but shows errors
- Components don't render properly
- Frontend/backend communication fails

**Root Cause:**
Extension build, VM service, or socket communication issues.

**Solution:**
1. **Check Extension Status**: Look for extension in Docker Desktop
2. **Rebuild Extension**: Clean rebuild resolves most issues
   ```bash
   docker extension uninstall envoyproxy/envoy-gateway-extension
   ./build-and-install-github-templates.sh
   ```
3. **Check Logs**: View Docker Desktop extension logs for detailed errors
4. **Docker Desktop Restart**: Full restart if communication issues persist

## Diagnostic Commands

### Check Extension and VM Service Status
```bash
# List installed extensions
docker extension ls

# Check if extension is running
docker extension ls | grep envoy-gateway

# Check Docker Desktop VM service logs
docker extension logs envoyproxy/envoy-gateway-extension

# Check if backend service is responding
curl -s http://localhost:8001/health 2>/dev/null || echo "Backend not accessible"
```

### Check Backend API Health
```bash
# Test backend health endpoint (if proxy is running)
curl -s http://localhost:8001/health

# Test kubectl access (from host - this is what the UI primarily uses now)
kubectl version --client
kubectl version # Should show client and server

# Test cluster connectivity (from host)
kubectl get nodes
kubectl get namespaces

# Test Gateway API access (from host)
kubectl get gatewayclasses.gateway.networking.k8s.io
kubectl get gateways -A
```

### Check Proxy Status (Enhanced)
```bash
# Check if proxy is running
ps aux | grep "kubectl proxy"

# Test proxy connectivity
curl -s http://localhost:8001/api/v1 --connect-timeout 3

# Check PID file (new with backend)
cat /tmp/kubectl-proxy-8001.pid 2>/dev/null || echo "No PID file found"

# Check if PID is still active
if [ -f /tmp/kubectl-proxy-8001.pid ]; then
  ps -p $(cat /tmp/kubectl-proxy-8001.pid) || echo "Process not running"
fi
```

### Debug Resource Creation
```bash
# Test manual Gateway creation
kubectl apply -f - << 'EOF'
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: test-gateway
  namespace: default
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: Same
        kinds:
          - kind: HTTPRoute
EOF

# Verify Gateway was created
kubectl get gateways -n default
```

## ✅ Previous Limitations - Now Resolved!

### ✅ Resource Creation - **Fully Functional via Host CLI or Backend**

**Previous Issue**: ~~Cannot create Gateway/HTTPRoute resources directly through UI, or limitations due to sandbox~~
**Current Status**: ✅ **Fully functional**
  - Most resource applications (templates, initial MetalLB manifest) are done via **host CLI**.
  - Dynamically generated YAML from frontend logic (e.g., MetalLB IPAddressPools) can be applied via the **backend's `/apply-yaml` endpoint**.
  - Gateway/HTTPRoute creation forms in UI likely use host CLI for the final `kubectl apply`.

**How it works now**: Frontend services primarily use `ddClient.extension.host.cli.exec("kubectl", ["apply", ...])` for reliability. The backend service is used for applying dynamically generated YAML strings it receives, or for tasks requiring its unrestricted VM environment.

### ✅ Process Management - **Fully Functional**

**Previous Issue**: ~~Cannot stop kubectl proxy through UI~~
**Current Status**: ✅ **Complete process lifecycle management**

**How it works now**: Backend tracks PIDs and provides reliable start/stop functionality

### ✅ Shell Operations - **Fully Functional**

**Previous Issue**: ~~Cannot use advanced shell features~~
**Current Status**: ✅ **Full shell capability in backend**

**How it works now**: Backend has complete shell access for complex operations

## Best Practices

### Extension Usage with VM Backend
1. ✅ Use UI directly - all operations work natively
2. ✅ Proxy management works reliably through UI
3. ✅ GitHub templates apply automatically
4. ✅ Resource creation works directly from forms
5. Monitor backend logs for any issues

### Development Workflow
1. ✅ Use extension UI for all operations
2. ✅ Backend validates YAML automatically
3. Keep extension updated for enhancements
4. Check backend logs for debugging
5. Use diagnostic commands to verify VM service health

### Troubleshooting Workflow
1. **Check VM Service**: Verify backend service is running
2. **Check Extension Logs**: Use `docker extension logs envoyproxy/envoy-gateway-extension`
3. **Verify Connectivity**: Test kubectl and cluster access
4. **Backend Health**: Check backend API responses
5. **Restart if Needed**: Reinstall extension to restart VM service

## Getting Help

### Information to Provide
When reporting issues, include:
- Docker Desktop version
- Extension version
- Error messages (exact text)
- Steps to reproduce
- Output of diagnostic commands

### Common Solutions Summary
- **Resource creation**: ✅ **Works natively through UI**
- **Proxy management**: ✅ **Full start/stop control via UI**  
- **Extension issues**: Rebuild and reinstall to restart VM service
- **Backend issues**: Check Docker Desktop extension logs
- **Connectivity**: Verify kubectl and cluster access

### Related Documentation
- [Docker Desktop Extension Limitations](./docker-desktop-limitations.md)
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [PROGRESS_MEMORY.md](../PROGRESS_MEMORY.md) - Recent changes and discoveries