# Troubleshooting Guide - Docker Desktop Extension Limitations

This guide helps troubleshoot common issues related to Docker Desktop extension security limitations in the Envoy Gateway extension.

## Common Error Messages and Solutions

### Gateway/HTTPRoute Creation Errors

#### Error: "shell operators are not allowed when executing commands through SDK APIs"

**Symptoms:**
- Gateway creation fails with shell operator error
- HTTPRoute creation fails similarly
- Error appears when clicking "Create Gateway" or "Create HTTPRoute"

**Root Cause:**
Docker Desktop extension SDK blocks shell operators like pipes (`|`), redirects (`>`), and heredoc (`<<`).

**Solution:**
1. The extension will show a manual kubectl command
2. Copy the provided command
3. Run it in your terminal
4. Refresh the Gateway list in the UI

**Example Output:**
```bash
kubectl apply -f - << 'EOF'
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
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
```

#### Error: "the path '/tmp/...' does not exist"

**Symptoms:**
- File path errors mentioning `/tmp/` directory
- Gateway creation fails with path not found

**Root Cause:**
Docker Desktop extensions cannot create files accessible to host kubectl.

**Solution:**
Update to latest extension version which includes the manual command workaround.

### Kubectl Proxy Issues

#### Error: Proxy appears stopped but still running

**Symptoms:**
- Clicked "Stop Proxy" but proxy continues working
- `curl http://localhost:8001/api/v1` still responds
- UI shows proxy as stopped

**Root Cause:**
`pkill -f "kubectl proxy"` is blocked by Docker Desktop extension security.

**Solution:**
Manually stop the proxy from terminal:
```bash
pkill -f "kubectl proxy"
```

**Verification:**
```bash
# Should fail/timeout if proxy is stopped
curl -s http://localhost:8001/api/v1 --connect-timeout 2
```

#### Error: Cannot start proxy - port already in use

**Symptoms:**
- Proxy start fails
- Error about port 8001 being in use

**Root Cause:**
Previous proxy process wasn't properly terminated.

**Solution:**
1. Stop existing proxy: `pkill -f "kubectl proxy"`
2. Verify it's stopped: `ps aux | grep "kubectl proxy"`
3. Try starting proxy again from UI

### GitHub Templates Issues

#### Error: Templates fail to apply

**Symptoms:**
- Template application fails
- Kubectl errors about network/URL access

**Root Cause:**
Network connectivity or GitHub access issues.

**Solution:**
1. Check internet connectivity
2. Verify GitHub repository access
3. Try manual application:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/saptak/envoygatewaytemplates/main/templates/basic-http/echo-service.yaml
   ```

### General Extension Issues

#### Error: kubectl not found or accessible

**Symptoms:**
- All kubectl operations fail
- Extension shows kubectl connectivity issues

**Root Cause:**
Docker Desktop kubectl integration not properly configured.

**Solution:**
1. Restart Docker Desktop
2. Verify kubectl works outside extension: `kubectl version`
3. Reinstall extension: `./build-and-install-github-templates.sh`

#### Error: Extension UI not responding

**Symptoms:**
- Extension tab loads but shows errors
- Components don't render properly

**Root Cause:**
Extension build or installation issues.

**Solution:**
1. Uninstall extension: `docker extension uninstall envoyproxy/envoy-gateway-extension`
2. Rebuild and reinstall: `./build-and-install-github-templates.sh`
3. Clear Docker Desktop cache if needed

## Diagnostic Commands

### Check Extension Status
```bash
# List installed extensions
docker extension ls

# Check if extension is running
docker extension ls | grep envoy-gateway
```

### Check Kubectl Connectivity
```bash
# Test kubectl access
kubectl version --client

# Test cluster connectivity  
kubectl get namespaces

# Test Gateway API access
kubectl get gateways -A
```

### Check Proxy Status
```bash
# Check if proxy is running
ps aux | grep "kubectl proxy"

# Test proxy connectivity
curl -s http://localhost:8001/api/v1 --connect-timeout 3

# Check proxy logs (if available)
ps aux | grep "kubectl proxy" | awk '{print $2}' | xargs -I {} lsof -p {}
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

## Known Limitations and Workarounds

### Resource Creation Limitations

**Limitation**: Cannot create Gateway/HTTPRoute resources directly through UI
**Workaround**: Use manual kubectl commands provided by extension

**Why it happens**: Docker Desktop extension file system restrictions

### Process Management Limitations

**Limitation**: Cannot stop kubectl proxy through UI
**Workaround**: Manual `pkill -f "kubectl proxy"` from terminal

**Why it happens**: Docker Desktop extension process management restrictions

### Shell Command Limitations

**Limitation**: Cannot use advanced shell features
**Workaround**: Use direct kubectl commands or URL-based resource application

**Why it happens**: Docker Desktop extension security sandbox

## Best Practices

### Extension Usage
1. Always use the provided manual commands for resource creation
2. Manually verify proxy status if stop button doesn't work
3. Use GitHub templates for quick resource deployment
4. Keep terminal access available for workarounds

### Development Workflow
1. Test resources manually before using extension
2. Use `kubectl --dry-run=client` to validate YAML
3. Keep extension updated for latest workarounds
4. Document any new limitations discovered

### Troubleshooting Workflow
1. Check extension logs in Docker Desktop
2. Verify kubectl connectivity independently
3. Test manual commands provided by extension
4. Use diagnostic commands to isolate issues
5. Restart extension if needed

## Getting Help

### Information to Provide
When reporting issues, include:
- Docker Desktop version
- Extension version
- Error messages (exact text)
- Steps to reproduce
- Output of diagnostic commands

### Common Solutions Summary
- **Resource creation**: Use manual kubectl commands
- **Proxy stop**: Use `pkill -f "kubectl proxy"`
- **Extension issues**: Rebuild and reinstall
- **Connectivity**: Verify kubectl and cluster access

### Related Documentation
- [Docker Desktop Extension Limitations](./docker-desktop-limitations.md)
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [PROGRESS_MEMORY.md](../PROGRESS_MEMORY.md) - Recent changes and discoveries