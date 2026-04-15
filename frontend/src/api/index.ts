import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Unpack data envelopes from Spring Boot ApiResponse
    if (response.data && 'success' in response.data) {
      if (!response.data.success) {
        return Promise.reject(response.data.error || new Error('Request failed'));
      }
      // Return the inner data
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Wait, backend intercepts at 403 globally for stateless JWT filter if invalid.
    // If it returns 401 or 403 because token is expired. Let's assume typical 401.
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Force a raw axios call to bypass interceptors
        const res = await axios.post('http://localhost:8081/api/auth/refresh', { refreshToken });
        
        const data = res.data;
        if (!data.success) throw new Error('Refresh failed');
        
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        
        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    // Extract actual backend error properly
    if (error.response?.data?.error?.message) {
      return Promise.reject(new Error(error.response.data.error.message));
    }

    return Promise.reject(error);
  }
);

export default api;
