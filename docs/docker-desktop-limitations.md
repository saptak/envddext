# Docker Desktop Extension Limitations

This document provides a comprehensive overview of Docker Desktop extension security limitations and how they affect the Envoy Gateway extension functionality.

## Overview

Docker Desktop extensions run in a sandboxed environment that restricts certain operations for security reasons. This affects file operations, shell commands, and process management capabilities.

## Technical Limitations

### File System Restrictions

#### 🚫 **Blocked File Operations**
- **Temporary file creation**: Extensions cannot create files accessible to host kubectl
- **Directory paths tested and blocked**:
  - `/tmp/` - Not accessible to host kubectl
  - `./` - Working directory not shared between extension and host
  - `/var/tmp/` - Not accessible to host kubectl
  - Custom paths - No writable locations found that both extension and host can access

#### **Impact on Features**:
- Gateway creation (requires YAML file input to kubectl)
- HTTPRoute creation (requires YAML file input to kubectl)
- Any resource creation that needs complex YAML structures

### Shell Command Restrictions

#### 🚫 **Blocked Shell Operations**
```bash
# Pipe operators
echo "content" | kubectl apply -f -

# Redirects
echo "content" > file.yaml

# Heredoc syntax
kubectl apply -f - << 'EOF'
apiVersion: v1
kind: Pod
EOF

# Data URLs (treated as shell operators)
kubectl apply -f data:application/yaml;base64,<content>
```

#### **SDK Error Messages**:
- `"shell operators are not allowed when executing commands through SDK APIs"`
- `"Error while executing... shell operators are not allowed"`

### Process Management Restrictions

#### 🚫 **Blocked Process Operations**
```typescript
// Pattern-based process killing
await ddClient.extension.host?.cli.exec("pkill", ["-f", "kubectl proxy"]);

// Signal handling
await ddClient.extension.host?.cli.exec("kill", ["-TERM", "process-pattern"]);
```

#### **Impact**:
- Cannot reliably stop kubectl proxy processes
- Background process cleanup issues
- Process lifecycle management limitations

## Feature Impact Analysis

### Gateway and HTTPRoute Creation

**Problem**: Cannot create Kubernetes resources that require complex YAML files.

**Root Cause**: 
- Extensions cannot write temporary files accessible to kubectl
- Cannot use shell operators to pipe YAML content to kubectl
- Data URLs are blocked as shell operators

**Current Solution**: 
- Generate valid YAML and kubectl commands
- Display commands for manual execution by user
- Validate YAML structure before showing commands

**Files Affected**:
- `ui/src/helper/kubernetes.ts` - `createGateway()` function
- `ui/src/helper/kubernetes.ts` - `createHTTPRoute()` function

### Kubectl Proxy Management

**Problem**: Cannot stop kubectl proxy processes via UI.

**Root Cause**:
- `pkill -f "kubectl proxy"` is blocked by extension security
- Cannot use pattern matching for process termination

**Current Status**:
- ✅ Starting proxy works perfectly
- ✅ Proxy functionality works completely
- ❌ Stop button doesn't work (process continues running)

**Workaround**: Manual `pkill -f "kubectl proxy"` from terminal

**File Affected**:
- `ui/src/services/kubectlProxyService.ts` - `stopProxy()` method

### GitHub Templates (Working)

**Why It Works**: 
- Uses direct URL application: `kubectl apply -f https://raw.githubusercontent.com/...`
- No file operations or shell operators required
- Simple kubectl command execution

**File**: `ui/src/services/githubTemplateService.ts`

### Resource Listing/Status (Working)

**Why It Works**:
- Simple kubectl commands without file operations
- Direct API access through kubectl
- No shell operators required

**Examples**:
- `kubectl get gateways`
- `kubectl get namespaces`
- `kubectl version --client`

## Debugging and Investigation Process

### Discovery Methods Used

1. **Progressive Testing**: Started with simple operations and increased complexity
2. **Error Analysis**: Analyzed specific SDK error messages
3. **Isolation Testing**: Tested individual components (file operations, shell operators, process management)
4. **Alternative Approaches**: Tested data URLs, different file paths, various shell syntaxes

### Key Discoveries

1. **File System**: No shared writable location exists between extension and host kubectl
2. **Shell Operators**: Any command containing `:`, `|`, `>`, `<<` triggers security blocks
3. **Process Management**: Pattern-based process operations are restricted
4. **Background Processes**: Can start but cannot reliably terminate

## Working Solutions and Patterns

### ✅ **Successful Patterns**

```typescript
// Direct URL application (GitHub templates)
await ddClient.extension.host?.cli.exec("kubectl", ["apply", "-f", "https://example.com/resource.yaml"]);

// Simple kubectl commands
await ddClient.extension.host?.cli.exec("kubectl", ["get", "namespaces"]);

// Basic process execution
await ddClient.extension.host?.cli.exec("kubectl", ["proxy", "--port=8001"]);
```

### ❌ **Failed Approaches Tested**

```typescript
// Temporary files
const tempFile = '/tmp/resource.yaml';
await ddClient.extension.host?.cli.exec("sh", ["-c", `cat > ${tempFile} << 'EOF'\n${yamlContent}\nEOF`]);

// Data URLs  
await ddClient.extension.host?.cli.exec("kubectl", ["apply", "-f", "data:application/yaml;base64,..."]);

// Pipe operations
await ddClient.extension.host?.cli.exec("sh", ["-c", "echo 'content' | kubectl apply -f -"]);

// Process cleanup
await ddClient.extension.host?.cli.exec("pkill", ["-f", "kubectl proxy"]);
```

## Recommendations for Extension Development

### 1. **Resource Creation Strategy**
- Generate complete kubectl commands for user execution
- Validate YAML locally before presenting commands
- Provide clear copy/paste interfaces
- Consider using Kubernetes client libraries instead of kubectl

### 2. **Process Management Strategy**
- Track process IDs when possible
- Use direct process termination instead of pattern matching
- Implement graceful degradation for cleanup failures
- Document manual cleanup procedures

### 3. **File Operations Strategy**
- Avoid temporary file approaches
- Use direct URL application when possible
- Consider embedding resources in extension bundle
- Use in-memory YAML generation

### 4. **Testing Strategy**
- Test all kubectl operations in extension environment
- Verify background process behavior
- Test cleanup and error scenarios
- Document all discovered limitations

## Future Improvements

### Potential Solutions

1. **Kubernetes Client Libraries**: Replace kubectl with direct API calls
2. **Process Tracking**: Implement better process lifecycle management
3. **Resource Templates**: Pre-generate common resource templates
4. **API Integration**: Use Kubernetes REST APIs directly instead of kubectl

### Alternative Architectures

1. **Pure API Approach**: Eliminate kubectl dependency entirely
2. **Template-Based**: Expand GitHub templates to cover all use cases
3. **Hybrid Model**: Use APIs for resource creation, kubectl for complex operations

## Related Documentation

- [Docker Desktop Extension Development Guide](https://docs.docker.com/desktop/extensions-sdk/)
- [Docker Extension Security Model](https://docs.docker.com/desktop/extensions-sdk/architecture/)
- [Kubernetes Client Libraries](https://kubernetes.io/docs/reference/using-api/client-libraries/)

## Change Log

- **2025-06-05**: Initial documentation after comprehensive limitation discovery
- **2025-06-05**: Added specific error messages and failed approaches
- **2025-06-05**: Documented working solutions and recommendations