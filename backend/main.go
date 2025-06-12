package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"gopkg.in/yaml.v2"
)

type Server struct {
	router *mux.Router
}

type GatewayFormData struct {
	Name             string     `json:"name"`
	Namespace        string     `json:"namespace"`
	GatewayClassName string     `json:"gatewayClassName"`
	Listeners        []Listener `json:"listeners"`
}

type Listener struct {
	Name     string `json:"name"`
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	Hostname string `json:"hostname,omitempty"`
	TLS      *TLS   `json:"tls,omitempty"`
}

type TLS struct {
	Mode            string    `json:"mode"`
	CertificateRefs []CertRef `json:"certificateRefs,omitempty"`
}

type CertRef struct {
	Name string `json:"name"`
}

type HTTPRouteFormData struct {
	Name                   string               `json:"name"`
	Namespace              string               `json:"namespace"`
	ParentGateway          string               `json:"parentGateway"`
	ParentGatewayNamespace string               `json:"parentGatewayNamespace"`
	Hostnames              []string             `json:"hostnames"`
	Rules                  []HTTPRuleFormData   `json:"rules"`
}

type HTTPRuleFormData struct {
	Name                   string                     `json:"name,omitempty"`
	Matches                []HTTPRouteMatchFormData   `json:"matches"`
	BackendRefs            []HTTPBackendRefFormData   `json:"backendRefs"`
	RequestTimeout         string                     `json:"requestTimeout,omitempty"`
	BackendRequestTimeout  string                     `json:"backendRequestTimeout,omitempty"`
}

type HTTPRouteMatchFormData struct {
	PathType     string                           `json:"pathType"`
	PathValue    string                           `json:"pathValue"`
	Method       string                           `json:"method,omitempty"`
	Headers      []HTTPRouteHeaderMatchFormData   `json:"headers"`
	QueryParams  []HTTPRouteQueryParamFormData    `json:"queryParams"`
}

type HTTPRouteHeaderMatchFormData struct {
	Type  string `json:"type"`
	Name  string `json:"name"`
	Value string `json:"value"`
}

type HTTPRouteQueryParamFormData struct {
	Type  string `json:"type"`
	Name  string `json:"name"`
	Value string `json:"value"`
}

type HTTPBackendRefFormData struct {
	Name   string `json:"name"`
	Port   int    `json:"port"`
	Weight int    `json:"weight"`
}

// Legacy structures for backward compatibility
type HTTPRule struct {
	Matches     []HTTPMatch  `json:"matches"`
	BackendRefs []BackendRef `json:"backendRefs"`
}

type HTTPMatch struct {
	Path HTTPPath `json:"path"`
}

type HTTPPath struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type BackendRef struct {
	Name string `json:"name"`
	Port int    `json:"port"`
}

