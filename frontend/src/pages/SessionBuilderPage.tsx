import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { athletesService, sessionsService } from '../services/api';
import { Athlete } from '../types';
import { calculateHeartRateZones, calculateVMAZones } from '../utils/trainingZones';
import { showSuccess, showError, showWarning, showLoading, dismissToast } from '../utils/toast.tsx';
import { useApi, useApiSubmit } from '../hooks/useApi';
import Header from '../components/Header';
import '../styles/SessionBuilder.css';

interface SessionBlock {
  id: string;
  type: 'warmup' | 'work' | 'cooldown' | 'interval' | 'tempo' | 'endurance';
  duration?: number; // en minutes
  distance?: number; // en km
  intensity: 'recovery' | 'easy' | 'moderate' | 'threshold' | 'tempo' | 'vo2max' | 'sprint';
  
  // Mode de consigne : zone, valeur fixe, ou % VMA
  paceMode?: 'fixed' | 'zone' | 'vma_percent'; // Par défaut: fixed
  paceMin?: number; // Allure min en secondes/km (ex: 270 pour 4:30/km)
  paceMax?: number; // Allure max en secondes/km (ex: 285 pour 4:45/km)
  paceZone?: number; // 1-6 pour zones VMA
  vmaPercentMin?: number; // % VMA min (ex: 75 pour 75% VMA)
  vmaPercentMax?: number; // % VMA max (ex: 85 pour 85% VMA)
  
  hrMode?: 'fixed' | 'zone'; // Par défaut: fixed
  hrMin?: number; // FC min en bpm (ex: 140)
  hrMax?: number; // FC max en bpm (ex: 150)
  hrZone?: number; // 1-5 pour zones FC
  
  description: string;
  repetitions?: number; // pour les intervalles
  recoveryTime?: number; // temps de récup entre répétitions (en minutes)
}

interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<SessionBlock, 'id'>[];
  isCustom?: boolean; // Pour différencier les templates personnalisés
  createdAt?: string;
}

function SessionBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Si on édite une séance existante
  
  // Load athletes using useApi
  const { data: athletesData, loading: athletesLoading } = useApi<Athlete[]>(
    () => athletesService.getAll().then(res => res.data),
    []
  );
  const athletes = athletesData || [];
  
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [selectedAthleteData, setSelectedAthleteData] = useState<Athlete | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [sessionType, setSessionType] = useState<'run' | 'trail' | 'recovery'>('run');
  const [blocks, setBlocks] = useState<SessionBlock[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [globalNotes, setGlobalNotes] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [customTemplates, setCustomTemplates] = useState<SessionTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Create/update session using useApiSubmit
  const { submit: saveSession, loading: saving } = useApiSubmit(
    async (data: any) => {
      const toastId = showLoading(id ? 'Modification en cours...' : 'Création en cours...');
      try {
        let response;
        if (id) {
          response = await sessionsService.update(id, data);
          dismissToast(toastId);
          showSuccess('Séance modifiée avec succès !');
        } else {
          response = await sessionsService.create(data);
          dismissToast(toastId);
          showSuccess('Séance créée avec succès !');
        }
        navigate('/dashboard');
        return response;
      } catch (error) {
        dismissToast(toastId);
        throw error;
      }
    }
  );

  const loading = athletesLoading || saving;

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
          paceMin: 330, // 5:30/km
          paceMax: 360, // 6:00/km
          hrMin: 130,
          hrMax: 145,
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
          paceMin: 260, // 4:20/km
          paceMax: 270, // 4:30/km
          hrMin: 165,
          hrMax: 175,
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
          paceMin: 225, // 3:45/km
          paceMax: 235, // 3:55/km
          hrMin: 180,
          hrMax: 190,
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
          paceMin: 300, // 5:00/km
          paceMax: 320, // 5:20/km
          hrMin: 145,
          hrMax: 160,
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
          paceMin: 360, // 6:00/km
          paceMax: 390, // 6:30/km
          hrMin: 120,
          hrMax: 135,
          description: 'Footing très facile, rester en-dessous de 75% FCMax'
        }
      ]
    }
  ];

  // Load session if in edit mode
  useEffect(() => {
    if (id) {
      const loadSession = async () => {
        const response = await sessionsService.getById(id);
        const session = response.data;
        
        // Pre-fill the form
        setSelectedAthlete(session.athlete_id);
        setTitle(session.title);
        setDate(new Date(session.start_date).toISOString().split('T')[0]);
        setSessionType(session.type || 'run');
        setGlobalNotes(session.notes || session.description || '');
        
        // Load blocks if available
        if (session.blocks) {
          try {
            const loadedBlocks = typeof session.blocks === 'string' 
              ? JSON.parse(session.blocks) 
              : session.blocks;
            
            // Add IDs if missing
            const blocksWithIds = loadedBlocks.map((block: any, idx: number) => ({
              ...block,
              id: block.id || `${Date.now()}-${idx}`
            }));
            
            setBlocks(blocksWithIds);
          } catch (error) {
            console.error('Error parsing blocks:', error);
          }
        }
      };
      
      loadSession().catch(error => {
        console.error('Error loading session:', error);
        showError('Impossible de charger la séance', error as Error);
        navigate('/dashboard');
      });
    }
  }, [id, navigate]);

  useEffect(() => {
    calculateEstimates();
  }, [blocks]);

  // Load athlete data when selected
  useEffect(() => {
    if (selectedAthlete) {
      const loadAthleteData = async () => {
        const response = await athletesService.getById(selectedAthlete);
        setSelectedAthleteData(response.data);
        console.log('📊 Données athlète chargées:', response.data);
        console.log('VMA:', response.data.vma);
        console.log('FC MAX:', response.data.max_heart_rate);
      };
      
      loadAthleteData().catch(error => {
        console.error('Erreur chargement données athlète:', error);
      });
    } else {
      setSelectedAthleteData(null);
    }
  }, [selectedAthlete]);

  // Charger les templates personnalisés depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customTemplates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur chargement templates:', error);
      }
    }
  }, []);

  // === Fonctions utilitaires pour allures et FC ===
  
  /**
   * Convertit des secondes en format "min:sec"
   * Ex: 270 -> "4:30"
   */
  const secondsToPace = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Convertit un % de VMA en allure (secondes/km)
   * Ex: VMA 18 km/h, 80% VMA = 14.4 km/h = 4:10/km = 250 secondes/km
   */
  const vmaPercentToPace = (vma: number, percent: number): number => {
    const speedKmh = vma * (percent / 100);
    const secondsPerKm = 3600 / speedKmh; // 3600 secondes dans 1h
    return Math.round(secondsPerKm);
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
      description: '',
      paceMode: 'fixed',
      hrMode: 'fixed',
    };
    setBlocks([...blocks, newBlock]);
  };

  // Helper pour obtenir les zones FC de l'athlète
  const getAthleteHRZones = () => {
    if (!selectedAthleteData?.max_heart_rate) return [];
    return calculateHeartRateZones(selectedAthleteData.max_heart_rate);
  };

  // Helper pour obtenir les zones VMA de l'athlète
  const getAthleteVMAZones = () => {
    if (!selectedAthleteData?.vma) return [];
    return calculateVMAZones(selectedAthleteData.vma);
  };

  // Formater l'affichage d'une zone FC
  const formatHRZone = (zoneNumber: number) => {
    const zones = getAthleteHRZones();
    const zone = zones.find(z => z.zone === zoneNumber);
    if (!zone) return `Zone ${zoneNumber}`;
    return `Zone ${zoneNumber} (${zone.min}-${zone.max} bpm) - ${zone.name}`;
  };

  // Formater l'affichage d'une zone VMA
  const formatVMAZone = (zoneNumber: number) => {
    const zones = getAthleteVMAZones();
    const zone = zones.find(z => z.zone === zoneNumber);
    if (!zone) return `Zone ${zoneNumber}`;
    return `Zone ${zoneNumber} (${zone.minSpeed.toFixed(1)}-${zone.maxSpeed.toFixed(1)} km/h) - ${zone.name}`;
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

  // Sauvegarder un nouveau template personnalisé
  const saveAsTemplate = () => {
    if (!templateName.trim() || blocks.length === 0) {
      showWarning('Veuillez donner un nom au template et ajouter au moins un bloc');
      return;
    }

    const newTemplate: SessionTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: templateDescription || 'Template personnalisé',
      blocks: blocks.map(({ id, ...rest }) => rest),
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('customTemplates', JSON.stringify(updated));
    
    setShowSaveTemplateModal(false);
    setTemplateName('');
    setTemplateDescription('');
    showSuccess(`Template "${templateName}" sauvegardé avec succès !`);
  };

  // Supprimer un template personnalisé
  const deleteCustomTemplate = (templateId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      const updated = customTemplates.filter(t => t.id !== templateId);
      setCustomTemplates(updated);
      localStorage.setItem('customTemplates', JSON.stringify(updated));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || blocks.length === 0) {
      showWarning('Veuillez sélectionner un athlète et ajouter au moins un bloc d\'entraînement');
      return;
    }
    
    // Convert date to ISO format with 08:00 time
    const sessionDateTime = new Date(date + 'T08:00:00').toISOString();
    
    // Prepare session data
    const sessionData = {
      athleteId: selectedAthlete,
      title,
      description: globalNotes || `Séance ${id ? 'modifiée' : 'créée'} avec ${blocks.length} blocs`,
      type: sessionType,
      distance: estimatedDistance,
      duration: estimatedDuration,
      intensity: blocks.length > 0 ? blocks[0].intensity : 'moderate',
      startDate: sessionDateTime,
      blocks: JSON.stringify(blocks),
      notes: globalNotes
    };

    console.log('Envoi des données:', sessionData);
    await saveSession(sessionData);
  };

  // Removed unused helper functions: getIntensityLabel, getBlockTypeLabel
  // Kept getIntensityColor as it may be used in future UI enhancements

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

  // Removed getBlockTypeLabel as it was unused

  return (
    <div className="session-builder-wrapper">
      <Header />
      
      <div className="session-builder-page">
        <div className="page-header">
          <h1 className="page-main-title">{id ? '✏️ Modifier une Séance' : '🎯 Créer une Séance'}</h1>
          <p className="page-subtitle">
            {id 
              ? 'Modifiez les blocs et consignes de cette séance d\'entraînement'
              : 'Construisez une séance d\'entraînement avancée avec des blocs et des consignes détaillées'
            }
          </p>
        </div>

      <div className="session-builder-content">
        {/* Sidebar Templates */}
        <aside className={`templates-sidebar ${showTemplates ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>📋 Templates</h3>
            <button className="btn-close-sidebar" onClick={() => setShowTemplates(false)}>
              ✕
            </button>
          </div>
          
          {/* Custom Templates Section */}
          {customTemplates.length > 0 && (
            <>
              <div className="templates-section-header">
                <h4>💾 Mes Templates</h4>
              </div>
              <div className="templates-list">
                {customTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="template-card custom-template"
                  >
                    <div onClick={() => applyTemplate(template)}>
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <span className="template-blocks-count">
                        {template.blocks.length} blocs
                      </span>
                      {template.createdAt && (
                        <span className="template-date">
                          {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn-delete-template"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomTemplate(template.id);
                      }}
                      title="Supprimer ce template"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Default Templates Section */}
          <div className="templates-section-header">
            <h4>📋 Templates par défaut</h4>
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
              
              {selectedAthleteData && (
                <>
                  {/* Debug info - peut être enlevé en production */}
                  {(!selectedAthleteData.vma || !selectedAthleteData.max_heart_rate) && (
                    <div className="metrics-warning">
                      <span className="warning-icon">⚠️</span>
                      <div className="warning-content">
                        <strong>Métriques manquantes pour utiliser les zones</strong>
                        <p>
                          <strong>Valeurs actuelles :</strong><br />
                          📊 VMA : {selectedAthleteData.vma ? `${selectedAthleteData.vma} km/h ✅` : '❌ Non renseignée'}<br />
                          ❤️ FC MAX : {selectedAthleteData.max_heart_rate ? `${selectedAthleteData.max_heart_rate} bpm ✅` : '❌ Non renseignée'}
                          <br /><br />
                          <strong>Conséquences :</strong><br />
                          {!selectedAthleteData.vma && '• Boutons "% VMA" et "Zone VMA" désactivés'}{!selectedAthleteData.vma && <br />}
                          {!selectedAthleteData.max_heart_rate && '• Bouton "Zone FC" désactivé'}
                          <br /><br />
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/athletes/${selectedAthlete}`);
                            }}
                            style={{ color: '#007bff', textDecoration: 'underline', fontWeight: 600 }}
                          >
                            🔧 Cliquer ici pour ajouter les métriques manquantes
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
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

                    {/* Allure / Vitesse */}
                    <div className="zone-control-group">
                      <div className="zone-mode-toggle">
                        <label>Consigne d'allure</label>
                        <div className="mode-buttons">
                          <button
                            type="button"
                            className={`mode-btn ${block.paceMode === 'fixed' || !block.paceMode ? 'active' : ''}`}
                            onClick={() => {
                              updateBlock(index, 'paceMode', 'fixed');
                              updateBlock(index, 'paceZone', undefined);
                              updateBlock(index, 'vmaPercentMin', undefined);
                              updateBlock(index, 'vmaPercentMax', undefined);
                            }}
                          >
                            Allure fixe
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${block.paceMode === 'vma_percent' ? 'active' : ''}`}
                            onClick={() => updateBlock(index, 'paceMode', 'vma_percent')}
                            disabled={!selectedAthleteData?.vma}
                            title={!selectedAthleteData?.vma ? 'L\'athlète doit avoir une VMA renseignée' : ''}
                          >
                            % VMA
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${block.paceMode === 'zone' ? 'active' : ''}`}
                            onClick={() => updateBlock(index, 'paceMode', 'zone')}
                            disabled={!selectedAthleteData?.vma}
                            title={!selectedAthleteData?.vma ? 'L\'athlète doit avoir une VMA renseignée' : ''}
                          >
                            Zone VMA
                          </button>
                        </div>
                      </div>

                      {block.paceMode === 'zone' && selectedAthleteData?.vma ? (
                        <div className="form-group">
                          <label>Zone VMA</label>
                          <select
                            value={block.paceZone || ''}
                            onChange={(e) => {
                              const zone = parseInt(e.target.value);
                              updateBlock(index, 'paceZone', zone);
                            }}
                          >
                            <option value="">Sélectionner une zone...</option>
                            {getAthleteVMAZones().map((zone) => (
                              <option key={zone.zone} value={zone.zone}>
                                {formatVMAZone(zone.zone)}
                              </option>
                            ))}
                          </select>
                          {block.paceZone && (
                            <div className="zone-info">
                              ✓ {formatVMAZone(block.paceZone)}
                            </div>
                          )}
                        </div>
                      ) : block.paceMode === 'vma_percent' && selectedAthleteData?.vma ? (
                        <div className="vma-percent-inputs">
                          <div className="form-group">
                            <label>% VMA MIN</label>
                            <div className="percent-input-group">
                              <input
                                type="number"
                                value={block.vmaPercentMin || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  if (value >= 50 && value <= 120) {
                                    updateBlock(index, 'vmaPercentMin', value);
                                  }
                                }}
                                min="50"
                                max="120"
                                placeholder="Ex: 75"
                                className="percent-input"
                              />
                              <span className="percent-symbol">%</span>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>% VMA MAX</label>
                            <div className="percent-input-group">
                              <input
                                type="number"
                                value={block.vmaPercentMax || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  if (value >= 50 && value <= 120) {
                                    updateBlock(index, 'vmaPercentMax', value);
                                  }
                                }}
                                min="50"
                                max="120"
                                placeholder="Ex: 85"
                                className="percent-input"
                              />
                              <span className="percent-symbol">%</span>
                            </div>
                          </div>
                          {block.vmaPercentMin && block.vmaPercentMax && selectedAthleteData?.vma && (
                            <div className="vma-preview">
                              🏃 VMA {selectedAthleteData.vma} km/h<br/>
                              📏 {block.vmaPercentMin}% VMA = {secondsToPace(vmaPercentToPace(selectedAthleteData.vma, block.vmaPercentMin))}/km<br/>
                              📏 {block.vmaPercentMax}% VMA = {secondsToPace(vmaPercentToPace(selectedAthleteData.vma, block.vmaPercentMax))}/km
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pace-range-inputs">
                          <div className="form-group">
                            <label>Allure MIN (min/km)</label>
                            <div className="pace-input-group">
                              <input
                                type="number"
                                value={block.paceMin ? Math.floor(block.paceMin / 60) : ''}
                                onChange={(e) => {
                                  const minutes = parseInt(e.target.value) || 0;
                                  const seconds = (block.paceMin || 0) % 60;
                                  updateBlock(index, 'paceMin', minutes * 60 + seconds);
                                }}
                                min="3"
                                max="10"
                                placeholder="Min"
                                className="pace-minutes"
                              />
                              <span className="pace-separator">:</span>
                              <input
                                type="number"
                                value={block.paceMin ? (block.paceMin % 60).toString().padStart(2, '0') : ''}
                                onChange={(e) => {
                                  const seconds = parseInt(e.target.value) || 0;
                                  const minutes = Math.floor((block.paceMin || 0) / 60);
                                  updateBlock(index, 'paceMin', minutes * 60 + Math.min(59, Math.max(0, seconds)));
                                }}
                                min="0"
                                max="59"
                                placeholder="Sec"
                                className="pace-seconds"
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Allure MAX (min/km)</label>
                            <div className="pace-input-group">
                              <input
                                type="number"
                                value={block.paceMax ? Math.floor(block.paceMax / 60) : ''}
                                onChange={(e) => {
                                  const minutes = parseInt(e.target.value) || 0;
                                  const seconds = (block.paceMax || 0) % 60;
                                  updateBlock(index, 'paceMax', minutes * 60 + seconds);
                                }}
                                min="3"
                                max="10"
                                placeholder="Min"
                                className="pace-minutes"
                              />
                              <span className="pace-separator">:</span>
                              <input
                                type="number"
                                value={block.paceMax ? (block.paceMax % 60).toString().padStart(2, '0') : ''}
                                onChange={(e) => {
                                  const seconds = parseInt(e.target.value) || 0;
                                  const minutes = Math.floor((block.paceMax || 0) / 60);
                                  updateBlock(index, 'paceMax', minutes * 60 + Math.min(59, Math.max(0, seconds)));
                                }}
                                min="0"
                                max="59"
                                placeholder="Sec"
                                className="pace-seconds"
                              />
                            </div>
                          </div>
                          {block.paceMin && block.paceMax && (
                            <div className="pace-preview">
                              📏 Plage: {secondsToPace(block.paceMin)} - {secondsToPace(block.paceMax)} /km
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fréquence Cardiaque */}
                    <div className="zone-control-group">
                      <div className="zone-mode-toggle">
                        <label>Consigne de fréquence cardiaque</label>
                        <div className="mode-buttons">
                          <button
                            type="button"
                            className={`mode-btn ${block.hrMode !== 'zone' ? 'active' : ''}`}
                            onClick={() => {
                              updateBlock(index, 'hrMode', 'fixed');
                              updateBlock(index, 'hrZone', undefined);
                            }}
                          >
                            FC fixe
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${block.hrMode === 'zone' ? 'active' : ''}`}
                            onClick={() => updateBlock(index, 'hrMode', 'zone')}
                            disabled={!selectedAthleteData?.max_heart_rate}
                            title={!selectedAthleteData?.max_heart_rate ? 'L\'athlète doit avoir une FC MAX renseignée' : ''}
                          >
                            Zone FC
                          </button>
                        </div>
                      </div>

                      {block.hrMode === 'zone' && selectedAthleteData?.max_heart_rate ? (
                        <div className="form-group">
                          <label>Zone Cardiaque</label>
                          <select
                            value={block.hrZone || ''}
                            onChange={(e) => {
                              const zone = parseInt(e.target.value);
                              updateBlock(index, 'hrZone', zone);
                            }}
                          >
                            <option value="">Sélectionner une zone...</option>
                            {getAthleteHRZones().map((zone) => (
                              <option key={zone.zone} value={zone.zone}>
                                {formatHRZone(zone.zone)}
                              </option>
                            ))}
                          </select>
                          {block.hrZone && (
                            <div className="zone-info">
                              ✓ {formatHRZone(block.hrZone)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="hr-range-inputs">
                          <div className="form-group">
                            <label>FC MIN (bpm)</label>
                            <input
                              type="number"
                              value={block.hrMin || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value >= 40 && value <= 220) {
                                  updateBlock(index, 'hrMin', value);
                                }
                              }}
                              min="40"
                              max="220"
                              placeholder="Ex: 140"
                              className="hr-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>FC MAX (bpm)</label>
                            <input
                              type="number"
                              value={block.hrMax || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value >= 40 && value <= 220) {
                                  updateBlock(index, 'hrMax', value);
                                }
                              }}
                              min="40"
                              max="220"
                              placeholder="Ex: 160"
                              className="hr-input"
                            />
                          </div>
                          {block.hrMin && block.hrMax && (
                            <div className="hr-preview">
                              ❤️ Plage: {block.hrMin} - {block.hrMax} bpm
                            </div>
                          )}
                        </div>
                      )}
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
                type="button"
                className="btn-save-template"
                onClick={() => setShowSaveTemplateModal(true)}
                disabled={blocks.length === 0}
                title="Sauvegarder cette séance comme template réutilisable"
              >
                💾 Sauvegarder comme template
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedAthlete || blocks.length === 0}
              >
                {loading 
                  ? (id ? 'Modification...' : 'Création...') 
                  : (id ? '✅ Enregistrer les modifications' : '✅ Créer la séance')
                }
              </button>
            </div>
          </form>

          {/* Modal Sauvegarde Template */}
          {showSaveTemplateModal && (
            <div className="modal-overlay" onClick={() => setShowSaveTemplateModal(false)}>
              <div className="modal-content save-template-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>💾 Sauvegarder comme template</h3>
                  <button className="close-btn" onClick={() => setShowSaveTemplateModal(false)}>
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Nom du template *</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Ex: Séance seuil 30min"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Ex: Travail au seuil anaérobie pour améliorer l'endurance"
                      rows={3}
                    />
                  </div>
                  <div className="template-preview-info">
                    <strong>📊 Cette séance contient :</strong>
                    <ul>
                      <li>{blocks.length} bloc(s) d'entraînement</li>
                      <li>Durée estimée : {estimatedDuration} minutes</li>
                      {estimatedDistance > 0 && <li>Distance estimée : {estimatedDistance.toFixed(1)} km</li>}
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowSaveTemplateModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={saveAsTemplate}
                    disabled={!templateName.trim()}
                  >
                    💾 Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
      </div>
    </div>
  );
}

export default SessionBuilderPage;
