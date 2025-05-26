import { HTTPRequest, CurlCommandOptions, HeaderPair } from '../types/httpClient';

/**
 * Utility functions for generating curl commands
 */

/**
 * Generate a curl command from an HTTP request
 */
export const generateCurlCommand = (
  request: HTTPRequest,
  options: CurlCommandOptions = {
    includeHeaders: true,
    includeVerbose: false,
    includeTiming: false,
    includeInsecure: false
  }
): string => {
  const parts: string[] = ['curl'];

  // Add method
  if (request.method !== 'GET') {
    parts.push('-X', request.method);
  }

  // Add verbose flag
  if (options.includeVerbose) {
    parts.push('-v');
  }

  // Add timing information
  if (options.includeTiming) {
    parts.push('-w', '"\\nTime: %{time_total}s\\nSize: %{size_download} bytes\\n"');
  }

  // Add insecure flag for HTTPS
  if (options.includeInsecure && request.url.startsWith('https://')) {
    parts.push('-k');
  }

  // Add headers
  if (options.includeHeaders) {
    Object.entries(request.headers).forEach(([key, value]) => {
      if (key && value) {
        parts.push('-H', `"${key}: ${value}"`);
      }
    });
  }

  // Add body for methods that support it
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const escapedBody = escapeForShell(request.body);
    parts.push('-d', `'${escapedBody}'`);
  }

  // Add URL (always last)
  parts.push(`"${request.url}"`);

  return parts.join(' ');
};

/**
 * Generate a formatted curl command with line breaks for readability
 */
export const generateFormattedCurlCommand = (
  request: HTTPRequest,
  options: CurlCommandOptions = {
    includeHeaders: true,
    includeVerbose: false,
    includeTiming: false,
    includeInsecure: false
  }
): string => {
  let command = 'curl';

  // Add method
  if (request.method !== 'GET') {
    command += ` \\\n  -X ${request.method}`;
  }

  // Add verbose flag
  if (options.includeVerbose) {
    command += ` \\\n  -v`;
  }

  // Add timing information
  if (options.includeTiming) {
    command += ` \\\n  -w "\\nTime: %{time_total}s\\nSize: %{size_download} bytes\\n"`;
  }

  // Add insecure flag for HTTPS
  if (options.includeInsecure && request.url.startsWith('https://')) {
    command += ` \\\n  -k`;
  }

  // Add headers
  if (options.includeHeaders) {
    Object.entries(request.headers).forEach(([key, value]) => {
      if (key && value) {
        command += ` \\\n  -H "${key}: ${value}"`;
      }
    });
  }

  // Add body for methods that support it
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const escapedBody = escapeForShell(request.body);
    command += ` \\\n  -d '${escapedBody}'`;
  }

  // Add URL (always last)
  command += ` \\\n  "${request.url}"`;

  return command;
};

/**
 * Generate curl command from header pairs
 */
export const generateCurlFromHeaderPairs = (
  method: string,
  url: string,
  headerPairs: HeaderPair[],
  body?: string,
  options?: CurlCommandOptions
): string => {
  const headers: Record<string, string> = {};
  
  headerPairs.forEach(pair => {
    if (pair.enabled && pair.key && pair.value) {
      headers[pair.key] = pair.value;
    }
  });

  const request: HTTPRequest = {
    method: method as any,
    url,
    headers,
    body
  };

  return generateFormattedCurlCommand(request, options);
};

/**
 * Parse a curl command to extract request details
 */
export const parseCurlCommand = (curlCommand: string): Partial<HTTPRequest> => {
  const request: Partial<HTTPRequest> = {
    method: 'GET',
    headers: {},
    body: undefined
  };

  // Remove line breaks and extra spaces
  const cleanCommand = curlCommand.replace(/\\\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Split into tokens
  const tokens = tokenizeCurlCommand(cleanCommand);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    switch (token) {
      case '-X':
      case '--request':
        if (i + 1 < tokens.length) {
          request.method = tokens[i + 1] as any;
          i++;
        }
        break;
        
      case '-H':
      case '--header':
        if (i + 1 < tokens.length) {
          const headerValue = tokens[i + 1];
          const colonIndex = headerValue.indexOf(':');
          if (colonIndex > 0) {
            const key = headerValue.substring(0, colonIndex).trim();
            const value = headerValue.substring(colonIndex + 1).trim();
            request.headers![key] = value;
          }
          i++;
        }
        break;
        
      case '-d':
      case '--data':
      case '--data-raw':
        if (i + 1 < tokens.length) {
          request.body = tokens[i + 1];
          i++;
        }
        break;
        
      default:
        // Check if it's a URL (last argument typically)
        if (token.startsWith('http://') || token.startsWith('https://')) {
          request.url = token;
        }
        break;
    }
  }

  return request;
};

/**
 * Escape string for shell usage
 */
const escapeForShell = (str: string): string => {
  return str.replace(/'/g, "'\"'\"'");
};

/**
 * Tokenize curl command respecting quotes
 */
const tokenizeCurlCommand = (command: string): string[] => {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes && char === ' ') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim());
  }
  
  return tokens.map(token => {
    // Remove surrounding quotes
    if ((token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1);
    }
    return token;
  });
};

/**
 * Generate curl command examples for common scenarios
 */
export const getCurlExamples = () => {
  return {
    get: {
      title: 'GET Request',
      command: 'curl -X GET "https://api.example.com/users"'
    },
    post: {
      title: 'POST with JSON',
      command: `curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John", "email": "john@example.com"}' \\
  "https://api.example.com/users"`
    },
    auth: {
      title: 'With Authorization',
      command: `curl -X GET \\
  -H "Authorization: Bearer your-token-here" \\
  "https://api.example.com/protected"`
    },
    verbose: {
      title: 'Verbose Output',
      command: `curl -v \\
  -w "\\nTime: %{time_total}s\\n" \\
  "https://api.example.com/health"`
    }
  };
};

/**
 * Validate curl command syntax
 */
export const validateCurlCommand = (command: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!command.trim()) {
    errors.push('Command cannot be empty');
    return { isValid: false, errors };
  }
  
  if (!command.trim().startsWith('curl')) {
    errors.push('Command must start with "curl"');
  }
  
  // Check for URL
  const urlPattern = /https?:\/\/[^\s]+/;
  if (!urlPattern.test(command)) {
    errors.push('Command must include a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