type ProxyStatus struct {
	IsRunning bool   `json:"isRunning"`
	Port      int    `json:"port"`
	PID       string `json:"pid,omitempty"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type CertificateFormData struct {
	Name       string   `json:"name"`
	Namespace  string   `json:"namespace"`
	DNSNames   []string `json:"dnsNames"`
	IssuerType string   `json:"issuerType"` // "self-signed" or "ca-issuer"
	IssuerName string   `json:"issuerName,omitempty"`
}

type Certificate struct {
	Name           string   `json:"name"`
	Namespace      string   `json:"namespace"`
	SecretName     string   `json:"secretName"`
	DNSNames       []string `json:"dnsNames"`
	Issuer         string   `json:"issuer"`
	Status         string   `json:"status"`
	ExpirationDate string   `json:"expirationDate,omitempty"`
	CreatedAt      string   `json:"createdAt"`
}

func NewServer() *Server {
	s := &Server{
		router: mux.NewRouter(),
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	s.router.HandleFunc("/health", s.handleHealth).Methods("GET")
	s.router.HandleFunc("/create-gateway", s.handleCreateGateway).Methods("POST")
	s.router.HandleFunc("/create-httproute", s.handleCreateHTTPRoute).Methods("POST")
	s.router.HandleFunc("/start-proxy", s.handleStartProxy).Methods("POST")
	s.router.HandleFunc("/stop-proxy", s.handleStopProxy).Methods("POST")
	s.router.HandleFunc("/proxy-status", s.handleProxyStatus).Methods("GET")
	s.router.HandleFunc("/test-proxy", s.handleTestProxy).Methods("GET")
	s.router.HandleFunc("/apply-template", s.handleApplyTemplate).Methods("POST")
	s.router.HandleFunc("/apply-yaml", s.handleApplyYAML).Methods("POST")
	s.router.HandleFunc("/kubectl", s.handleKubectl).Methods("POST")
	s.router.HandleFunc("/create-certificate", s.handleCreateCertificate).Methods("POST")
	s.router.HandleFunc("/list-certificates", s.handleListCertificates).Methods("GET")
	s.router.HandleFunc("/delete-certificate", s.handleDeleteCertificate).Methods("DELETE")
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	response := APIResponse{Success: true, Data: "Backend service is running"}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleCreateGateway(w http.ResponseWriter, r *http.Request) {
	var gatewayData GatewayFormData
	if err := json.NewDecoder(r.Body).Decode(&gatewayData); err != nil {
		s.sendError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	yamlContent, err := s.generateGatewayYAML(gatewayData)
	if err != nil {
		s.sendError(w, fmt.Sprintf("Failed to generate Gateway YAML: %v", err), http.StatusInternalServerError)
		return
	}

	if err := s.applyYAML(yamlContent, "gateway"); err != nil {
		log.Printf("handleCreateGateway: Error from s.applyYAML for Gateway '%s': %v", gatewayData.Name, err)
		s.sendError(w, fmt.Sprintf("Failed to apply Gateway: %v", err), http.StatusInternalServerError)
		return
	}
	log.Printf("handleCreateGateway: Successfully applied YAML for Gateway '%s'. Sending success response.", gatewayData.Name)

	response := APIResponse{
		Success: true,
		Data:    fmt.Sprintf("Gateway %s created successfully in namespace %s", gatewayData.Name, gatewayData.Namespace),
	}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleCreateHTTPRoute(w http.ResponseWriter, r *http.Request) {
	var routeData HTTPRouteFormData
	if err := json.NewDecoder(r.Body).Decode(&routeData); err != nil {
		s.sendError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	yamlContent, err := s.generateHTTPRouteYAML(routeData)
	if err != nil {
		s.sendError(w, fmt.Sprintf("Failed to generate HTTPRoute YAML: %v", err), http.StatusInternalServerError)
		return
	}

	if err := s.applyYAML(yamlContent, "httproute"); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to apply HTTPRoute: %v", err), http.StatusInternalServerError)
		return
	}

	response := APIResponse{
		Success: true,
		Data:    fmt.Sprintf("HTTPRoute %s created successfully in namespace %s", routeData.Name, routeData.Namespace),
	}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleStartProxy(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Port int `json:"port"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Port = 8001
	}

	// Check if proxy is already running
	if status := s.getProxyStatus(req.Port); status.IsRunning {
		response := APIResponse{Success: true, Data: status}
		json.NewEncoder(w).Encode(response)
		return
	}

	// Start kubectl proxy
	cmd := exec.Command("kubectl", "proxy", "--port="+strconv.Itoa(req.Port))
	if err := cmd.Start(); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to start kubectl proxy: %v", err), http.StatusInternalServerError)
		return
	}

	// Save PID for later termination
	pidFile := fmt.Sprintf("/tmp/kubectl-proxy-%d.pid", req.Port)
	if err := ioutil.WriteFile(pidFile, []byte(strconv.Itoa(cmd.Process.Pid)), 0644); err != nil {
		log.Printf("Warning: Could not save PID file: %v", err)
	}

	// Wait a moment to ensure proxy starts
	time.Sleep(2 * time.Second)

	status := s.getProxyStatus(req.Port)
	response := APIResponse{Success: true, Data: status}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleStopProxy(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Port int `json:"port"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Port = 8001
	}

	pidFile := fmt.Sprintf("/tmp/kubectl-proxy-%d.pid", req.Port)
	pidBytes, err := ioutil.ReadFile(pidFile)
	if err != nil {
		// Try to kill any kubectl proxy process
		exec.Command("pkill", "-f", "kubectl proxy").Run()
	} else {
		pid := strings.TrimSpace(string(pidBytes))
		exec.Command("kill", pid).Run()
		os.Remove(pidFile)
	}

	response := APIResponse{Success: true, Data: "Proxy stopped"}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleProxyStatus(w http.ResponseWriter, r *http.Request) {
	port := 8001
	if portStr := r.URL.Query().Get("port"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	status := s.getProxyStatus(port)
	response := APIResponse{Success: true, Data: status}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleTestProxy(w http.ResponseWriter, r *http.Request) {
	port := 8001
	if portStr := r.URL.Query().Get("port"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	// Check if proxy is running first
	status := s.getProxyStatus(port)
	if !status.IsRunning {
		response := APIResponse{
			Success: false,
			Error:   "Kubectl proxy is not running",
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	// Test connectivity by making a request to the proxy
	cmd := exec.Command("curl", "-s", "-m", "5", fmt.Sprintf("http://localhost:%d/api/v1", port))
	output, err := cmd.CombinedOutput()

	testResult := map[string]interface{}{
		"proxyRunning": true,
		"port":         port,
	}

	if err != nil {
		testResult["connectivity"] = false
		testResult["message"] = "Proxy is running but not responding to requests"
		testResult["error"] = err.Error()
	} else {
		testResult["connectivity"] = true
		testResult["message"] = "Kubectl proxy is working correctly"
		if len(output) > 100 {
			testResult["response"] = string(output)[:100] + "..."
		} else {
			testResult["response"] = string(output)
		}
	}

	response := APIResponse{Success: true, Data: testResult}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleApplyTemplate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Use --validate=false and --insecure-skip-tls-verify to bypass validation issues in containerized environment
	cmd := exec.Command("kubectl", "apply", "-f", req.URL, "--validate=false", "--insecure-skip-tls-verify")
	output, err := cmd.CombinedOutput()
	if err != nil {
		s.sendError(w, fmt.Sprintf("Failed to apply template: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}

	response := APIResponse{Success: true, Data: string(output)}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleApplyYAML(w http.ResponseWriter, r *http.Request) {
	var req struct {
		YAML string `json:"yaml"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.YAML == "" {
		s.sendError(w, "YAML content is required", http.StatusBadRequest)
		return
	}

	// Apply YAML content using the existing applyYAML function
	if err := s.applyYAMLContent(req.YAML); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to apply YAML: %v", err), http.StatusInternalServerError)
		return
	}

	response := APIResponse{Success: true, Data: "YAML applied successfully"}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) applyYAMLContent(yamlContent string) error {
	// Ensure we have a working kubeconfig
	if err := s.ensureKubeconfig(); err != nil {
		// CRITICAL CHANGE: Return error immediately if kubeconfig setup fails
		log.Printf("Error during ensureKubeconfig: %v. Aborting applyYAMLContent.", err)
		return fmt.Errorf("kubeconfig setup failed: %v", err)
	}

	tempFile := filepath.Join("/tmp", fmt.Sprintf("apply-yaml-%d.yaml", time.Now().Unix()))

	if err := ioutil.WriteFile(tempFile, []byte(yamlContent), 0644); err != nil {
		return fmt.Errorf("failed to write temporary file: %v", err)
	}
	defer os.Remove(tempFile)

	// Use --validate=false and --insecure-skip-tls-verify to bypass validation issues in containerized environment
	cmd := exec.Command("kubectl", "apply", "-f", tempFile, "--validate=false", "--insecure-skip-tls-verify")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("kubectl apply failed: %v\nOutput: %s", err, string(output))
	}

	return nil
}

