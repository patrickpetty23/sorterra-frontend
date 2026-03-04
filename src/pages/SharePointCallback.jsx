import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { sharePointConnectionsApi } from '../api';
import { useOrg } from '../contexts/OrgContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'sorterra_sp_pending';

export default function SharePointCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { organization } = useOrg();
  const [error, setError] = useState(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    handleCallback();

    async function handleCallback() {
      const msError = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (msError) {
        cleanup();
        setError(errorDesc || msError);
        return;
      }

      const returnedState = searchParams.get('state');
      const tenantId = searchParams.get('tenant');
      const adminConsent = searchParams.get('admin_consent');

      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError('No pending connection found. Please start the process again from Settings.');
        return;
      }

      let pending;
      try {
        pending = JSON.parse(raw);
      } catch {
        cleanup();
        setError('Corrupted session data. Please try again from Settings.');
        return;
      }

      if (returnedState !== pending.state) {
        cleanup();
        setError('State verification failed. The request may have been tampered with. Please try again.');
        return;
      }

      if (adminConsent !== 'True') {
        cleanup();
        setError('Admin consent was not granted. Please try again and accept the permissions.');
        return;
      }

      try {
        await sharePointConnectionsApi.create({
          siteUrl: pending.siteUrl,
          tenantId,
          sourceFolder: pending.sourceFolder || null,
          organizationId: organization?.id || null,
        });

        cleanup();
        toast.success('SharePoint connected successfully');
        navigate('/settings', { replace: true });
      } catch (err) {
        cleanup();
        setError(err.message || 'Failed to save the connection. Please try again.');
      }
    }

    function cleanup() {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [searchParams, navigate, toast, organization]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-error, #ef4444)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Connection Failed</h2>
          <p style={{ color: 'var(--color-text-secondary, #6b7280)', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/settings" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.5rem 1.5rem', textDecoration: 'none' }}>
            Back to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <LoadingSpinner size="lg" message="Connecting your SharePoint account..." />
    </div>
  );
}
