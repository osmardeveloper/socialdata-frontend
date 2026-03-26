/**
 * context/OnlineStatusContext.jsx
 * Contexto global para el estado de conectividad.
 * - Consulta /api/status cada 15 segundos
 * - Expone: isOnline, pendingSync, pendingCount, isSyncing, triggerSync
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/api';

const OnlineStatusContext = createContext(null);

const POLL_INTERVAL_MS = 15000; // 15 segundos

export function OnlineStatusProvider({ children }) {
  const [isOnline, setIsOnline]         = useState(true);
  const [pendingSync, setPendingSync]   = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing]       = useState(false);
  const [lastChecked, setLastChecked]   = useState(null);
  const [syncMessage, setSyncMessage]   = useState('');
  const prevOnline = useRef(true);

  const checkStatus = useCallback(async () => {
    try {
      const res = await api.get('/status');
      const { online, pendingSync: pending, pendingCount: count } = res.data;

      // Detectar transición OFFLINE → ONLINE
      if (!prevOnline.current && online) {
        setSyncMessage('Sincronizando datos...');
        setIsSyncing(true);
      }

      // Detectar fin de sync
      if (prevOnline.current && online && !pending && isSyncing) {
        setSyncMessage('');
        setIsSyncing(false);
      }

      prevOnline.current = online;
      setIsOnline(online);
      setPendingSync(pending);
      setPendingCount(count);
      setLastChecked(new Date());
    } catch {
      // Si el endpoint falla → estamos offline (o el servidor caído)
      setIsOnline(false);
      prevOnline.current = false;
    }
  }, [isSyncing]);

  // Sincronización manual
  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Sincronizando datos...');
    try {
      const res = await api.post('/status/sync');
      const { result } = res.data;
      if (result.status === 'completed') {
        setSyncMessage('✅ Sincronización completada');
        setTimeout(() => setSyncMessage(''), 4000);
      } else {
        setSyncMessage(`Estado: ${result.status}`);
      }
      await checkStatus(); // Refrescar counts
    } catch (err) {
      setSyncMessage('❌ Error al sincronizar');
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkStatus]);

  // Descarga de plantillas (PULL)
  const triggerPull = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Descargando plantillas...');
    try {
      const res = await api.post('/status/pull');
      setSyncMessage('✅ Plantillas descargadas');
      setTimeout(() => setSyncMessage(''), 4000);
      await checkStatus();
    } catch (err) {
      setSyncMessage('❌ Error al descargar plantillas');
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkStatus]);

  // Polling periódico
  useEffect(() => {
    checkStatus(); // Inmediato al montar
    const interval = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Mensaje offline persistente
  useEffect(() => {
    if (!isOnline) {
      setSyncMessage('Trabajando en modo offline');
    } else if (syncMessage === 'Trabajando en modo offline') {
      setSyncMessage('');
    }
  }, [isOnline]);

  return (
    <OnlineStatusContext.Provider value={{
      isOnline,
      pendingSync,
      pendingCount,
      isSyncing,
      syncMessage,
      lastChecked,
      triggerSync,
      triggerPull,
      checkStatus,
    }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatus() {
  const ctx = useContext(OnlineStatusContext);
  if (!ctx) throw new Error('useOnlineStatus debe usarse dentro de OnlineStatusProvider');
  return ctx;
}
