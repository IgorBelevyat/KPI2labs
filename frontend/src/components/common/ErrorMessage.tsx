import React from 'react';

interface ErrorMessageProps {
  errors?: string[];
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      color: '#b91c1c',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #fecaca',
      marginBottom: '1rem',
      fontSize: '0.875rem'
    }}>
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {errors.map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </ul>
    </div>
  );
};
