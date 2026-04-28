import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Route, Station } from '../../types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import inputStyles from '../../components/common/Input.module.css';

export const RoutesPanel: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [stops, setStops] = useState<{stationId: string, orderIndex: number}[]>([
    { stationId: '', orderIndex: 1 },
    { stationId: '', orderIndex: 2 }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [routesRes, stationsRes] = await Promise.all([
        api.get<Route[]>('/routes'),
        api.get<Station[]>('/stations')
      ]);
      setRoutes(routesRes.data);
      setStations(stationsRes.data);
    } catch (err) {
      setErrors(['Не вдалося завантажити дані']);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStop = () => {
    setStops([...stops, { stationId: '', orderIndex: stops.length + 1 }]);
  };

  const handleRemoveStop = (index: number) => {
    if (stops.length <= 2) return;
    const newStops = stops.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      orderIndex: i + 1
    }));
    setStops(newStops);
  };

  const handleStopChange = (index: number, stationId: string) => {
    const newStops = [...stops];
    newStops[index].stationId = stationId;
    setStops(newStops);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    
    // Validate
    if (stops.some(s => !s.stationId)) {
      setErrors(['Оберіть станції для всіх зупинок']);
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/routes', { stops });
      setStops([
        { stationId: '', orderIndex: 1 },
        { stationId: '', orderIndex: 2 }
      ]);
      fetchData();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Помилка при створенні маршруту']);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей маршрут?')) return;
    try {
      await api.delete(`/routes/${id}`);
      fetchData();
    } catch (err: any) {
      setErrors([err.response?.data?.error || 'Помилка при видаленні']);
    }
  };

  const getStationName = (id: string) => {
    const st = stations.find(s => s.id === id);
    return st ? `${st.name} (${st.city})` : id;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Управління маршрутами</h2>
      <ErrorMessage errors={errors} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Створити маршрут</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {stops.map((stop, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div className={inputStyles.wrapper} style={{ flex: 1, marginBottom: 0 }}>
                      <label className={inputStyles.label}>Зупинка {stop.orderIndex}</label>
                      <select 
                        className={inputStyles.select}
                        value={stop.stationId}
                        onChange={(e) => handleStopChange(index, e.target.value)}
                        required
                      >
                        <option value="">-- Оберіть станцію --</option>
                        {stations.map(st => (
                          <option key={st.id} value={st.id} disabled={stops.some((s, i) => i !== index && s.stationId === st.id)}>
                            {st.name} ({st.city})
                          </option>
                        ))}
                      </select>
                    </div>
                    {stops.length > 2 && (
                      <Button type="button" variant="danger" onClick={() => handleRemoveStop(index)}>
                        X
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={handleAddStop}>
                  + Додати зупинку
                </Button>
                <Button type="submit" isLoading={isCreating} style={{ flex: 1 }}>
                  Створити маршрут
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Список маршрутів ({routes.length})</h3>
            {isLoading ? (
              <p>Завантаження...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {routes.map(route => (
                  <div key={route.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>ID: {route.id.slice(0, 8)}...</strong>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(route.id)}>Видалити</Button>
                    </div>
                    <ol style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', margin: 0 }}>
                      {route.stops.sort((a, b) => a.orderIndex - b.orderIndex).map(stop => (
                        <li key={stop.stationId}>{getStationName(stop.stationId)}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
