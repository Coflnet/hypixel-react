"use client";
import { useEffect } from 'react';

export default function NcmpConsentLink() {
  useEffect(() => {
    let interval: number | undefined;
    let attempts = 0;
    let nitroListener: (() => void) | null = null;

    const tryAdd = () => {
      const cmp = (window as any)['__cmp'];
      if (typeof cmp === 'function') {
        try {
          // ask the CMP to add the consent link
          cmp('addConsentLink');
        } catch (e) {
          // ignore any runtime errors from the CMP
        }
        if (interval) {
          window.clearInterval(interval);
        }
        return true;
      }
      return false;
    };

    const updateVisibility = () => {
      const box = document.getElementById('consent-box');
      if (!box) return;
      // show if __tcfapi exists, otherwise hide
      const hasTcfapi = typeof (window as any)['__tcfapi'] === 'function' || typeof (window as any)['__tcfapi'] === 'object';
      box.style.display = hasTcfapi ? '' : 'none';
    };

    const onNitroLoaded = () => {
      updateVisibility();
    };

    const onReady = () => {
      // try to add the CMP link immediately
      const added = tryAdd();

      // also ensure visibility is updated either now or once nitroAds loads
      if ((window as any)['nitroAds'] && (window as any)['nitroAds'].loaded) {
        updateVisibility();
      } else {
        nitroListener = onNitroLoaded;
        window.addEventListener('nitroAds.loaded', onNitroLoaded as EventListener);
      }

      if (!added) {
        // Poll for a short time in case the CMP is loaded later
        interval = window.setInterval(() => {
          attempts += 1;
          if (tryAdd() || attempts > 10) {
            if (interval) {
              window.clearInterval(interval);
            }
          }
        }, 500);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady, { once: true });
      return () => document.removeEventListener('DOMContentLoaded', onReady);
    }

    onReady();

    return () => {
      if (interval) window.clearInterval(interval);
      if (nitroListener) {
        window.removeEventListener('nitroAds.loaded', onNitroLoaded as EventListener);
      }
    };
  }, []);

  // Button calls CMP showModal when clicked
  const openModal = () => {
    try {
      (window as any)['__cmp'] && (window as any)['__cmp']('showModal');
    } catch (e) {
      // ignore
    }
  };

  return (
    <div id="consent-box" style={{ display: 'none' }}>
      <button onClick={openModal}>
        Update cookie preferences
      </button>
    </div>
  );
}
