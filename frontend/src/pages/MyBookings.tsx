import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchBookings = () => {
    api.get<Booking[]>('/bookings/my')
      .then(res => setBookings(res.data))
      .catch(() => setErrors(['Не вдалося завантажити ваші бронювання']))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Ви дійсно хочете скасувати це бронювання?')) return;
    
    setCancelingId(id);
    setErrors([]);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      fetchBookings(); // Перезавантажуємо список
    } catch (err: any) {
      if (err.response?.data?.error) {
        setErrors([err.response.data.error]);
      } else {
        setErrors(['Помилка при скасуванні']);
      }
    } finally {
      setCancelingId(null);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Завантаження...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Мої бронювання</h2>
      <ErrorMessage errors={errors} />

      {bookings.length === 0 ? (
        <Card className="text-center" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          У вас ще немає бронювань.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(booking => (
            <Card key={booking.id} style={{ opacity: booking.status === 'cancelled' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--color-primary)' }}>Потяг #{booking.train?.number}</h4>
                  <p style={{ margin: '0.25rem 0' }}>Місце: <strong>{booking.seat?.number}</strong></p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                    Дата: {booking.train?.departureTime && new Date(booking.train.departureTime).toLocaleDateString()}
                  </p>
                  <span style={{ 
                    display: 'inline-block', 
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    backgroundColor: booking.status === 'created' ? '#dcfce7' : '#fee2e2',
                    color: booking.status === 'created' ? '#166534' : '#991b1b'
                  }}>
                    {booking.status === 'created' ? 'Активне' : 'Скасовано'}
                  </span>
                </div>

                {booking.status === 'created' && (
                  <Button 
                    variant="danger" 
                    onClick={() => handleCancel(booking.id)}
                    isLoading={cancelingId === booking.id}
                  >
                    Скасувати
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
