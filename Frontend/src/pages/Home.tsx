import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };
  return <div>
    
  </div>;
}
