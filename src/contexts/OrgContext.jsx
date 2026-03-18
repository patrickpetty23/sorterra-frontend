import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usersApi } from '../api/users';
import { userOrganizationsApi } from '../api/userOrganizations';
import { organizationsApi } from '../api';
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
        // 1. Find DB user by Cognito sub
        let dbUser = await usersApi.getByCognitoSub(user.sub);
        if (cancelled) { setLoading(false); return; }

        // If user doesn't exist in DB yet, wait briefly and retry
        // (handles race with Register.jsx's POST /api/users)
        if (!dbUser) {
          await new Promise((r) => setTimeout(r, 1500));
          if (cancelled) { setLoading(false); return; }
          dbUser = await usersApi.getByCognitoSub(user.sub);
          if (cancelled || !dbUser) { setLoading(false); return; }
        }

        // 2. Get user's organization memberships
        const memberships = await userOrganizationsApi.getByUserId(dbUser.id);
        if (cancelled) { setLoading(false); return; }

        if (memberships.length === 0) {
          // Auto-provision org for existing users who don't have one
          try {
            const orgName = dbUser.displayName
              ? `${dbUser.displayName}'s Organization`
              : `${dbUser.email.split('@')[0]}'s Organization`;
            const newOrg = await organizationsApi.create({ name: orgName });
            await userOrganizationsApi.create({
              userId: dbUser.id,
              organizationId: newOrg.id,
              role: 'owner',
            });
            if (!cancelled) {
              setOrganization(newOrg);
              setOrgRole('owner');
            }
          } catch (err) {
            console.error('[OrgContext] Failed to auto-provision org:', err);
          }
          setLoading(false);
          return;
        }

        // 3. Use the first org membership (primary org)
        const membership = memberships[0];
        const org = await organizationsApi.getById(membership.organizationId);
        if (cancelled) return;

        setOrganization(org);
        setOrgRole(membership.role);
      } catch (err) {
        console.error('[OrgContext] Failed to load organization:', err);
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

