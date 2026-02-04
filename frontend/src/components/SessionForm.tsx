import React, { useState } from 'react';
import { Athlete } from '../types/index';

interface SessionFormProps {
  onSessionCreated: (data: any) => void;
  athletes: Athlete[];
}

function SessionForm({ onSessionCreated, athletes }: SessionFormProps) {
  const [formData, setFormData] = useState({
    athleteId: '',
    title: '',
    description: '',
    type: 'easy',
    distance: '',
    duration: '',
    intensity: 'easy',
    startDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.athleteId && formData.title && formData.duration && formData.startDate) {
      await onSessionCreated({
        ...formData,
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        duration: parseInt(formData.duration),
      });
      setFormData({
        athleteId: '',
        title: '',
        description: '',
        type: 'easy',
        distance: '',
        duration: '',
        intensity: 'easy',
        startDate: '',
      });
    }
  };

  return (
    <form className="session-form" onSubmit={handleSubmit}>
      <h3>Create Training Session</h3>
      <select
        name="athleteId"
        value={formData.athleteId}
        onChange={handleChange}
        required
      >
        <option value="">Select an athlete</option>
        {athletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="title"
        placeholder="Session Title"
        value={formData.title}
        onChange={handleChange}
        required
      />

      <textarea
        name="description"
        placeholder="Session Description"
        value={formData.description}
        onChange={handleChange}
      />

      <select name="type" value={formData.type} onChange={handleChange}>
        <option value="easy">Easy</option>
        <option value="tempo">Tempo</option>
        <option value="interval">Interval</option>
        <option value="long">Long Run</option>
        <option value="recovery">Recovery</option>
      </select>

      <input
        type="number"
        name="distance"
        placeholder="Distance (km)"
        value={formData.distance}
        onChange={handleChange}
        step="0.1"
      />

      <input
        type="number"
        name="duration"
        placeholder="Duration (minutes)"
        value={formData.duration}
        onChange={handleChange}
        required
      />

      <select name="intensity" value={formData.intensity} onChange={handleChange}>
        <option value="easy">Easy</option>
        <option value="moderate">Moderate</option>
        <option value="hard">Hard</option>
        <option value="very-hard">Very Hard</option>
      </select>

      <input
        type="datetime-local"
        name="startDate"
        value={formData.startDate}
        onChange={handleChange}
        required
      />

      <button type="submit">Create Session</button>
    </form>
  );
}

export default SessionForm;
