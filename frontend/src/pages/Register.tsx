import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { AuthResponse } from '../types';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
      login(response.data.accessToken, response.data.refreshToken, response.data.user);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Виникла невідома помилка під час реєстрації.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Реєстрація</h2>
      <ErrorMessage errors={errors} />
      <form onSubmit={handleSubmit}>
        <Input
          label="Ім'я"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Іван Іванов"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Мінімум 6 символів"
          required
        />
        <Button type="submit" fullWidth isLoading={isLoading} style={{ marginTop: '1rem' }}>
          Зареєструватися
        </Button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        Вже маєте акаунт? <Link to="/login">Увійти</Link>
      </p>
    </div>
  );
};
