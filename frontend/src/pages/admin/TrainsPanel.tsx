import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Train, Route } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import inputStyles from '../../components/common/Input.module.css';

export const TrainsPanel: React.FC = () => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Train form
  const [trainNumber, setTrainNumber] = useState('');
  const [routeId, setRouteId] = useState('');
  const [date, setDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [isCreatingTrain, setIsCreatingTrain] = useState(false);

  // Carriage form
  const [selectedTrainId, setSelectedTrainId] = useState('');
  const [carriageNumber, setCarriageNumber] = useState(1);
  const [carriageType, setCarriageType] = useState('coupe');
  const [seatsCount, setSeatsCount] = useState(36);
  const [isCreatingCarriage, setIsCreatingCarriage] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [trainsRes, routesRes] = await Promise.all([
        api.get<Train[]>('/trains'),
        api.get<Route[]>('/routes')
      ]);
      setTrains(trainsRes.data);
      setRoutes(routesRes.data);
    } catch (err) {
      setErrors(['Не вдалося завантажити дані']);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsCreatingTrain(true);

    // Збираємо дату та час разом
    // date: "2026-05-01"
    // departureTime: "14:30"
    // arrivalTime: "22:00"
    const deptIso = new Date(`${date}T${departureTime}:00`).toISOString();
    // Якщо час прибуття менший за час відправлення, значить потяг прибуває наступного дня
    const arrDate = new Date(`${date}T${arrivalTime}:00`);
    if (arrDate < new Date(`${date}T${departureTime}:00`)) {
      arrDate.setDate(arrDate.getDate() + 1);
    }
    const arrIso = arrDate.toISOString();

    try {
      await api.post('/trains', {
        number: trainNumber,
        routeId,
        departureTime: deptIso,
        arrivalTime: arrIso
      });
      setTrainNumber('');
      setRouteId('');
      setDate('');
      setDepartureTime('');
      setArrivalTime('');
      fetchData();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Помилка при створенні потягу']);
      }
    } finally {
      setIsCreatingTrain(false);
    }
  };

  const handleCreateCarriage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsCreatingCarriage(true);

    try {
      await api.post(`/trains/${selectedTrainId}/carriages`, {
        number: Number(carriageNumber),
        type: carriageType,
        seatCount: Number(seatsCount)
      });
      setCarriageNumber(prev => prev + 1);
      alert('Вагон успішно додано!');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Помилка при створенні вагону']);
      }
    } finally {
      setIsCreatingCarriage(false);
    }
  };

  const handleDeleteTrain = async (id: string) => {
    if (!window.confirm('Видалити потяг? Всі пов\'язані вагони, місця та бронювання будуть видалені!')) return;
    try {
      await api.delete(`/trains/${id}`);
      fetchData();
    } catch (err: any) {
      setErrors([err.response?.data?.error || 'Помилка видалення']);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Управління потягами</h2>
      <ErrorMessage errors={errors} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Додавання потягу */}
        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Створити потяг</h3>
          <form onSubmit={handleCreateTrain}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Номер потягу" value={trainNumber} onChange={e => setTrainNumber(e.target.value)} required placeholder="712К" />
              
              <div className={inputStyles.wrapper}>
                <label className={inputStyles.label}>Маршрут</label>
                <select className={inputStyles.select} value={routeId} onChange={e => setRouteId(e.target.value)} required>
                  <option value="">Оберіть маршрут</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>Route {r.id.slice(0,8)} ({r.stops.length} зупинок)</option>
                  ))}
                </select>
              </div>
            </div>

            <Input label="Дата відправлення" type="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Час відправлення" type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} required />
              <Input label="Час прибуття" type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} required />
            </div>

            <Button type="submit" fullWidth isLoading={isCreatingTrain} style={{ marginTop: '1rem' }}>
              Створити потяг
            </Button>
          </form>
        </Card>

        {/* Додавання вагонів */}
        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Додати вагон до потягу</h3>
          <form onSubmit={handleCreateCarriage}>
            <div className={inputStyles.wrapper}>
              <label className={inputStyles.label}>Потяг</label>
              <select className={inputStyles.select} value={selectedTrainId} onChange={e => setSelectedTrainId(e.target.value)} required>
                <option value="">Оберіть потяг</option>
                {trains.map(t => (
                  <option key={t.id} value={t.id}>#{t.number} ({new Date(t.departureTime).toLocaleDateString()})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Порядковий номер" type="number" value={carriageNumber} onChange={e => setCarriageNumber(Number(e.target.value))} required min={1} />
              
              <div className={inputStyles.wrapper}>
                <label className={inputStyles.label}>Тип вагону</label>
                <select className={inputStyles.select} value={carriageType} onChange={e => setCarriageType(e.target.value)} required>
                  <option value="coupe">Купе</option>
                  <option value="platskart">Плацкарт</option>
                  <option value="sv">СВ / Люкс</option>
                </select>
              </div>
            </div>

            <Input label="Кількість місць" type="number" value={seatsCount} onChange={e => setSeatsCount(Number(e.target.value))} required min={10} max={100} />

            <Button type="submit" fullWidth isLoading={isCreatingCarriage} style={{ marginTop: '1rem' }}>
              Додати вагон
            </Button>
          </form>
        </Card>
      </div>

      {/* Список потягів */}
      <Card>
        <h3 style={{ marginBottom: '1rem' }}>Список потягів ({trains.length})</h3>
        {isLoading ? <p>Завантаження...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {trains.map(train => (
              <div key={train.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>Потяг #{train.number}</strong>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteTrain(train.id)}>Видалити</Button>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <p><strong>Дата:</strong> {new Date(train.departureTime).toLocaleDateString()}</p>
                  <p><strong>Відпр:</strong> {new Date(train.departureTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  <p><strong>Приб:</strong> {new Date(train.arrivalTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  <p><strong>ID маршруту:</strong> {train.routeId.slice(0, 8)}...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
