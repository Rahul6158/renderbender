/**
 * Checker engine for Render and Supabase services.
 * Runs in Node.js serverless runtime (no browser CORS constraints).
 */

export async function checkRenderService(service) {
  if (!service.url) {
    return {
      status: 'Not Configured',
      status_code: null,
      latency_ms: 0,
      is_cold_start: false,
      response_preview: 'No backend URL configured.',
      error_message: null,
    };
  }

  let rawUrl = service.url.trim();
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }

  let fullUrl = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const endpoint = service.endpoint ? service.endpoint.trim() : '';

    // If user already pasted a path in the URL (e.g. https://domain.com/health)
    if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname !== '') {
      if (!endpoint || endpoint === '/' || endpoint === parsed.pathname) {
        fullUrl = parsed.origin + parsed.pathname;
      } else {
        // If endpoint is explicitly given and different, append cleanly
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        fullUrl = `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}${cleanEndpoint}`;
      }
    } else if (endpoint) {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      fullUrl = `${parsed.origin}${cleanEndpoint}`;
    }
  } catch {
    // Fallback simple string concatenation
    if (service.endpoint) {
      const cleanEndpoint = service.endpoint.startsWith('/') ? service.endpoint : `/${service.endpoint}`;
      fullUrl = `${rawUrl.replace(/\/+$/, '')}${cleanEndpoint}`;
    }
  }

  const timeoutMs = (service.timeout_seconds || 30) * 1000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = performance.now();
  try {
    const response = await fetch(fullUrl, {
      method: service.method || 'GET',
      headers: {
        'User-Agent': 'Render-KeepAlive-Monitor/1.0',
        Accept: 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - startTime);
    const expectedStatus = service.expected_status || 200;

    let responseText = '';
    try {
      responseText = await response.text();
    } catch {
      responseText = '[Unable to read body]';
    }

    // Determine status & cold-start
    const isSuccess = response.status === expectedStatus || (response.status >= 200 && response.status < 300);
    // If latency is unusually high (e.g. > 1500ms on a 200 OK), suspect cold start
    const isColdStart = isSuccess && latencyMs > 1500;

    let status = 'Healthy';
    if (isColdStart) {
      status = 'Healthy (Cold Start Suspected)';
    } else if (isSuccess) {
      status = 'Healthy';
    } else {
      status = `Unhealthy (HTTP ${response.status})`;
    }

    return {
      status,
      status_code: response.status,
      latency_ms: latencyMs,
      is_cold_start: isColdStart,
      response_preview: responseText.slice(0, 1000),
      error_message: isSuccess ? null : `Expected HTTP ${expectedStatus}, received ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    const isTimeout = error.name === 'AbortError';

    return {
      status: 'Unreachable',
      status_code: isTimeout ? 408 : null,
      latency_ms: latencyMs,
      is_cold_start: false,
      response_preview: null,
      error_message: isTimeout
        ? `Request timed out after ${service.timeout_seconds || 30}s`
        : error.message || 'Connection failed',
    };
  }
}

export async function checkSupabaseService(service) {
  if (!service.url) {
    return {
      status: 'Not Configured',
      status_code: null,
      latency_ms: 0,
      is_cold_start: false,
      response_preview: 'No Supabase Project URL configured.',
      error_message: null,
    };
  }

  let baseUrl = service.url.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  // Ping REST API root
  const pingUrl = `${baseUrl}/rest/v1/`;
  const timeoutMs = (service.timeout_seconds || 30) * 1000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'User-Agent': 'Supabase-Connectivity-Monitor/1.0',
    Accept: 'application/json, */*',
  };

  if (service.api_key) {
    headers['apikey'] = service.api_key.trim();
    headers['Authorization'] = `Bearer ${service.api_key.trim()}`;
  }

  const startTime = performance.now();
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - startTime);

    let responseText = '';
    try {
      responseText = await response.text();
    } catch {
      responseText = '[Unable to read body]';
    }

    let status = 'Connected';
    if (response.status === 401 || response.status === 403) {
      status = 'Auth Failed';
    } else if (response.status >= 200 && response.status < 400) {
      status = latencyMs > 1500 ? 'Connected (Slow)' : 'Connected';
    } else if (response.status === 404) {
      // 404 on /rest/v1/ without swagger enabled still confirms server reachability
      status = 'Connected';
    } else {
      status = `Error (HTTP ${response.status})`;
    }

    return {
      status,
      status_code: response.status,
      latency_ms: latencyMs,
      is_cold_start: false,
      response_preview: responseText.slice(0, 1000),
      error_message: response.status >= 400 && response.status !== 404 ? `HTTP ${response.status} response` : null,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    const isTimeout = error.name === 'AbortError';

    return {
      status: 'Unreachable',
      status_code: isTimeout ? 408 : null,
      latency_ms: latencyMs,
      is_cold_start: false,
      response_preview: null,
      error_message: isTimeout
        ? `Request timed out after ${service.timeout_seconds || 30}s`
        : error.message || 'Connection failed',
    };
  }
}
