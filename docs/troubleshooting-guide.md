# Troubleshooting Guide - Envoy Gateway Extension

This guide helps troubleshoot common issues with the Envoy Gateway extension. **Note**: Previous Docker Desktop extension limitations have been resolved with the VM service backend architecture!

## Common Error Messages and Solutions

### Gateway/HTTPRoute Creation - **Now Works Perfectly!**

#### ✅ Gateway/HTTPRoute Creation Success

**Current Status:**
- ✅ Gateway creation works directly via backend API
- ✅ HTTPRoute creation works directly via backend API  
- ✅ Full YAML generation and kubectl operations in backend
- ✅ Real-time error feedback and success confirmation

**How It Works Now:**
1. Click "Create Gateway" or "Create HTTPRoute" in the UI
2. Backend generates complete YAML structure
3. Backend writes YAML to temporary file in `/tmp/`
4. Backend executes kubectl apply automatically
5. Success/error feedback shown immediately in UI

**If Issues Occur:**
- Check Docker Desktop VM service is running
- Verify Kubernetes cluster connectivity
- Check backend logs via Docker Desktop extension logs
          from: Same
        kinds:
          - kind: HTTPRoute
EOF
### Kubectl Proxy Management - **Now Fully Functional!**

#### ✅ Complete Proxy Lifecycle Management

**Current Status:**
- ✅ Start proxy works perfectly via backend
- ✅ Stop proxy works perfectly with PID tracking
- ✅ Real-time status monitoring
- ✅ Automatic cleanup on extension restart

**How It Works Now:**
1. **Start**: Backend starts kubectl proxy and stores PID in `/tmp/kubectl-proxy-{port}.pid`
2. **Monitor**: Backend checks proxy status via HTTP connectivity tests
3. **Stop**: Backend uses stored PID for reliable process termination
4. **Cleanup**: Automatic PID file cleanup and process management

#### Troubleshooting Proxy Issues

**If Proxy Won't Start:**
1. Check if port 8001 is already in use: `lsof -i :8001`
2. Check Kubernetes cluster connectivity: `kubectl cluster-info`
3. Verify Docker Desktop VM service is running

**If Proxy Won't Stop:**
1. Backend should handle this automatically now
2. If needed, manual cleanup: `pkill -f "kubectl proxy"`
3. Check Docker Desktop extension logs for backend errors

**Proxy Status Verification:**
```bash
# Check if proxy is responding
curl -s http://localhost:8001/api/v1 --connect-timeout 2

# Check for proxy processes
ps aux | grep "kubectl proxy"
```
3. Try starting proxy again from UI

### GitHub Templates - **Enhanced with Backend!**

#### ✅ Improved Template Application

**Current Status:**
- ✅ Enhanced reliability via backend API
- ✅ Better error handling and user feedback
- ✅ Automatic retry mechanisms
- ✅ Comprehensive logging

**If Template Application Fails:**
1. **Check Connectivity**: Backend will show specific error messages
2. **Repository Access**: Backend handles GitHub API calls with retries
3. **Manual Verification**: Test template URL accessibility
   ```bash
   curl -I https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/templates/basic-http/echo-service.yaml
   ```
4. **Backend Logs**: Check Docker Desktop extension logs for detailed error information

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
- Backend reports kubectl connectivity issues
- Kubernetes operations fail

**Root Cause:**
Docker Desktop kubectl integration not properly configured.

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

# Test kubectl access via backend
kubectl version --client

# Test cluster connectivity  
kubectl get namespaces

# Test Gateway API access
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

### ✅ Resource Creation - **Fully Functional**

**Previous Issue**: ~~Cannot create Gateway/HTTPRoute resources directly through UI~~
**Current Status**: ✅ **Fully functional via backend API**

**How it works now**: Backend generates YAML, writes to `/tmp/`, and executes kubectl automatically

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