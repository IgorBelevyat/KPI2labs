import axios from 'axios';

// Створюємо інстанс axios з базовим URL
export const api = axios.create({
  baseURL: '/api', // Vite proxy перенаправить це на http://localhost:3000/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додаємо токен до кожного запиту, якщо він є
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехоплюємо відповіді для обробки помилок 401 (Unauthorized) та автоматичного рефрешу токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Якщо помилка 401 і ми ще не пробували оновити токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Робимо запит на оновлення токена
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        
        const newAccessToken = response.data.accessToken;
        
        // Зберігаємо новий токен
        localStorage.setItem('accessToken', newAccessToken);

        // Повторюємо оригінальний запит з новим токеном
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Якщо рефреш не вдався (наприклад, токен протух)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Перенаправляємо на сторінку логіну (через event або window.location)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Повертаємо помилку для обробки в компонентах (зокрема 400 Bad Request)
    return Promise.reject(error);
  }
);
