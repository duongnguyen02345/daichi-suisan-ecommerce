import { Banner } from '../types';

export interface BannerSlide {
  id: string;
  banner: Banner;
  image: string;
  imageIndex: number;
}

export const getBannerImages = (banner: Banner) => {
  const candidates = banner.gallery?.length ? banner.gallery : [banner.image];
  return Array.from(new Set(candidates.map((url) => url.trim()).filter(Boolean))).slice(0, 10);
};

export const createBannerSlides = (banners: Banner[]): BannerSlide[] => banners.flatMap((banner) =>
  getBannerImages(banner).map((image, imageIndex) => ({
    id: `${banner.id}-${imageIndex}`,
    banner,
    image,
    imageIndex,
  })),
);
