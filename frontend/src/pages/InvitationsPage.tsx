import { useState } from 'react';
import { invitationsService } from '../services/api';
import { useApi, useApiSubmit } from '../hooks/useApi';
import Header from '../components/Header';
import '../styles/InvitationsPage.css';

interface InvitationCode {
  id: string;
  code: string;
  used: boolean;
  used_by: string | null;
  used_by_name: string | null;
  used_by_email: string | null;
  expires_at: string;
  created_at: string;
}

function InvitationsPage() {
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState('');

  // Load codes using useApi
  const { data: codesData, loading, error: loadError, refetch } = useApi<InvitationCode[]>(
    () => invitationsService.getMyCodes().then(res => res.data),
    []
  );
  
  const codes = codesData || [];

  // Generate code using useApiSubmit
  const { submit: generateCode, loading: generating, error: generateError } = useApiSubmit(
    async (_?: void) => {
      const response = await invitationsService.generate();
      setNewCode(response.data.code);
      
      // Auto-hide after 10 seconds
      setTimeout(() => setNewCode(null), 10000);
      
      // Refetch codes to update the list
      await refetch();
      
      return response;
    }
  );

  // Delete code using useApiSubmit
  const { submit: deleteCode, error: deleteError } = useApiSubmit(
    async (code: string) => {
      const response = await invitationsService.delete(code);
      await refetch();
      return response;
    }
  );

  // Combine errors
  const error = loadError || generateError || deleteError;

  const handleGenerate = async () => {
    await generateCode(undefined);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce code ?')) return;
    await deleteCode(code);
  };

  if (loading) {
    return (
      <div className="invitations-wrapper">
        <Header />
        <div className="invitations-page">
          <div className="loading-container">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="invitations-wrapper">
      <Header />

      <div className="invitations-page">
        <div className="page-header">
          <h1 className="page-main-title">📨 Codes d'Invitation</h1>
          <p className="page-subtitle">Invitez vos athlètes à rejoindre la plateforme</p>
          <button 
            className="btn-generate"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '⏳ Génération...' : '➕ Générer un Code'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

      {/* New Code Display */}
      {newCode && (
        <div className="new-code-banner">
          <div className="new-code-content">
            <h2>✨ Nouveau Code Généré !</h2>
            <div className="code-display">
              <span className="code-text">{newCode}</span>
              <button 
                className="btn-copy"
                onClick={() => handleCopy(newCode)}
              >
                {copiedCode === newCode ? '✅ Copié !' : '📋 Copier'}
              </button>
            </div>
            <p className="code-instructions">
              Partagez ce code avec votre athlète pour qu'il puisse s'inscrire et être automatiquement associé à vous.
            </p>
          </div>
        </div>
      )}

      {/* Active Codes */}
      <div className="codes-section">
        <h2>📋 Codes Actifs ({codes.filter(c => !c.used).length})</h2>
        <div className="codes-grid">
          {codes.filter(c => !c.used).length === 0 ? (
            <div className="empty-state">
              <p>Aucun code actif</p>
              <p className="empty-hint">Générez un code pour inviter des athlètes</p>
            </div>
          ) : (
            codes.filter(c => !c.used).map((code) => (
              <div key={code.id} className="code-card active">
                <div className="code-header">
                  <span className="code-badge active">✨ Actif</span>
                </div>
                <div className="code-main">
                  <div className="code-value-large">{code.code}</div>
                  <button 
                    className="btn-copy-large"
                    onClick={() => handleCopy(code.code)}
                  >
                    {copiedCode === code.code ? '✅ Copié !' : '📋 Copier le Code'}
                  </button>
                </div>
                <div className="code-info">
                  <p>📅 Créé: {new Date(code.created_at).toLocaleDateString('fr-FR')}</p>
                  {code.expires_at && (
                    <p>⏰ Expire: {new Date(code.expires_at).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                <div className="code-share-hint">
                  💡 Partagez ce code avec votre athlète par SMS, WhatsApp ou Email
                </div>
                <div className="code-actions">
                  <button 
                    className="btn-delete-small"
                    onClick={() => handleDelete(code.code)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Used Codes */}
      <div className="codes-section">
        <h2>✅ Codes Utilisés ({codes.filter(c => c.used).length})</h2>
        <div className="codes-grid">
          {codes.filter(c => c.used).length === 0 ? (
            <div className="empty-state">
              <p>Aucun code utilisé</p>
            </div>
          ) : (
            codes.filter(c => c.used).map((code) => (
              <div key={code.id} className="code-card used">
                <div className="code-header">
                  <span className="code-badge used">Utilisé</span>
                  <span className="code-value">{code.code}</span>
                </div>
                <div className="code-info">
                  <p>👤 Par: {code.used_by_name || 'Inconnu'}</p>
                  <p>📧 {code.used_by_email || 'N/A'}</p>
                  <p>📅 Créé le: {new Date(code.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="help-section">
        <h3>❓ Comment ça marche ?</h3>
        <ol>
          <li>Générez un code d'invitation</li>
          <li>Partagez-le avec votre athlète (WhatsApp, Email, SMS...)</li>
          <li>L'athlète l'entre lors de son inscription</li>
          <li>Il sera automatiquement associé à vous !</li>
        </ol>
      </div>
      </div>
    </div>
  );
}

export default InvitationsPage;
