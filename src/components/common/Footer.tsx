import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Award, Sparkles } from 'lucide-react';
import { getContactChannelHref, loadPublicContactChannels } from '../../lib/contactApi';
import { ContactChannel, SiteNavigationItem } from '../../types';
import { useSiteProfile } from '../../context/SiteProfileContext';
import { loadNavigationItems } from '../../lib/navigationApi';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [contactChannels, setContactChannels] = useState<ContactChannel[]>([]);
  const [quickLinks, setQuickLinks] = useState<SiteNavigationItem[]>([]);
  const [policyLinks, setPolicyLinks] = useState<SiteNavigationItem[]>([]);
  const { profile } = useSiteProfile();

  useEffect(() => {
    void loadPublicContactChannels().then(setContactChannels);
    void loadNavigationItems('footer_quick_links').then(setQuickLinks).catch(() => {});
    void loadNavigationItems('footer_policy').then(setPolicyLinks).catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="relative bg-[#FFF9EB] border-t-2 border-[#C99B49]/40 pt-10 pb-28 md:pb-10 text-[#65716C] text-xs font-sans overflow-hidden">
      {/* Subtle Seigaiha watermark at top */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-0 inset-x-0 h-3 opacity-15 bg-repeat-x"
        style={{ 
          backgroundImage: `url('/assets/japanese-ui/seigaiha-pattern.svg')`,
          backgroundSize: '28px 14px' 
        }}
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 pb-10 border-b border-[#EAD7AD]">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3 group">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={`Logo ${profile.brandName}`} className="h-10 max-w-full object-contain object-left" />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-[10px] bg-[#9F1D24] text-[#FCEBC2] flex items-center justify-center font-bold shadow-sm border border-[#C99B49] group-hover:scale-105 transition-transform">大一</div>
                  <div>
                    <span className="text-lg font-black text-[#9F1D24] tracking-tight font-header block leading-none">{profile.brandName}</span>
                    <span className="text-[9px] uppercase tracking-widest text-[#C99B49] font-bold">{profile.tagline}</span>
                  </div>
                </>
              )}
            </Link>
            
            <p className="text-[11px] text-[#172E3D] font-bold mb-1">{profile.legalName}</p>
            <p className="text-[11px] text-[#65716C] leading-relaxed mb-3">
              {profile.companyDescription}
            </p>
            
            <div className="text-[10px] text-[#4A5568] space-y-1 mb-4">
              <div>📍 {profile.address}</div>
              <div>📞 <a href={`tel:${profile.hotline.replace(/[^\d+]/g, '')}`} className="hover:text-[#9F1D24] font-bold text-[#9F1D24]">{profile.hotline}</a></div>
              {profile.email ? <div>✉️ <a href={`mailto:${profile.email}`} className="hover:text-[#9F1D24]">{profile.email}</a></div> : null}
              <div>🏛️ MST: <span className="font-mono font-semibold">{profile.taxCode}</span></div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {contactChannels.filter((channel) => channel.id !== 'internal_chat').map((channel) => {
                const href = getContactChannelHref(channel);
                if (!href) return null;
                return (
                  <a
                    key={channel.id}
                    href={href}
                    target={channel.id === 'phone' ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={channel.label}
                    title={channel.label}
                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold hover:scale-105 transition shadow-xs ${
                      channel.id === 'phone' 
                        ? 'bg-[#9F1D24] border border-[#C99B49]' 
                        : channel.id === 'zalo' 
                          ? 'bg-[#0068FF] text-[9px]' 
                          : 'bg-[#1877F2] text-sm'
                    }`}
                  >
                    {channel.id === 'phone' ? '☎' : channel.id === 'zalo' ? 'Zalo' : 'f'}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Về DAICHI SUISAN */}
          <div>
            <h4 className="text-[#172E3D] font-black mb-3 text-xs sm:text-sm font-header">Về {profile.brandName}</h4>
            <ul className="space-y-2 text-[11px] text-[#65716C]">
              {quickLinks.length > 0 ? (
                quickLinks.map((item) => (
                  <li key={item.id}>
                    {item.isExternal ? (
                      <a href={item.url} target={item.openInNewTab ? '_blank' : undefined} rel={item.openInNewTab ? 'noopener noreferrer' : undefined} className="hover:text-[#9F1D24] transition font-medium">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.url} target={item.openInNewTab ? '_blank' : undefined} rel={item.openInNewTab ? 'noopener noreferrer' : undefined} className="hover:text-[#9F1D24] transition font-medium">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/about" className="hover:text-[#9F1D24] transition font-medium">Về chúng tôi</Link></li>
                  <li><Link to="/products" className="hover:text-[#9F1D24] transition">Sản phẩm</Link></li>
                  <li><Link to="/news" className="hover:text-[#9F1D24] transition">Tin tức ẩm thực</Link></li>
                  <li><Link to="/contact" className="hover:text-[#9F1D24] transition">Liên hệ &amp; Hợp tác</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Hỗ trợ & Chính sách */}
          <div>
            <h4 className="text-[#172E3D] font-black mb-3 text-xs sm:text-sm font-header">Chính sách & Hướng dẫn</h4>
            <ul className="space-y-2 text-[11px] text-[#65716C]">
              {policyLinks.length > 0 ? (
                policyLinks.map((item) => (
                  <li key={item.id}>
                    {item.isExternal ? (
                      <a href={item.url} target={item.openInNewTab ? '_blank' : undefined} rel={item.openInNewTab ? 'noopener noreferrer' : undefined} className="hover:text-[#9F1D24] transition">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.url} target={item.openInNewTab ? '_blank' : undefined} rel={item.openInNewTab ? 'noopener noreferrer' : undefined} className="hover:text-[#9F1D24] transition">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/help" className="hover:text-[#9F1D24] transition">Hướng dẫn mua hàng</Link></li>
                  <li><Link to="/shipping" className="hover:text-[#9F1D24] transition">Chính sách giao hàng</Link></li>
                  <li><Link to="/return" className="hover:text-[#9F1D24] transition">Chính sách đổi trả</Link></li>
                  <li><Link to="/privacy" className="hover:text-[#9F1D24] transition">Chính sách bảo mật</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 4: Đăng ký nhận ưu đãi */}
          <div className="lg:col-span-2">
            <h4 className="text-[#172E3D] font-black mb-1.5 text-xs sm:text-sm font-header">Đăng ký nhận ưu đãi</h4>
            <p className="text-[11px] text-[#65716C] mb-2.5">
              Nhận thông tin khuyến mãi và sản phẩm tươi mới nhất từ DAICHI SUISAN.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-1.5 mb-3.5">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn..." 
                className="bg-[#FFFDF7] border border-[#EAD7AD] text-xs text-[#172E3D] placeholder-[#A0AEC0] rounded-[10px] px-3 py-2 flex-1 focus:outline-none focus:ring-1 focus:ring-[#9F1D24]"
                required
              />
              <button 
                type="submit" 
                className="bg-[#9F1D24] text-[#FCEBC2] px-4 h-[38px] rounded-[10px] text-xs font-bold hover:bg-[#7D1319] transition hover:scale-[1.02] flex-shrink-0 border border-[#C99B49]/80 shadow-xs cursor-pointer"
              >
                Đăng ký
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-[#07583F] font-bold mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đăng ký thành công!</span>
              </p>
            )}

            {/* Badges row */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row flex-wrap items-start gap-2 pt-1 text-[10px] text-[#4A5568] font-medium">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#07583F]" />
                <span>Đã đăng ký Bộ Công Thương</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#C99B49]" />
                <span>Certified Japanese Standards</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9F1D24]" />
                <span>Thanh toán an toàn</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-[#65716C] gap-2">
          <div>© {new Date().getFullYear()} {profile.copyrightText}</div>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:text-[#9F1D24] hover:underline">Điều khoản</Link>
            <span className="text-[#C99B49]">|</span>
            <Link to="/privacy" className="hover:text-[#9F1D24] hover:underline">Bảo mật</Link>
            <span className="text-[#C99B49]">|</span>
            <Link to="/sitemap" className="hover:text-[#9F1D24] hover:underline">Sơ đồ website</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
