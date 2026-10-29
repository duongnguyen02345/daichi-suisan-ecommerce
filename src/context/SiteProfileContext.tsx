import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SiteProfile } from '../types';
import { defaultSiteProfile, loadSiteProfile } from '../lib/siteProfileApi';
import { isSupabaseConfigured } from '../lib/supabase';

interface SiteProfileContextValue {
  profile: SiteProfile;
  isLoading: boolean;
  dataSource: 'supabase' | 'local';
  refreshProfile: () => Promise<void>;
}

const SiteProfileContext = createContext<SiteProfileContextValue | undefined>(undefined);

export const SiteProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<SiteProfile>(defaultSiteProfile);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextProfile = await loadSiteProfile();
      setProfile(nextProfile);
      setDataSource(isSupabaseConfigured ? 'supabase' : 'local');
    } catch (error) {
      console.warn('Site profile could not be synchronized; using bundled defaults.', error);
      setProfile(defaultSiteProfile);
      setDataSource('local');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    document.title = profile.tagline
      ? `${profile.brandName} · ${profile.tagline}`
      : profile.brandName;
    if (!profile.faviconUrl) return;
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = profile.faviconUrl;
  }, [profile.brandName, profile.faviconUrl, profile.tagline]);

  return (
    <SiteProfileContext.Provider value={{ profile, isLoading, dataSource, refreshProfile }}>
      {children}
    </SiteProfileContext.Provider>
  );
};

export const useSiteProfile = () => {
  const context = useContext(SiteProfileContext);
  if (!context) throw new Error('useSiteProfile must be used within SiteProfileProvider');
  return context;
};
