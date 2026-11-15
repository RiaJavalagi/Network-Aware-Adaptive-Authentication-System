import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Health
export async function getHealthStatus() {
  const startTime = performance.now();
  const response = await api.get('/health');
  const latencyMs = Math.round(performance.now() - startTime);
  return { data: response.data, latencyMs };
}

// Authentication
export async function registerUser(username, email, password) {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
}

export async function loginUser(usernameOrEmail, password, simulatedIp = null) {
  const payload = {
    username_or_email: usernameOrEmail,
    password,
  };
  if (simulatedIp) {
    payload.simulated_ip = simulatedIp;
  }
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function verifyTotpLogin(challengeToken, otpCode) {
  const response = await api.post('/auth/verify-totp', {
    challenge_token: challengeToken,
    otp_code: otpCode,
  });
  return response.data;
}

export async function logoutUser() {
  const response = await api.post('/auth/logout');
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

// TOTP Management
export async function setupTotp() {
  const response = await api.post('/totp/setup');
  return response.data;
}

export async function confirmTotp(secret, otpCode) {
  const response = await api.post('/totp/confirm', { secret, otp_code: otpCode });
  return response.data;
}

export async function disableTotp(password) {
  const response = await api.post('/totp/disable', { password });
  return response.data;
}

// Devices
export async function getDevices() {
  const response = await api.get('/devices');
  return response.data;
}

export async function setDeviceTrust(deviceId, trusted) {
  const response = await api.post('/devices/trust', { device_id: deviceId, trusted });
  return response.data;
}

export async function revokeDevice(deviceId) {
  const response = await api.delete(`/devices/${deviceId}`);
  return response.data;
}

// Network Monitoring
export async function getNetworkEvents(limit = 50, severity = null) {
  const params = { limit };
  if (severity) params.severity = severity;
  const response = await api.get('/network/events', { params });
  return response.data;
}

export async function getNetworkSummary() {
  const response = await api.get('/network/summary');
  return response.data;
}

export async function getNetworkActivity(hours = 24) {
  const response = await api.get('/network/activity', { params: { hours } });
  return response.data;
}

// Risk Analysis
export async function getRiskHistory(limit = 50, level = null) {
  const params = { limit };
  if (level) params.level = level;
  const response = await api.get('/risk/history', { params });
  return response.data;
}

export async function getRiskAssessment(id) {
  const response = await api.get(`/risk/assessment/${id}`);
  return response.data;
}

// Security Overview & Audit
export async function getSecurityOverview() {
  const response = await api.get('/security/overview');
  return response.data;
}

export async function getSecurityEvents(limit = 50, severity = null) {
  const params = { limit };
  if (severity) params.severity = severity;
  const response = await api.get('/security/events', { params });
  return response.data;
}

// Attack Simulation
export async function runSimulation(scenario) {
  const response = await api.post('/simulation/run', { scenario });
  return response.data;
}

// Evaluation & Benchmarking
export async function getEvaluationMetrics() {
  const response = await api.get('/evaluation/metrics');
  return response.data;
}

export default api;
