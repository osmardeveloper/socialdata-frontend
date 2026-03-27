import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/api';
import localDb from '../api/offline';

const OnlineStatusContext = createContext(null);
const POLL_INTERVAL_MS = 15000;

export function OnlineStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastPullDate, setLastPullDate] = useState(localStorage.getItem('lastPullDate') || null);
  const prevOnline = useRef(true);

  // 1. MOTOR DE ESTADO (Independiente)
  const checkStatus = useCallback(async () => {
    try {
      const res = await api.get('/status');
      const { online, pendingSync: pending, pendingCount: count } = res.data;

      // Al volver online, disparamos la sync de forma segura
      if (!prevOnline.current && online) {
        // Usamos setImmediate o un microtask para no bloquear el render
        Promise.resolve().then(() => triggerSync());
      }
      
      // Limpieza automática al terminar sync
      if (prevOnline.current && online && !pending && isSyncing) {
        setSyncMessage('');
        setIsSyncing(false);
      }

      prevOnline.current = online;
      setIsOnline(online);
      setPendingSync(pending);
      setPendingCount(count);
      setLastChecked(new Date());
    } catch (err) {
      setIsOnline(false);
      prevOnline.current = false;
    }
  }, [isSyncing]); // Quitamos triggerSync de aquí para romper el bucle

  // 2. MOTOR DE SINCRONIZACIÓN (Llamado manual o por checkStatus)
  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Subiendo datos locales...');
    try {
      // IndexedDB -> API
      await localDb.syncData((msg) => setSyncMessage(msg));
      
      // API -> Nube
      setSyncMessage('Sincronizando con la nube...');
      const res = await api.post('/status/sync');
      if (res.data.result?.status === 'completed') {
        setSyncMessage('Sincronización completada');
        setTimeout(() => setSyncMessage(''), 4000);
      }
      // Llamamos a checkStatus al final para refrescar
      checkStatus();
    } catch (err) {
      setSyncMessage('Error al sincronizar');
      setTimeout(() => setSyncMessage(''), 4000);
      setIsSyncing(false);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkStatus]);

  // 3. MOTOR DE DESCARGA (Pull)
  const triggerPull = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Descargando plantillas...');
    try {
      await api.post('/status/pull');
      const now = new Date();
      const options = { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
      const formattedDate = now.toLocaleString('es-ES', options).replace(',', ' a las');
      
      setLastPullDate(formattedDate);
      localStorage.setItem('lastPullDate', formattedDate);
      
      setSyncMessage('Plantillas descargadas correctamente');
      setTimeout(() => setSyncMessage(''), 4000);
      checkStatus();
    } catch (err) {
      setSyncMessage(''); // Ocultamos el mensaje de error
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkStatus]);

  useEffect(() => {
    checkStatus();
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
  }, [isOnline, syncMessage]);

  return (
    <OnlineStatusContext.Provider value={{
      isOnline,
      pendingSync,
      pendingCount,
      isSyncing,
      syncMessage,
      lastPullDate,
      lastChecked,
      triggerSync,
      triggerPull,
      checkStatus
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
