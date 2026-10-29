import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Crosshair, Loader2, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import { DeliveryLocation } from '../../types';

interface CheckoutAddressProps {
  value: DeliveryLocation;
  onChange: (location: DeliveryLocation) => void;
}

let googleMapsPromise: Promise<any> | null = null;

const loadGoogleMaps = (apiKey: string) => {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-freshmart-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', () => reject(new Error('Không thể tải Google Maps.')));
      return;
    }

    const script = document.createElement('script');
    script.dataset.freshmartGoogleMaps = 'true';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=vi&region=VN`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Không thể tải Google Maps.'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const CheckoutAddress: React.FC<CheckoutAddressProps> = ({ value, onChange }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const mapElementRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [message, setMessage] = useState<string>('');

  const setMarker = (google: any, latitude: number, longitude: number) => {
    if (!mapElementRef.current) return;
    const position = { lat: latitude, lng: longitude };

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapElementRef.current, {
        center: position,
        zoom: 17,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    } else {
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(17);
    }

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position,
        draggable: true,
        title: 'Vị trí giao hàng',
      });
      markerRef.current.addListener('dragend', async (event: any) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        if (typeof lat === 'number' && typeof lng === 'number') {
          await reverseGeocode(google, lat, lng, 'manual');
        }
      });
    } else {
      markerRef.current.setPosition(position);
    }
  };

  const reverseGeocode = async (
    google: any,
    latitude: number,
    longitude: number,
    source: DeliveryLocation['source'],
    accuracyMeters?: number,
  ) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
      const result = response.results?.[0];
      onChange({
        formattedAddress: result?.formatted_address || value.formattedAddress,
        latitude,
        longitude,
        placeId: result?.place_id,
        accuracyMeters,
        source,
      });
      setMarker(google, latitude, longitude);
      setMessage(result ? 'Đã gợi ý địa chỉ gần vị trí của bạn. Vui lòng kiểm tra lại.' : 'Đã lấy tọa độ. Vui lòng nhập địa chỉ chi tiết.');
    } catch {
      onChange({ ...value, latitude, longitude, accuracyMeters, source });
      setMessage('Đã lấy tọa độ nhưng chưa thể đọc địa chỉ. Vui lòng nhập địa chỉ chi tiết.');
    }
  };

  useEffect(() => {
    if (!apiKey || !mapElementRef.current || !autocompleteElementRef.current) return;

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled) return;
        const initialPosition = {
          lat: value.latitude ?? 10.7769,
          lng: value.longitude ?? 106.7009,
        };
        setMarker(google, initialPosition.lat, initialPosition.lng);

        const autocomplete = new google.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: ['vn'],
        });
        autocomplete.placeholder = 'Tìm địa chỉ giao hàng trên Google Maps';
        autocompleteElementRef.current?.replaceChildren(autocomplete);
        autocomplete.addEventListener('gmp-select', async (event: any) => {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ['formattedAddress', 'location', 'id'] });
          const latitude = place.location?.lat();
          const longitude = place.location?.lng();
          if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
          onChange({
            formattedAddress: place.formattedAddress || '',
            latitude,
            longitude,
            placeId: place.id,
            source: 'autocomplete',
          });
          setMarker(google, latitude, longitude);
          setMessage('Đã chọn địa chỉ từ Google Maps.');
        });
        setMapReady(true);
      })
      .catch(() => setMessage('Không thể tải Google Maps. Bạn vẫn có thể nhập địa chỉ thủ công.'));

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Thiết bị không hỗ trợ lấy vị trí. Vui lòng nhập địa chỉ thủ công.');
      return;
    }

    setIsLocating(true);
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracyMeters = Math.round(position.coords.accuracy);
        if (apiKey) {
          try {
            const google = await loadGoogleMaps(apiKey);
            await reverseGeocode(google, latitude, longitude, 'gps', accuracyMeters);
          } catch {
            onChange({ ...value, latitude, longitude, accuracyMeters, source: 'gps' });
            setMessage('Đã lấy tọa độ. Vui lòng nhập địa chỉ chi tiết.');
          }
        } else {
          onChange({ ...value, latitude, longitude, accuracyMeters, source: 'gps' });
          setMessage('Đã lấy tọa độ. Thêm Google Maps API key để tự động gợi ý địa chỉ.');
        }
        setIsLocating(false);
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setMessage(denied ? 'Bạn chưa cho phép truy cập vị trí. Vui lòng nhập địa chỉ thủ công.' : 'Không thể xác định vị trí hiện tại. Vui lòng thử lại.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 sm:p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0E7A32] flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Địa chỉ giao hàng</h3>
            <p className="text-xs text-gray-500">Chọn trên bản đồ hoặc nhập địa chỉ chính xác</p>
          </div>
        </div>
        <button type="button" onClick={handleCurrentLocation} disabled={isLocating} className="h-[38px] px-3 rounded-xl bg-emerald-50 text-[#0E7A32] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 disabled:opacity-60">
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
          {isLocating ? 'Đang xác định...' : 'Dùng vị trí hiện tại'}
        </button>
      </div>

      {apiKey ? <div ref={autocompleteElementRef} className="w-full min-h-[44px]" /> : (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Chưa có Google Maps API key. Định vị GPS vẫn hoạt động, nhưng địa chỉ cần được nhập thủ công.</span>
        </div>
      )}

      {apiKey && <div ref={mapElementRef} className={`w-full h-[260px] rounded-xl border border-gray-200 overflow-hidden ${mapReady ? '' : 'bg-gray-100'}`} />}

      <div>
        <label htmlFor="delivery-address" className="block text-xs font-bold text-gray-700 mb-1.5">Địa chỉ chi tiết *</label>
        <textarea id="delivery-address" required minLength={10} maxLength={250} rows={3} value={value.formattedAddress} onChange={(event) => onChange({ ...value, formattedAddress: event.target.value, source: 'manual' })} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7A32] resize-none" />
      </div>

      {value.latitude && value.longitude && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs">
          <div className="flex items-start gap-2 text-emerald-900">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}{value.accuracyMeters ? ` · sai số khoảng ${value.accuracyMeters}m` : ''}</span>
          </div>
          <a href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`} target="_blank" rel="noreferrer" className="text-[#0E7A32] font-bold flex items-center gap-1 hover:underline"><Navigation className="w-3.5 h-3.5" /> Mở Google Maps</a>
        </div>
      )}

      {message && <div className="text-xs text-gray-600 flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-[#0E7A32] flex-shrink-0" /><span>{message}</span></div>}
    </div>
  );
};

declare global {
  interface Window {
    google?: any;
  }
}
