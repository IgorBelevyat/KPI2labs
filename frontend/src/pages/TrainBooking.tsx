import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Carriage, Seat, Train } from '../types';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export const TrainBooking: React.FC = () => {
  const { trainId } = useParams<{ trainId: string }>();
  const [carriages, setCarriages] = useState<Carriage[]>([]);
  const [train, setTrain] = useState<Train | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get<Carriage[]>(`/trains/${trainId}/seats`),
      api.get<Train[]>('/trains'),
    ])
      .then(([seatsRes, trainsRes]) => {
        setCarriages(seatsRes.data);
        const found = trainsRes.data.find(t => t.id === trainId);
        if (found) setTrain(found);
      })
      .catch(() => {
        setErrors(['Не вдалося завантажити інформацію про місця']);
      })
      .finally(() => setIsLoading(false));
  }, [trainId]);

  const handleBook = async () => {
    if (!selectedSeat) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsBooking(true);
    setErrors([]);
    try {
      const travelDate = train?.departureTime || new Date().toISOString();
      await api.post('/bookings', { trainId, seatId: selectedSeat.id, travelDate });
      navigate('/my-bookings');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Не вдалося забронювати місце']);
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Завантаження місць...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Вибір місця</h2>
      <ErrorMessage errors={errors} />

      {carriages.length === 0 ? (
        <p>У цьому потязі немає вагонів.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {carriages.map(carriage => (
            <div key={carriage.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Вагон #{carriage.number} ({carriage.type})</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {carriage.seats.sort((a, b) => a.number - b.number).map(seat => {
                  const isSelected = selectedSeat?.id === seat.id;
                  
                  return (
                    <button
                      key={seat.id}
                      disabled={seat.isBooked}
                      onClick={() => setSelectedSeat(seat)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: seat.isBooked ? '#f1f5f9' : isSelected ? 'var(--color-primary-light)' : 'white',
                        color: seat.isBooked ? '#94a3b8' : 'var(--color-text-main)',
                        cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                      title={seat.isBooked ? 'Зайнято' : 'Вільно'}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSeat && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>Вибрано місце: {selectedSeat.number}</h4>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{isAuthenticated ? 'Натисніть для підтвердження' : 'Увійдіть, щоб забронювати'}</p>
          </div>
          <Button onClick={handleBook} isLoading={isBooking}>
            Забронювати
          </Button>
        </div>
      )}
    </div>
  );
};
