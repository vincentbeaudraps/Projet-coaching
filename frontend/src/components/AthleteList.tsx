import { Athlete } from '../types/index';

interface AthleteListProps {
  athletes: Athlete[];
}

function AthleteList({ athletes }: AthleteListProps) {
  return (
    <div className="athlete-list">
      <h2>Your Athletes</h2>
      {athletes.length === 0 ? (
        <p>No athletes yet.</p>
      ) : (
        <div className="athletes-grid">
          {athletes.map((athlete) => (
            <div key={athlete.id} className="athlete-card">
              <h3>{athlete.name}</h3>
              <p>Email: {athlete.email}</p>
              <p>Age: {athlete.age || 'N/A'}</p>
              <p>Level: {athlete.level || 'N/A'}</p>
              <p>Goals: {athlete.goals || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AthleteList;
