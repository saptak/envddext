import { GatewayFormData, GatewayValidationResult, ValidationError } from '../types/gateway';

/**
 * Validate Gateway form data
 * @param formData Gateway form data to validate
 * @returns Validation result with errors if any
 */
export const validateGatewayForm = (formData: GatewayFormData): GatewayValidationResult => {
  const errors: ValidationError[] = [];

  // Validate name
  if (!formData.name || formData.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Gateway name is required'
    });
  } else if (!isValidKubernetesName(formData.name)) {
    errors.push({
      field: 'name',
      message: 'Gateway name must be a valid Kubernetes resource name (lowercase alphanumeric and hyphens only)'
    });
  }

  // Validate namespace
  if (!formData.namespace || formData.namespace.trim() === '') {
    errors.push({
      field: 'namespace',
      message: 'Namespace is required'
    });
  } else if (!isValidKubernetesName(formData.namespace)) {
    errors.push({
      field: 'namespace',
      message: 'Namespace must be a valid Kubernetes namespace name'
    });
  }

  // Validate gateway class name
  if (!formData.gatewayClassName || formData.gatewayClassName.trim() === '') {
    errors.push({
      field: 'gatewayClassName',
      message: 'Gateway class name is required'
    });
  }

  // Validate listeners
  if (!formData.listeners || formData.listeners.length === 0) {
    errors.push({
      field: 'listeners',
      message: 'At least one listener is required'
    });
  } else {
    formData.listeners.forEach((listener, index) => {
      // Validate listener name
      if (!listener.name || listener.name.trim() === '') {
        errors.push({
          field: `listeners[${index}].name`,
          message: `Listener ${index + 1}: Name is required`
        });
      } else if (!isValidKubernetesName(listener.name)) {
        errors.push({
          field: `listeners[${index}].name`,
          message: `Listener ${index + 1}: Name must be a valid Kubernetes name`
        });
      }

      // Validate port
      if (!listener.port || listener.port < 1 || listener.port > 65535) {
        errors.push({
          field: `listeners[${index}].port`,
          message: `Listener ${index + 1}: Port must be between 1 and 65535`
        });
      }

      // Validate protocol
      if (!listener.protocol) {
        errors.push({
          field: `listeners[${index}].protocol`,
          message: `Listener ${index + 1}: Protocol is required`
        });
      }

      // Validate HTTPS specific fields
      if (listener.protocol === 'HTTPS') {
        if (!listener.tlsMode) {
          errors.push({
            field: `listeners[${index}].tlsMode`,
            message: `Listener ${index + 1}: TLS mode is required for HTTPS protocol`
          });
        }

        if (listener.tlsMode === 'Terminate' && !listener.certificateName) {
          errors.push({
            field: `listeners[${index}].certificateName`,
            message: `Listener ${index + 1}: Certificate name is required for TLS termination`
          });
        }
      }

      // Validate hostname if provided
      if (listener.hostname && !isValidHostname(listener.hostname)) {
        errors.push({
          field: `listeners[${index}].hostname`,
          message: `Listener ${index + 1}: Invalid hostname format`
        });
      }

      // Validate allowed route kinds
      if (!listener.allowedRouteKinds || listener.allowedRouteKinds.length === 0) {
        errors.push({
          field: `listeners[${index}].allowedRouteKinds`,
          message: `Listener ${index + 1}: At least one allowed route kind is required`
        });
      }
    });

    // Check for duplicate listener names
    const listenerNames = formData.listeners.map(l => l.name).filter(name => name);
    const duplicateNames = listenerNames.filter((name, index) => listenerNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push({
        field: 'listeners',
        message: `Duplicate listener names found: ${duplicateNames.join(', ')}`
      });
    }

    // Check for duplicate ports
    const listenerPorts = formData.listeners.map(l => l.port).filter(port => port);
    const duplicatePorts = listenerPorts.filter((port, index) => listenerPorts.indexOf(port) !== index);
    if (duplicatePorts.length > 0) {
      errors.push({
        field: 'listeners',
        message: `Duplicate listener ports found: ${duplicatePorts.join(', ')}`
      });
    }
  }

  // Validate labels if provided
  if (formData.labels) {
    Object.entries(formData.labels).forEach(([key, value]) => {
      if (!isValidKubernetesLabelKey(key)) {
        errors.push({
          field: 'labels',
          message: `Invalid label key: ${key}`
        });
      }
      if (!isValidKubernetesLabelValue(value)) {
        errors.push({
          field: 'labels',
          message: `Invalid label value for key ${key}: ${value}`
        });
      }
    });
  }

  // Validate annotations if provided
  if (formData.annotations) {
    Object.entries(formData.annotations).forEach(([key, value]) => {
      if (!isValidKubernetesAnnotationKey(key)) {
        errors.push({
          field: 'annotations',
          message: `Invalid annotation key: ${key}`
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if a string is a valid Kubernetes resource name
 * @param name Name to validate
 * @returns True if valid
 */
export const isValidKubernetesName = (name: string): boolean => {
  // Kubernetes names must be lowercase alphanumeric with hyphens
  // Must start and end with alphanumeric character
  // Maximum length is 253 characters
  const nameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
  return name.length <= 253 && nameRegex.test(name);
};

/**
 * Check if a string is a valid hostname
 * @param hostname Hostname to validate
 * @returns True if valid
 */
export const isValidHostname = (hostname: string): boolean => {
  // Basic hostname validation
  // Can include wildcards for Gateway API
  if (hostname.startsWith('*.')) {
    hostname = hostname.substring(2);
  }
  
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  return hostname.length <= 253 && hostnameRegex.test(hostname);
};

/**
 * Check if a string is a valid Kubernetes label key
 * @param key Label key to validate
 * @returns True if valid
 */
export const isValidKubernetesLabelKey = (key: string): boolean => {
  // Label keys can have an optional prefix separated by /
  const parts = key.split('/');
  if (parts.length > 2) return false;
  
  if (parts.length === 2) {
    const [prefix, name] = parts;
    // Prefix must be a valid DNS subdomain
    if (!isValidDNSSubdomain(prefix)) return false;
    return isValidLabelName(name);
  } else {
    return isValidLabelName(parts[0]);
  }
};

/**
 * Check if a string is a valid Kubernetes label value
 * @param value Label value to validate
 * @returns True if valid
 */
export const isValidKubernetesLabelValue = (value: string): boolean => {
  // Label values must be 63 characters or less
  // Must be empty or begin and end with alphanumeric character
  // Can contain hyphens, underscores, dots, and alphanumeric characters
  if (value === '') return true;
  if (value.length > 63) return false;
  
  const valueRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
  return valueRegex.test(value);
};

/**
 * Check if a string is a valid Kubernetes annotation key
 * @param key Annotation key to validate
 * @returns True if valid
 */
export const isValidKubernetesAnnotationKey = (key: string): boolean => {
  // Annotation keys follow the same rules as label keys but can be longer
  const parts = key.split('/');
  if (parts.length > 2) return false;
  
  if (parts.length === 2) {
    const [prefix, name] = parts;
    if (!isValidDNSSubdomain(prefix)) return false;
    return isValidAnnotationName(name);
  } else {
    return isValidAnnotationName(parts[0]);
  }
};

/**
 * Check if a string is a valid DNS subdomain
 * @param subdomain Subdomain to validate
 * @returns True if valid
 */
const isValidDNSSubdomain = (subdomain: string): boolean => {
  if (subdomain.length > 253) return false;
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
  return subdomainRegex.test(subdomain);
};

/**
 * Check if a string is a valid label name
 * @param name Label name to validate
 * @returns True if valid
 */
const isValidLabelName = (name: string): boolean => {
  if (name.length > 63) return false;
  const nameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
  return nameRegex.test(name);
};

/**
 * Check if a string is a valid annotation name
 * @param name Annotation name to validate
 * @returns True if valid
 */
const isValidAnnotationName = (name: string): boolean => {
  if (name.length > 63) return false;
  const nameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
  return nameRegex.test(name);
};

/**
 * Get validation error message for a specific field
 * @param errors Array of validation errors
 * @param field Field name to get error for
 * @returns Error message or undefined
 */
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  const error = errors.find(e => e.field === field);
  return error?.message;
};

/**
 * Check if a specific field has validation errors
 * @param errors Array of validation errors
 * @param field Field name to check
 * @returns True if field has errors
 */
export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some(e => e.field === field);
};
