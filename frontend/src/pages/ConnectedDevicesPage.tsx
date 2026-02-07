import React, { useState } from 'react';
import { platformsService } from '../services/api';
import { useApi, useApiSubmit } from '../hooks/useApi';
import '../styles/ConnectedDevices.css';

interface ConnectedPlatform {
  id: string;
  platform: string;
  athlete_platform_id: string;
  connected_at: string;
  last_sync_at?: string;
  is_active: boolean;
  metadata?: any;
}

const PLATFORMS = [
  {
    id: 'garmin',
    name: 'Garmin',
    logo: '🟢',
    color: '#007CC3',
    description: 'Montres Garmin et Garmin Connect'
  },
  {
    id: 'strava',
    name: 'Strava',
    logo: '🟠',
    color: '#FC4C02',
    description: 'Application sociale de sport'
  },
  {
    id: 'suunto',
    name: 'Suunto',
    logo: '🔴',
    color: '#FF0000',
    description: 'Montres Suunto'
  },
  {
    id: 'coros',
    name: 'COROS',
    logo: '⚪',
    color: '#000000',
    description: 'Montres COROS'
  },
  {
    id: 'polar',
    name: 'Polar',
    logo: '⚪',
    color: '#0066FF',
    description: 'Montres Polar'
  },
  {
    id: 'decathlon',
    name: 'Decathlon',
    logo: '🔵',
    color: '#0082C3',
    description: 'Decathlon Coach & montres Kiprun'
  }
];

const ConnectedDevicesPage: React.FC = () => {
  const [syncing, setSyncing] = useState<string | null>(null);

  // Load connected platforms using useApi
  const { data: platformsData, loading, refetch } = useApi<ConnectedPlatform[]>(
    () => platformsService.getConnected().then(res => res.data),
    []
  );
  const connectedPlatforms = platformsData || [];

  // Disconnect platform using useApiSubmit
  const { submit: disconnectPlatform } = useApiSubmit(async (platformId: string) => {
    const res = await platformsService.disconnect(platformId);
    await refetch();
    alert('Déconnecté avec succès');
    return res;
  });

  // Sync platform using useApiSubmit
  const { submit: syncPlatform } = useApiSubmit(async (platformId: string) => {
    setSyncing(platformId);
    try {
      const res = await platformsService.sync(platformId);
      await refetch();
      alert('Synchronisation réussie ! ✅');
      return res;
    } finally {
      setSyncing(null);
    }
  });

  const handleConnect = async (platformId: string) => {
    // Get authorization URL
    const { authUrl, state } = await platformsService.getAuthUrl(platformId);
    
    // Store state for CSRF protection
    sessionStorage.setItem(`oauth_state_${platformId}`, state);
    
    // Open OAuth window
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const oauthWindow = window.open(
      authUrl,
      'OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for OAuth callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'oauth-callback') {
        const { code, state: returnedState, platform } = event.data;
        const savedState = sessionStorage.getItem(`oauth_state_${platform}`);

        if (returnedState === savedState) {
          try {
            await platformsService.handleCallback(platform, code, returnedState);
            await refetch();
            alert(`${platform.toUpperCase()} connecté avec succès ! 🎉`);
          } catch (error: any) {
            alert(`Erreur de connexion: ${error.message}`);
          }
        } else {
          alert('Erreur de sécurité (CSRF)');
        }

        sessionStorage.removeItem(`oauth_state_${platform}`);
        oauthWindow?.close();
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup
    const checkClosed = setInterval(() => {
      if (oauthWindow?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  };

  const handleDisconnect = async (platformId: string) => {
    if (window.confirm(`Voulez-vous vraiment déconnecter ${platformId.toUpperCase()} ?`)) {
      await disconnectPlatform(platformId);
    }
  };

  const handleSync = async (platformId: string) => {
    await syncPlatform(platformId);
  };

  const isConnected = (platformId: string) => {
    return connectedPlatforms.some(
      (p) => p.platform === platformId && p.is_active
    );
  };

  const getConnectionInfo = (platformId: string) => {
    return connectedPlatforms.find(
      (p) => p.platform === platformId && p.is_active
    );
  };

  if (loading) {
    return (
      <div className="connected-devices-page">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="connected-devices-page">
      <div className="devices-header">
        <h1>🔗 Synchronisation des données</h1>
        <p className="subtitle">
          Associer VB Coaching avec vos appareils permet de synchroniser vos données, séances et plus automatiquement.
        </p>
      </div>

      <div className="platforms-section">
        <h2>Montres & capteurs</h2>
        <div className="platforms-grid">
          {PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id);
            const connection = getConnectionInfo(platform.id);

            return (
              <div
                key={platform.id}
                className={`platform-card ${connected ? 'connected' : ''}`}
                style={{ borderColor: platform.color }}
              >
                <div className="platform-header">
                  <div className="platform-logo" style={{ background: platform.color }}>
                    <span>{platform.logo}</span>
                  </div>
                  <div className="platform-info">
                    <h3>{platform.name}</h3>
                    <p>{platform.description}</p>
                  </div>
                </div>

                {connected && connection ? (
                  <div className="platform-status">
                    <div className="status-badge connected-badge">✓ Connecté</div>
                    <div className="connection-details">
                      <p className="connection-date">
                        Connecté le {new Date(connection.connected_at).toLocaleDateString('fr-FR')}
                      </p>
                      {connection.last_sync_at && (
                        <p className="last-sync">
                          Dernière sync : {new Date(connection.last_sync_at).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <div className="platform-actions">
                      <button
                        className="btn-sync"
                        onClick={() => handleSync(platform.id)}
                        disabled={syncing === platform.id}
                      >
                        {syncing === platform.id ? '⏳ Sync...' : '🔄 Synchroniser'}
                      </button>
                      <button
                        className="btn-disconnect"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        Déconnecter
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="platform-status">
                    <div className="status-badge disconnected-badge">Non connecté</div>
                    <button
                      className="btn-connect"
                      onClick={() => handleConnect(platform.id)}
                      style={{ background: platform.color }}
                    >
                      Connecter {platform.name}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="info-section">
        <h3>ℹ️ Comment ça marche ?</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">📤</div>
            <h4>Export automatique des séances</h4>
            <p>
              Quand votre coach crée une séance, elle est automatiquement envoyée sur votre montre
            </p>
          </div>
          <div className="info-card">
            <div className="info-icon">📥</div>
            <h4>Import automatique des activités</h4>
            <p>
              Vos entraînements réalisés sont automatiquement importés dans VB Coaching
            </p>
          </div>
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h4>Analyse en temps réel</h4>
            <p>
              Votre coach suit votre progression avec les données réelles de votre montre
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedDevicesPage;
