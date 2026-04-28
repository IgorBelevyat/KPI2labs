import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Station } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export const StationsPanel: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Create form state
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchStations = () => {
    setIsLoading(true);
    api.get<Station[]>('/stations')
      .then(res => setStations(res.data))
      .catch(() => setErrors(['Не вдалося завантажити список станцій']))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsCreating(true);

    try {
      await api.post('/stations', { name: newName, city: newCity });
      setNewName('');
      setNewCity('');
      fetchStations();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Помилка при створенні станції']);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю станцію?')) return;
    
    try {
      await api.delete(`/stations/${id}`);
      fetchStations();
    } catch (err: any) {
      if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Помилка при видаленні станції']);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Управління станціями</h2>
      <ErrorMessage errors={errors} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Create Form */}
        <div>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Додати станцію</h3>
            <form onSubmit={handleCreate}>
              <Input
                label="Назва станції"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Київ-Пасажирський"
                required
              />
              <Input
                label="Місто"
                value={newCity}
                onChange={e => setNewCity(e.target.value)}
                placeholder="Київ"
                required
              />
              <Button type="submit" fullWidth isLoading={isCreating}>
                Створити
              </Button>
            </form>
          </Card>
        </div>

        {/* List */}
        <div>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Список станцій ({stations.length})</h3>
            {isLoading ? (
              <p>Завантаження...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stations.map(station => (
                  <div key={station.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{station.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{station.city}</div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(station.id)}>
                      Видалити
                    </Button>
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
