import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const OAuthCallbackPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    // Get platform from pathname
    const pathParts = location.pathname.split('/');
    const platform = pathParts[pathParts.length - 2];

    if (error) {
      alert(`OAuth Error: ${error}`);
      window.close();
      return;
    }

    if (code && state && platform) {
      // Send message to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'oauth-callback',
            code,
            state,
            platform,
          },
          window.location.origin
        );
      }
    }
  }, [location]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>🔄 Connexion en cours...</h2>
        <p>Vous pouvez fermer cette fenêtre.</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
