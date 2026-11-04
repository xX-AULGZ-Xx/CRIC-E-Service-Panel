'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ServiceItem } from '@/types/service';
import { 
  Grip, 
  Pencil, 
  Check, 
  ExternalLink, 
  Plus, 
  X, 
  Star,
  Globe,
  Layers
} from 'lucide-react';

interface AppLauncherProps {
  currentRole?: string;
  onServicesChange?: () => void;
}

export default function AppLauncher({ currentRole, onServicesChange }: AppLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch(`/api/v1/services${currentRole ? `?role=${currentRole}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServices(data.data);
      }
    } catch (err) {
      console.error('Failed to load services for launcher', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [currentRole, isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditMode(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleFavorite = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/v1/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, action: 'toggle' }),
      });
      const result = await res.json();
      if (result.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, isFavorite: result.isFavorite } : s))
        );
        onServicesChange?.();
      }
    } catch (err) {
      console.error('Error toggling favorite', err);
    }
  };

  const favoriteServices = services
    .filter((s) => s.isFavorite)
    .sort((a, b) => (a.favoriteOrder ?? 999) - (b.favoriteOrder ?? 999));

  const otherServices = services.filter((s) => !s.isFavorite);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* 9-Dots Google Style Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="CRIC E-Service Launcher"
        aria-label="CRIC E-Service Launcher"
        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isOpen
            ? 'bg-neutral-200 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-md ring-2 ring-blue-500/40'
            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:scale-95'
        }`}
      >
        <Grip className="w-5 h-5" />
      </button>

      {/* Google-Style Popover Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-[360px] max-w-[360px] max-h-[75vh] sm:max-h-[580px] overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1e1f20] border border-neutral-200 dark:border-[#3c4043] shadow-2xl z-50 flex flex-col text-neutral-800 dark:text-white animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header: Your Favorites & Edit Button */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-neutral-100 dark:border-[#3c4043]/40">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                Your favorites
              </span>
              {favoriteServices.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-normal">
                  {favoriteServices.length}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                isEditMode
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={isEditMode ? 'Done editing' : 'Customize favorites'}
            >
              {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </button>
          </div>

          {/* Edit Mode Notice Banner */}
          {isEditMode && (
            <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900/60 px-4 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
              <span>คลิก ✕ หรือ ＋ เพื่อเพิ่ม/ลบรายการโปรด</span>
              <button
                onClick={() => setIsEditMode(false)}
                className="font-semibold underline hover:text-blue-900 dark:hover:text-white"
              >
                เสร็จสิ้น
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">กำลังโหลดบริการ...</span>
              </div>
            ) : services.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Layers className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">ยังไม่มีบริการในระบบ</p>
                <p className="text-xs text-neutral-500 mt-1">
                  ผู้ดูแลระบบ (Admin) สามารถเพิ่มบริการใหม่ผ่านเมนู Admin Management
                </p>
              </div>
            ) : (
              <>
                {/* 3-Column Grid for Favorites */}
                {favoriteServices.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 px-1 py-1">
                    {favoriteServices.map((service) => (
                      <ServiceLauncherItem
                        key={service.id}
                        service={service}
                        isEditMode={isEditMode}
                        isFavorite={true}
                        onToggleFavorite={(e) => toggleFavorite(service.id, e)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-neutral-500 px-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl mx-1 my-2">
                    <Star className="w-5 h-5 text-neutral-400 dark:text-neutral-600 mx-auto mb-1" />
                    ยังไม่ได้เลือกบริการโปรด (กดปุ่มดินสอเพื่อเลือก)
                  </div>
                )}

                {/* More Services Section */}
                {otherServices.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-[#3c4043]/40">
                    <div className="px-2 mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        {isEditMode ? 'บริการอื่นๆ ที่สามารถเพิ่มเป็นรายการโปรดได้' : 'More CRIC Services'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 px-1">
                      {otherServices.map((service) => (
                        <ServiceLauncherItem
                          key={service.id}
                          service={service}
                          isEditMode={isEditMode}
                          isFavorite={false}
                          onToggleFavorite={(e) => toggleFavorite(service.id, e)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-3 bg-neutral-50 dark:bg-[#18191a] border-t border-neutral-200 dark:border-[#3c4043]/50 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              CRIC E-Service Panel
            </span>
            <a
              href="/admin/services"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Admin Setup
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

interface ServiceLauncherItemProps {
  service: ServiceItem;
  isEditMode: boolean;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

function ServiceLauncherItem({
  service,
  isEditMode,
  isFavorite,
  onToggleFavorite,
}: ServiceLauncherItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      onToggleFavorite(e);
      return;
    }
    if (service.openInNewTab) {
      window.open(service.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = service.url;
    }
  };

  return (
    <div
      onClick={handleClick}
      title={`${service.title}${service.description ? ` - ${service.description}` : ''}`}
      className={`group relative flex flex-col items-center justify-start p-2 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
        isEditMode
          ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800/90 ring-1 ring-neutral-200 dark:ring-neutral-700/50'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:scale-95'
      }`}
    >
      {/* Edit Mode Badge (Minus or Plus) */}
      {isEditMode && (
        <button
          onClick={onToggleFavorite}
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md z-10 transition-transform hover:scale-110 ${
            isFavorite ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
          title={isFavorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          {isFavorite ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      )}

      {/* App Icon Container */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 transition-transform duration-200 group-hover:scale-105 overflow-hidden">
        {service.iconUrl ? (
          <img
            src={service.iconUrl}
            alt=""
            className="w-10 h-10 object-contain drop-shadow-sm"
            onError={(e) => {
              const el = e.target as HTMLElement;
              el.style.display = 'none';
              const parent = el.parentElement;
              if (parent) {
                parent.classList.add('bg-neutral-100', 'dark:bg-neutral-800');
                if (!parent.querySelector('svg')) {
                  const fallback = document.createElement('span');
                  fallback.innerHTML = '🌐';
                  fallback.className = 'text-xl select-none';
                  parent.appendChild(fallback);
                }
              }
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* App Name */}
      <span className="text-[12px] font-normal text-neutral-700 dark:text-neutral-200 text-center line-clamp-1 max-w-[84px] group-hover:text-neutral-950 dark:group-hover:text-white leading-tight">
        {service.title}
      </span>
    </div>
  );
}