func (s *Server) handleKubectl(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Args []string `json:"args"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// For Docker Desktop extension, use kubectl without server override
	// Let kubectl use the mounted kubeconfig as-is
	cmd := exec.Command("kubectl", req.Args...)

	// Set environment to use the mounted kubeconfig
	cmd.Env = append(os.Environ(), "KUBECONFIG=/host_users/saptak/.kube/config")

	output, err := cmd.CombinedOutput()

	// If kubectl fails, try to provide more helpful error context
	if err != nil {
		log.Printf("kubectl command failed: %v, output: %s", err, string(output))
	}

	response := APIResponse{
		Success: err == nil,
		Data:    string(output),
	}
	if err != nil {
		response.Error = err.Error()
	}

	json.NewEncoder(w).Encode(response)
}

func (s *Server) generateGatewayYAML(data GatewayFormData) (string, error) {
	gateway := map[string]interface{}{
		"apiVersion": "gateway.networking.k8s.io/v1",
		"kind":       "Gateway",
		"metadata": map[string]interface{}{
			"name":      data.Name,
			"namespace": data.Namespace,
		},
		"spec": map[string]interface{}{
			"gatewayClassName": data.GatewayClassName,
			"listeners":        s.convertListeners(data.Listeners),
		},
	}

	yamlBytes, err := yaml.Marshal(gateway)
	if err != nil {
		return "", err
	}
	return string(yamlBytes), nil
}

func (s *Server) generateHTTPRouteYAML(data HTTPRouteFormData) (string, error) {
	route := map[string]interface{}{
		"apiVersion": "gateway.networking.k8s.io/v1",
		"kind":       "HTTPRoute",
		"metadata": map[string]interface{}{
			"name":      data.Name,
			"namespace": data.Namespace,
		},
		"spec": map[string]interface{}{
			"parentRefs": []map[string]interface{}{
				{
					"name": data.ParentGateway,
				},
			},
			"hostnames": data.Hostnames,
			"rules":     s.convertHTTPRulesFromFormData(data.Rules),
		},
	}

	yamlBytes, err := yaml.Marshal(route)
	if err != nil {
		return "", err
	}
	return string(yamlBytes), nil
}

func (s *Server) convertListeners(listeners []Listener) []map[string]interface{} {
	result := make([]map[string]interface{}, len(listeners))
	for i, listener := range listeners {
		result[i] = map[string]interface{}{
			"name":     listener.Name,
			"port":     listener.Port,
			"protocol": listener.Protocol,
		}
		if listener.Hostname != "" {
			result[i]["hostname"] = listener.Hostname
		}
		if listener.TLS != nil {
			tls := map[string]interface{}{
				"mode": listener.TLS.Mode,
			}
			if len(listener.TLS.CertificateRefs) > 0 {
				refs := make([]map[string]interface{}, len(listener.TLS.CertificateRefs))
				for j, ref := range listener.TLS.CertificateRefs {
					refs[j] = map[string]interface{}{"name": ref.Name}
				}
				tls["certificateRefs"] = refs
			}
			result[i]["tls"] = tls
		}
	}
	return result
}

func (s *Server) convertHTTPRulesFromFormData(rules []HTTPRuleFormData) []map[string]interface{} {
	result := make([]map[string]interface{}, len(rules))
	for i, rule := range rules {
		matches := make([]map[string]interface{}, len(rule.Matches))
		for j, match := range rule.Matches {
			matchMap := map[string]interface{}{
				"path": map[string]interface{}{
					"type":  match.PathType,
					"value": match.PathValue,
				},
			}
			
			// Add method if specified
			if match.Method != "" {
				matchMap["method"] = match.Method
			}
			
			// Add headers if any
			if len(match.Headers) > 0 {
				headers := make([]map[string]interface{}, len(match.Headers))
				for k, header := range match.Headers {
					headers[k] = map[string]interface{}{
						"type":  header.Type,
						"name":  header.Name,
						"value": header.Value,
					}
				}
				matchMap["headers"] = headers
			}
			
			// Add query params if any
			if len(match.QueryParams) > 0 {
				queryParams := make([]map[string]interface{}, len(match.QueryParams))
				for k, param := range match.QueryParams {
					queryParams[k] = map[string]interface{}{
						"type":  param.Type,
						"name":  param.Name,
						"value": param.Value,
					}
				}
				matchMap["queryParams"] = queryParams
			}
			
			matches[j] = matchMap
		}

		backendRefs := make([]map[string]interface{}, len(rule.BackendRefs))
		for j, ref := range rule.BackendRefs {
			backendRef := map[string]interface{}{
				"name": ref.Name,
				"port": ref.Port,
			}
			
			// Add weight if specified and not default
			if ref.Weight > 0 && ref.Weight != 100 {
				backendRef["weight"] = ref.Weight
			}
			
			backendRefs[j] = backendRef
		}

		ruleMap := map[string]interface{}{
			"matches":     matches,
			"backendRefs": backendRefs,
		}
		
		// Add timeouts if specified
		if rule.RequestTimeout != "" {
			if ruleMap["timeouts"] == nil {
				ruleMap["timeouts"] = map[string]interface{}{}
			}
			ruleMap["timeouts"].(map[string]interface{})["request"] = rule.RequestTimeout
		}
		
		if rule.BackendRequestTimeout != "" {
			if ruleMap["timeouts"] == nil {
				ruleMap["timeouts"] = map[string]interface{}{}
			}
			ruleMap["timeouts"].(map[string]interface{})["backendRequest"] = rule.BackendRequestTimeout
		}

		result[i] = ruleMap
	}
	return result
}

// Legacy function for backward compatibility
func (s *Server) convertHTTPRules(rules []HTTPRule) []map[string]interface{} {
	result := make([]map[string]interface{}, len(rules))
	for i, rule := range rules {
		matches := make([]map[string]interface{}, len(rule.Matches))
		for j, match := range rule.Matches {
			matches[j] = map[string]interface{}{
				"path": map[string]interface{}{
					"type":  match.Path.Type,
					"value": match.Path.Value,
				},
			}
		}

		backendRefs := make([]map[string]interface{}, len(rule.BackendRefs))
		for j, ref := range rule.BackendRefs {
			backendRefs[j] = map[string]interface{}{
				"name": ref.Name,
				"port": ref.Port,
			}
		}

		result[i] = map[string]interface{}{
			"matches":     matches,
			"backendRefs": backendRefs,
		}
	}
	return result
}

func (s *Server) ensureKubeconfig() error {
	// For Docker Desktop extensions running in containers, we need to update
	// the kubeconfig to use the accessible server endpoint

	// Read the current kubeconfig
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		return fmt.Errorf("KUBECONFIG environment variable is not set. Please ensure it's configured for the backend service.")
	}
	//
	configBytes, err := ioutil.ReadFile(kubeconfigPath)
	if err != nil {
		return fmt.Errorf("failed to read kubeconfig: %v", err)
	}

	// Replace localhost/127.0.0.1 with kubernetes.docker.internal for container access
	configStr := string(configBytes)

	// Find the current server URL and replace it with accessible endpoint
	if strings.Contains(configStr, "127.0.0.1:") {
		// Extract port from the server URL
		lines := strings.Split(configStr, "\n")
		for i, line := range lines {
			if strings.Contains(line, "server:") && strings.Contains(line, "127.0.0.1:") {
				// Replace with kubernetes.docker.internal and same port
				lines[i] = strings.Replace(line, "127.0.0.1:", "kubernetes.docker.internal:", 1)
				break
			}
		}
		configStr = strings.Join(lines, "\n")

		// Write the modified config to a temporary location for container use
		tempConfigPath := "/tmp/kubeconfig"
		if err := ioutil.WriteFile(tempConfigPath, []byte(configStr), 0644); err != nil {
			return fmt.Errorf("failed to write temporary kubeconfig: %v", err)
		}

		// Set the environment variable for kubectl to use the modified config
		os.Setenv("KUBECONFIG", tempConfigPath)
		log.Printf("Updated kubeconfig to use kubernetes.docker.internal for container access")
	}

	return nil
}

func (s *Server) applyYAML(yamlContent, resourceType string) error {
	// Ensure we have a working kubeconfig
	if err := s.ensureKubeconfig(); err != nil {
		// CRITICAL CHANGE: Return error immediately if kubeconfig setup fails
		log.Printf("Error during ensureKubeconfig: %v. Aborting applyYAML.", err)
		return fmt.Errorf("kubeconfig setup failed: %v", err)
	}

	tempFile := filepath.Join("/tmp", fmt.Sprintf("%s-%d.yaml", resourceType, time.Now().Unix()))

	if err := ioutil.WriteFile(tempFile, []byte(yamlContent), 0644); err != nil {
		return fmt.Errorf("failed to write temporary file: %v", err)
	}
	defer os.Remove(tempFile)

	// Try server-side apply first, then fall back to client-side apply
	cmd := exec.Command("kubectl", "apply", "-f", tempFile, "--server-side", "--validate=false", "--force-conflicts", "--insecure-skip-tls-verify")
	output, err := cmd.CombinedOutput()

	if err != nil {
		log.Printf("Server-side apply failed, trying client-side: %v", err)
		// Fallback to client-side apply with validation disabled
		cmd = exec.Command("kubectl", "apply", "-f", tempFile, "--validate=false", "--force", "--insecure-skip-tls-verify")
		output, err = cmd.CombinedOutput()

		if err != nil {
			// Client-side apply also resulted in a non-zero exit code.
			// BUT, check if the output indicates a success-like state.
			outputStr := strings.ToLower(string(output))
			successKeywords := []string{"unchanged", "configured", "created", "applied"}
			isSuccessLike := false
			for _, keyword := range successKeywords {
				if strings.Contains(outputStr, keyword) {
					isSuccessLike = true
					log.Printf("kubectl apply for %s reported error but output indicates success ('%s'): %s", resourceType, keyword, string(output))
					break
				}
			}

			if isSuccessLike {
				return nil // Treat as success despite non-zero exit code
			}

			// If truly a failure (non-zero exit AND no success-like keywords in output):
			errorMsg := string(output) // Use 'output' which is cmd.CombinedOutput()
			if strings.Contains(errorMsg, "connection refused") {
				return fmt.Errorf("cannot connect to Kubernetes cluster - please ensure Kubernetes is enabled in Docker Desktop and the cluster is running")
			}
			return fmt.Errorf("kubectl apply failed: %v\nOutput: %s", err, errorMsg)
		}
	}

	return nil
}

func (s *Server) getProxyStatus(port int) ProxyStatus {
	// Check if port is responding (kubectl proxy returns various codes but we just need connectivity)
	cmd := exec.Command("curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
		fmt.Sprintf("http://localhost:%d/api/v1", port))
	output, err := cmd.Output()

	// Accept any HTTP response code as "running" - even errors mean the proxy is responding
	responseCode := strings.TrimSpace(string(output))
	isRunning := err == nil && responseCode != "" && responseCode != "000"

	status := ProxyStatus{
		IsRunning: isRunning,
		Port:      port,
	}

	// Try to get PID if running
	if isRunning {
		pidFile := fmt.Sprintf("/tmp/kubectl-proxy-%d.pid", port)
		if pidBytes, err := ioutil.ReadFile(pidFile); err == nil {
			status.PID = strings.TrimSpace(string(pidBytes))
		}
	}

	return status
}

func (s *Server) handleCreateCertificate(w http.ResponseWriter, r *http.Request) {
	var certData CertificateFormData
	if err := json.NewDecoder(r.Body).Decode(&certData); err != nil {
		s.sendError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Create self-signed issuer if needed
	if certData.IssuerType == "self-signed" {
		issuerYAML := `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
`
		if err := s.applyYAML(issuerYAML, "cluster-issuer"); err != nil {
			log.Printf("Warning: Failed to create self-signed issuer (might already exist): %v", err)
		}
	}

	// Generate certificate YAML
	yamlContent, err := s.generateCertificateYAML(certData)
	if err != nil {
		s.sendError(w, fmt.Sprintf("Failed to generate Certificate YAML: %v", err), http.StatusInternalServerError)
		return
	}

	if err := s.applyYAML(yamlContent, "certificate"); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to apply Certificate: %v", err), http.StatusInternalServerError)
		return
	}

	response := APIResponse{
		Success: true,
		Data:    fmt.Sprintf("Certificate %s created successfully in namespace %s", certData.Name, certData.Namespace),
	}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleListCertificates(w http.ResponseWriter, r *http.Request) {
	cmd := exec.Command("kubectl", "get", "certificates", "--all-namespaces", "-o", "json")
	output, err := cmd.Output()
	if err != nil {
		s.sendError(w, fmt.Sprintf("Failed to list certificates: %v", err), http.StatusInternalServerError)
		return
	}

	var kubeList struct {
		Items []struct {
			Metadata struct {
				Name              string `json:"name"`
				Namespace         string `json:"namespace"`
				CreationTimestamp string `json:"creationTimestamp"`
			} `json:"metadata"`
			Spec struct {
				DNSNames   []string `json:"dnsNames"`
				SecretName string   `json:"secretName"`
				IssuerRef  struct {
					Name string `json:"name"`
				} `json:"issuerRef"`
			} `json:"spec"`
			Status struct {
				Conditions []struct {
					Type   string `json:"type"`
					Status string `json:"status"`
				} `json:"conditions"`
				ExpirationTime string `json:"expirationTime,omitempty"`
			} `json:"status"`
		} `json:"items"`
	}

	if err := json.Unmarshal(output, &kubeList); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to parse certificate list: %v", err), http.StatusInternalServerError)
		return
	}

	var certificates []Certificate
	for _, item := range kubeList.Items {
		status := "pending"
		for _, condition := range item.Status.Conditions {
			if condition.Type == "Ready" && condition.Status == "True" {
				status = "ready"
				break
			}
		}

		cert := Certificate{
			Name:           item.Metadata.Name,
			Namespace:      item.Metadata.Namespace,
			SecretName:     item.Spec.SecretName,
			DNSNames:       item.Spec.DNSNames,
			Issuer:         item.Spec.IssuerRef.Name,
			Status:         status,
			ExpirationDate: item.Status.ExpirationTime,
			CreatedAt:      item.Metadata.CreationTimestamp,
		}
		certificates = append(certificates, cert)
	}

	response := APIResponse{Success: true, Data: certificates}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleDeleteCertificate(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	namespace := r.URL.Query().Get("namespace")

	if name == "" || namespace == "" {
		s.sendError(w, "Name and namespace parameters are required", http.StatusBadRequest)
		return
	}

	// Delete certificate
	cmd := exec.Command("kubectl", "delete", "certificate", name, "-n", namespace)
	if err := cmd.Run(); err != nil {
		s.sendError(w, fmt.Sprintf("Failed to delete certificate: %v", err), http.StatusInternalServerError)
		return
	}

	response := APIResponse{
		Success: true,
		Data:    fmt.Sprintf("Certificate %s deleted successfully from namespace %s", name, namespace),
	}
	json.NewEncoder(w).Encode(response)
}

func (s *Server) generateCertificateYAML(certData CertificateFormData) (string, error) {
	issuerKind := "ClusterIssuer"
	issuerName := "selfsigned-issuer"
	
	if certData.IssuerType == "ca-issuer" {
		issuerKind = "Issuer"
		issuerName = certData.IssuerName
	}

	dnsNamesYAML := ""
	for _, dns := range certData.DNSNames {
		dnsNamesYAML += fmt.Sprintf("  - %s\n", dns)
	}

	yamlTemplate := `apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: %s
  namespace: %s
spec:
  dnsNames:
%s  secretName: %s-tls
  issuerRef:
    name: %s
    kind: %s
`

	return fmt.Sprintf(yamlTemplate,
		certData.Name,
		certData.Namespace,
		dnsNamesYAML,
		certData.Name,
		issuerName,
		issuerKind,
	), nil
}

func (s *Server) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)
	response := APIResponse{Success: false, Error: message}
	json.NewEncoder(w).Encode(response)
}

func main() {
	server := NewServer()

	socketPath := "/run/guest-services/envoy-gateway-backend.sock"

	// Ensure the directory exists
	socketDir := filepath.Dir(socketPath)
	if err := os.MkdirAll(socketDir, 0755); err != nil {
		log.Printf("Warning: Could not create socket directory: %v", err)
	}

	// Remove existing socket file
	os.Remove(socketPath)

	log.Printf("Starting Envoy Gateway backend service on socket: %s", socketPath)

	// Create a Unix socket listener
	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatal("Failed to create Unix socket listener:", err)
	}
	defer listener.Close()

	// Set socket permissions
	if err := os.Chmod(socketPath, 0666); err != nil {
		log.Printf("Warning: Could not set socket permissions: %v", err)
	}

	if err := http.Serve(listener, server.router); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
