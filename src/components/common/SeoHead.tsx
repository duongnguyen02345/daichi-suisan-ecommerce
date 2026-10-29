import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadSeoSettingByPath } from '../../lib/seoApi';
import { useSiteProfile } from '../../context/SiteProfileContext';

export const SeoHead: React.FC = () => {
  const location = useLocation();
  const { profile } = useSiteProfile();

  useEffect(() => {
    let isCancelled = false;

    const applySeo = async () => {
      // Find matching path
      const currentPath = location.pathname;
      let targetPath = currentPath;
      if (currentPath.startsWith('/admin')) {
        document.title = `Quản trị hệ thống | ${profile.brandName || 'DAICHI SUISAN'}`;
        return;
      }

      if (currentPath.startsWith('/product/')) targetPath = '/products';
      else if (currentPath.startsWith('/category/')) targetPath = '/products';
      else if (currentPath.startsWith('/news/')) targetPath = '/news';

      const seo = await loadSeoSettingByPath(targetPath);
      if (isCancelled) return;

      // 1. Update Title
      const title = seo.metaTitle || `${profile.brandName} - ${profile.tagline}`;
      document.title = title;

      // 2. Helper to set or create meta tag
      const setMetaTag = (attribute: string, attrValue: string, content: string) => {
        let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attribute, attrValue);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      // 3. Meta description & keywords
      if (seo.metaDescription) {
        setMetaTag('name', 'description', seo.metaDescription);
      }
      if (seo.keywords) {
        setMetaTag('name', 'keywords', seo.keywords);
      }
      setMetaTag('name', 'robots', seo.isIndexable ? 'index, follow' : 'noindex, nofollow');

      // 4. Open Graph tags
      setMetaTag('property', 'og:title', seo.ogTitle || title);
      setMetaTag('property', 'og:description', seo.ogDescription || seo.metaDescription || profile.companyDescription);
      if (seo.ogImageUrl || profile.logoUrl) {
        setMetaTag('property', 'og:image', seo.ogImageUrl || profile.logoUrl);
      }
      setMetaTag('property', 'og:url', window.location.href);
      setMetaTag('property', 'og:type', 'website');

      // 5. Canonical link
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (seo.canonicalUrl) {
        if (!canonicalLink) {
          canonicalLink = document.createElement('link');
          canonicalLink.setAttribute('rel', 'canonical');
          document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', seo.canonicalUrl);
      } else if (canonicalLink) {
        canonicalLink.remove();
      }

      // 6. Favicon
      if (profile.faviconUrl) {
        let fav = document.querySelector('link[rel="icon"]');
        if (fav) {
          fav.setAttribute('href', profile.faviconUrl);
        }
      }
    };

    void applySeo();

    return () => {
      isCancelled = true;
    };
  }, [location.pathname, profile]);

  return null;
};
