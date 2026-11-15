import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

/**
 * Check backend system health and connectivity.
 * @returns {Promise<{data: any, latencyMs: number}>}
 */
export async function getHealthStatus() {
  const startTime = performance.now();
  const response = await api.get('/health');
  const latencyMs = Math.round(performance.now() - startTime);
  return {
    data: response.data,
    latencyMs,
  };
}

export default api;
