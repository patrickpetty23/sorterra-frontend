import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usersApi } from '../api/users';
import { OrgContext } from './useOrg';

export function OrgProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [orgRole, setOrgRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) {
      setOrganization(null);
      setOrgRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchOrg() {
      try {
        const profile = await usersApi.getMe();
        if (cancelled) return;

        if (profile.organization) {
          setOrganization(profile.organization);
          setOrgRole(profile.role);
        }
      } catch (err) {
        console.error('[OrgContext] Failed to load profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrg();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.sub]);

  return (
    <OrgContext.Provider value={{ organization, orgRole, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

