import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { athletesService, sessionsService } from '../services/api';
import Header from '../components/Header';
import '../styles/SessionBuilder.css';

interface Athlete {
  id: string;
  user_name: string;
}

interface SessionBlock {
  id: string;
  type: 'warmup' | 'work' | 'cooldown' | 'interval' | 'tempo' | 'endurance';
  duration?: number; // en minutes
  distance?: number; // en km
  intensity: 'recovery' | 'easy' | 'moderate' | 'threshold' | 'tempo' | 'vo2max' | 'sprint';
  pace?: string; // ex: "5:00-5:15"
  heartRate?: string; // ex: "140-150"
  description: string;
  repetitions?: number; // pour les intervalles
  recoveryTime?: number; // temps de récup entre répétitions (en minutes)
}

interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<SessionBlock, 'id'>[];
}

function SessionBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Si on édite une séance existante
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [sessionType, setSessionType] = useState<'run' | 'trail' | 'recovery'>('run');
  const [blocks, setBlocks] = useState<SessionBlock[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [globalNotes, setGlobalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);

  // Templates pré-définis
  const templates: SessionTemplate[] = [
    {
      id: 'endurance',
      name: 'Sortie endurance fondamentale',
      description: 'Volume à faible intensité - Base aérobie',
      blocks: [
        {
          type: 'warmup',
          duration: 10,
          intensity: 'easy',
          description: 'Échauffement progressif en aisance respiratoire'
        },
        {
          type: 'endurance',
          duration: 50,
          intensity: 'easy',
          pace: '5:30-6:00',
          heartRate: '130-145',
          description: 'Endurance fondamentale - Confort respiratoire, capable de parler'
        },
        {
          type: 'cooldown',
          duration: 10,
          intensity: 'recovery',
          description: 'Retour au calme en trottinant'
        }
      ]
    },
    {
      id: 'threshold',
      name: 'Seuil lactique',
      description: 'Travail au seuil - Méthode américaine/nordique',
      blocks: [
        {
          type: 'warmup',
          duration: 20,
          intensity: 'easy',
          description: 'Échauffement progressif + 3-4 lignes droites'
        },
        {
          type: 'tempo',
          duration: 25,
          intensity: 'threshold',
          pace: '4:20-4:30',
          heartRate: '165-175',
          description: 'Allure seuil - Effort soutenu mais contrôlé'
        },
        {
          type: 'cooldown',
          duration: 15,
          intensity: 'easy',
          description: 'Retour au calme progressif'
        }
      ]
    },
    {
      id: 'intervals',
      name: 'Intervalles courts VMA',
      description: 'Développement de la vitesse maximale aérobie',
      blocks: [
        {
          type: 'warmup',
          duration: 20,
          intensity: 'easy',
          description: 'Échauffement + éducatifs + 4 lignes droites'
        },
        {
          type: 'interval',
          duration: 3,
          intensity: 'vo2max',
          pace: '3:45-3:55',
          heartRate: '180-190',
          description: 'Effort intense à VMA',
          repetitions: 8,
          recoveryTime: 2
        },
        {
          type: 'cooldown',
          duration: 15,
          intensity: 'easy',
          description: 'Retour au calme en trottinant'
        }
      ]
    },
    {
      id: 'long_run',
      name: 'Sortie longue',
      description: 'Développement de l\'endurance - Prépa marathon/trail',
      blocks: [
        {
          type: 'warmup',
          duration: 15,
          intensity: 'easy',
          description: 'Démarrage très progressif'
        },
        {
          type: 'endurance',
          duration: 90,
          distance: 18,
          intensity: 'moderate',
          pace: '5:00-5:20',
          heartRate: '145-160',
          description: 'Allure confortable, gérer l\'effort sur la durée'
        },
        {
          type: 'cooldown',
          duration: 10,
          intensity: 'easy',
          description: 'Retour au calme'
        }
      ]
    },
    {
      id: 'fartlek',
      name: 'Fartlek (jeu de vitesse)',
      description: 'Variations d\'allures - Travail fun et varié',
      blocks: [
        {
          type: 'warmup',
          duration: 15,
          intensity: 'easy',
          description: 'Échauffement progressif'
        },
        {
          type: 'work',
          duration: 40,
          intensity: 'tempo',
          description: 'Alternance libre: 2min rapide / 2min lente x10. Adapter au ressenti et au terrain'
        },
        {
          type: 'cooldown',
          duration: 10,
          intensity: 'easy',
          description: 'Retour au calme'
        }
      ]
    },
    {
      id: 'recovery',
      name: 'Récupération active',
      description: 'Footing léger pour favoriser la récupération',
      blocks: [
        {
          type: 'endurance',
          duration: 30,
          intensity: 'recovery',
          pace: '6:00-6:30',
          heartRate: '120-135',
          description: 'Footing très facile, rester en-dessous de 75% FCMax'
        }
      ]
    }
  ];

  useEffect(() => {
    loadAthletes();
    // TODO: Si id existe, charger la séance pour édition
  }, [id]);

  useEffect(() => {
    calculateEstimates();
  }, [blocks]);

  const loadAthletes = async () => {
    try {
      const response = await athletesService.getAll();
      setAthletes(response.data);
    } catch (error) {
      console.error('Erreur chargement athlètes:', error);
    }
  };

  const calculateEstimates = () => {
    const totalDuration = blocks.reduce((sum, block) => {
      const blockDuration = block.duration || 0;
      const reps = block.repetitions || 1;
      const recovery = block.recoveryTime || 0;
      return sum + (blockDuration * reps) + (recovery * (reps - 1));
    }, 0);

    const totalDistance = blocks.reduce((sum, block) => {
      return sum + (block.distance || 0);
    }, 0);

    setEstimatedDuration(totalDuration);
    setEstimatedDistance(totalDistance);
  };

  const addBlock = () => {
    const newBlock: SessionBlock = {
      id: Date.now().toString(),
      type: 'work',
      duration: 20,
      intensity: 'moderate',
      description: ''
    };
    setBlocks([...blocks, newBlock]);
  };

  const duplicateBlock = (index: number) => {
    const blockToDuplicate = blocks[index];
    const newBlock: SessionBlock = {
      ...blockToDuplicate,
      id: Date.now().toString()
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlock = (index: number, field: keyof SessionBlock, value: any) => {
    const newBlocks = [...blocks];
    (newBlocks[index] as any)[field] = value;
    setBlocks(newBlocks);
  };

  const applyTemplate = (template: SessionTemplate) => {
    const newBlocks: SessionBlock[] = template.blocks.map((block, index) => ({
      ...block,
      id: `${Date.now()}-${index}`
    }));
    setBlocks(newBlocks);
    setTitle(template.name);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || blocks.length === 0) {
      alert('Veuillez sélectionner un athlète et ajouter au moins un bloc d\'entraînement');
      return;
    }

    setLoading(true);
    try {
      // Convertir la date en format ISO avec horaire 08:00
      const sessionDateTime = new Date(date + 'T08:00:00').toISOString();
      
      // Préparer les données de la séance
      const sessionData = {
        athleteId: selectedAthlete,
        title,
        description: globalNotes || `Séance créée avec ${blocks.length} blocs`,
        type: sessionType,
        distance: estimatedDistance,
        duration: estimatedDuration,
        intensity: blocks.length > 0 ? blocks[0].intensity : 'moderate',
        startDate: sessionDateTime,
        blocks: JSON.stringify(blocks),
        notes: globalNotes
      };

      console.log('Envoi des données:', sessionData);
      await sessionsService.create(sessionData);
      
      alert('Séance créée avec succès !');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur création séance:', error);
      alert('Erreur lors de la création de la séance');
    } finally {
      setLoading(false);
    }
  };

  const getIntensityLabel = (intensity: SessionBlock['intensity']) => {
    const labels = {
      recovery: 'Récupération',
      easy: 'Facile',
      moderate: 'Modéré',
      threshold: 'Seuil',
      tempo: 'Tempo',
      vo2max: 'VMA',
      sprint: 'Sprint'
    };
    return labels[intensity];
  };

  const getIntensityColor = (intensity: SessionBlock['intensity']) => {
    const colors = {
      recovery: '#4caf50',
      easy: '#8bc34a',
      moderate: '#ffc107',
      threshold: '#ff9800',
      tempo: '#ff5722',
      vo2max: '#f44336',
      sprint: '#9c27b0'
    };
    return colors[intensity];
  };

  const getBlockTypeLabel = (type: SessionBlock['type']) => {
    const labels = {
      warmup: '🔥 Échauffement',
      work: '💪 Travail',
      cooldown: '❄️ Retour au calme',
      interval: '⚡ Intervalles',
      tempo: '🎯 Tempo',
      endurance: '🏃 Endurance'
    };
    return labels[type];
  };

  return (
    <div className="session-builder-container">
      <Header showBackButton backTo="/dashboard" title="Créer une Séance" />

      <div className="session-builder-content">
        {/* Sidebar Templates */}
        <aside className={`templates-sidebar ${showTemplates ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>📋 Templates</h3>
            <button className="btn-close-sidebar" onClick={() => setShowTemplates(false)}>
              ✕
            </button>
          </div>
          <div className="templates-list">
            {templates.map((template) => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => applyTemplate(template)}
              >
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <span className="template-blocks-count">
                  {template.blocks.length} blocs
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Builder */}
        <main className="builder-main">
          <form onSubmit={handleSubmit}>
            {/* Session Info */}
            <div className="session-info-card">
              <h2>Informations générales</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Athlète *</label>
                  <select
                    value={selectedAthlete}
                    onChange={(e) => setSelectedAthlete(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un athlète</option>
                    {athletes.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.user_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date de la séance *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Titre de la séance *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Séance seuil - 25min"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as any)}
                  >
                    <option value="run">Route</option>
                    <option value="trail">Trail</option>
                    <option value="recovery">Récupération</option>
                  </select>
                </div>
              </div>

              <div className="session-estimates">
                <div className="estimate-item">
                  <span className="estimate-icon">⏱️</span>
                  <span className="estimate-value">{estimatedDuration} min</span>
                  <span className="estimate-label">Durée estimée</span>
                </div>
                {estimatedDistance > 0 && (
                  <div className="estimate-item">
                    <span className="estimate-icon">📏</span>
                    <span className="estimate-value">{estimatedDistance.toFixed(1)} km</span>
                    <span className="estimate-label">Distance estimée</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="builder-actions">
              <button
                type="button"
                className="btn-show-templates"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                📋 {showTemplates ? 'Masquer' : 'Afficher'} les templates
              </button>
              <button type="button" className="btn-add-block" onClick={addBlock}>
                ➕ Ajouter un bloc
              </button>
            </div>

            {/* Blocks List */}
            <div className="blocks-container">
              <h2>Structure de la séance</h2>
              
              {blocks.length === 0 && (
                <div className="empty-blocks">
                  <p>Aucun bloc d'entraînement ajouté</p>
                  <p className="empty-hint">
                    Utilisez un template ou ajoutez un bloc manuellement
                  </p>
                </div>
              )}

              {blocks.map((block, index) => (
                <div key={block.id} className="block-card">
                  <div className="block-header">
                    <div className="block-number">#{index + 1}</div>
                    <select
                      className="block-type-select"
                      value={block.type}
                      onChange={(e) => updateBlock(index, 'type', e.target.value)}
                    >
                      <option value="warmup">🔥 Échauffement</option>
                      <option value="endurance">🏃 Endurance</option>
                      <option value="tempo">🎯 Tempo</option>
                      <option value="interval">⚡ Intervalles</option>
                      <option value="work">💪 Travail</option>
                      <option value="cooldown">❄️ Retour au calme</option>
                    </select>
                    
                    <div className="block-actions">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'up')}
                        disabled={index === 0}
                        title="Monter"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'down')}
                        disabled={index === blocks.length - 1}
                        title="Descendre"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateBlock(index)}
                        title="Dupliquer"
                      >
                        📋
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        title="Supprimer"
                        className="btn-delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="block-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Durée (min)</label>
                        <input
                          type="number"
                          value={block.duration || ''}
                          onChange={(e) => updateBlock(index, 'duration', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Distance (km) - optionnel</label>
                        <input
                          type="number"
                          step="0.1"
                          value={block.distance || ''}
                          onChange={(e) => updateBlock(index, 'distance', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label>Intensité</label>
                        <select
                          value={block.intensity}
                          onChange={(e) => updateBlock(index, 'intensity', e.target.value)}
                          style={{ borderLeft: `4px solid ${getIntensityColor(block.intensity)}` }}
                        >
                          <option value="recovery">Récupération</option>
                          <option value="easy">Facile</option>
                          <option value="moderate">Modéré</option>
                          <option value="threshold">Seuil</option>
                          <option value="tempo">Tempo</option>
                          <option value="vo2max">VMA</option>
                          <option value="sprint">Sprint</option>
                        </select>
                      </div>
                    </div>

                    {block.type === 'interval' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Répétitions</label>
                          <input
                            type="number"
                            value={block.repetitions || 1}
                            onChange={(e) => updateBlock(index, 'repetitions', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>
                        <div className="form-group">
                          <label>Récupération (min)</label>
                          <input
                            type="number"
                            value={block.recoveryTime || 0}
                            onChange={(e) => updateBlock(index, 'recoveryTime', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label>Allure cible (min/km) - optionnel</label>
                        <input
                          type="text"
                          value={block.pace || ''}
                          onChange={(e) => updateBlock(index, 'pace', e.target.value)}
                          placeholder="ex: 4:30-4:45"
                        />
                      </div>
                      <div className="form-group">
                        <label>Fréquence cardiaque (bpm) - optionnel</label>
                        <input
                          type="text"
                          value={block.heartRate || ''}
                          onChange={(e) => updateBlock(index, 'heartRate', e.target.value)}
                          placeholder="ex: 150-165"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description / Consignes</label>
                      <textarea
                        value={block.description}
                        onChange={(e) => updateBlock(index, 'description', e.target.value)}
                        placeholder="Instructions détaillées pour ce bloc..."
                        rows={3}
                      />
                    </div>

                    {block.type === 'interval' && block.repetitions && block.repetitions > 1 && (
                      <div className="interval-summary">
                        ⚡ {block.repetitions} × {block.duration}min + {block.recoveryTime}min récup
                        = {(block.duration! * block.repetitions) + (block.recoveryTime! * (block.repetitions - 1))} min total
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Global Notes */}
            <div className="global-notes-card">
              <h3>Notes générales (optionnel)</h3>
              <textarea
                value={globalNotes}
                onChange={(e) => setGlobalNotes(e.target.value)}
                placeholder="Conseils généraux, points d'attention, contexte de la séance..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <div className="form-submit">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedAthlete || blocks.length === 0}
              >
                {loading ? 'Création...' : 'Créer la séance'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default SessionBuilderPage;
