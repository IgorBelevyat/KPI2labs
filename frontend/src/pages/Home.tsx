import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Station, Train } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { ErrorMessage } from '../components/common/ErrorMessage';
import styles from './Home.module.css';
import inputStyles from '../components/common/Input.module.css';

export const Home: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [date, setDate] = useState('');

  const [trains, setTrains] = useState<Train[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    api.get<Station[]>('/stations')
      .then(res => setStations(res.data))
      .catch(err => console.error('Failed to load stations', err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    setHasSearched(true);

    if (fromStation === toStation) {
      setErrors(['Станція відправлення і прибуття не можуть бути однаковими.']);
      setTrains([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<Train[]>('/trains/search', {
        params: {
          origin: fromStation,
          destination: toStation,
          date,
        }
      });
      setTrains(response.data);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Не вдалося знайти потяги.']);
      }
      setTrains([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Куди поїдемо сьогодні?</h1>
        <p>Швидке та зручне бронювання залізничних квитків</p>
      </div>

      <Card>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={inputStyles.wrapper} style={{ marginBottom: 0 }}>
            <label className={inputStyles.label}>Звідки</label>
            <select
              value={fromStation}
              onChange={e => setFromStation(e.target.value)}
              required
              className={inputStyles.select}
            >
              <option value="">Оберіть станцію</option>
              {stations.filter(s => s.id !== toStation).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className={inputStyles.wrapper} style={{ marginBottom: 0 }}>
            <label className={inputStyles.label}>Куди</label>
            <select
              value={toStation}
              onChange={e => setToStation(e.target.value)}
              required
              className={inputStyles.select}
            >
              <option value="">Оберіть станцію</option>
              {stations.filter(s => s.id !== fromStation).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <Input
            label="Дата поїздки"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
            style={{ marginBottom: 0 }}
          />

          <Button type="submit" size="lg" isLoading={isLoading}>
            Знайти квитки
          </Button>
        </form>
      </Card>

      <ErrorMessage errors={errors} />

      <div style={{ marginTop: '2rem' }}>
        {hasSearched && !isLoading && trains.length === 0 && errors.length === 0 && (
          <div className={styles.noResults}>
            <h3>Потягів не знайдено</h3>
            <p>Спробуйте змінити дату або маршрут пошуку.</p>
          </div>
        )}

        {trains.length > 0 && (
          <div className={styles.results}>
            <h3 style={{ marginBottom: '1rem' }}>Знайдено потягів: {trains.length}</h3>
            {trains.map(train => (
              <Card key={train.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>Потяг #{train.number}</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Дата: {new Date(train.departureTime).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{new Date(train.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Відправлення</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{new Date(train.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Прибуття</div>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => window.location.href = `/trains/${train.id}/book`}>
                    Вибрати місця
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
