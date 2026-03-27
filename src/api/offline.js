import { openDB } from 'idb';
import api from './api';

const DB_NAME = 'SocialDataOffline';
const VERSION = 3;

const dbPromise = openDB(DB_NAME, VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('templates')) { db.createObjectStore('templates', { keyPath: '_id' }); }
    if (!db.objectStoreNames.contains('ciudadanos')) { db.createObjectStore('ciudadanos', { keyPath: '_id' }); }
    if (!db.objectStoreNames.contains('pendientes')) { db.createObjectStore('pendientes', { autoIncrement: true }); }
    if (!db.objectStoreNames.contains('ciudadanosPendientes')) { db.createObjectStore('ciudadanosPendientes', { keyPath: '_id' }); }
    if (!db.objectStoreNames.contains('staff')) { db.createObjectStore('staff', { keyPath: '_id' }); }
    if (!db.objectStoreNames.contains('staffPendientes')) { db.createObjectStore('staffPendientes', { keyPath: '_id' }); }
  },
});

const localDb = {
  async saveTemplates(forms) {
    const db = await dbPromise;
    const tx = db.transaction('templates', 'readwrite');
    for (const f of forms) { await tx.store.put(f); }
    await tx.done;
  },
  async getTemplates() { return (await dbPromise).getAll('templates'); },

  async saveCiudadanoLocal(u) {
    const db = await dbPromise;
    const tempId = u._id || `offline_${Date.now()}`;
    const user = { ...u, _id: tempId };
    await db.put('ciudadanos', user);
    await db.put('ciudadanosPendientes', user);
    return tempId;
  },
  async saveCiudadanosList(citizens) {
    const db = await dbPromise;
    const tx = db.transaction('ciudadanos', 'readwrite');
    for (const c of citizens) { await tx.store.put(c); }
    await tx.done;
  },
  async searchCiudadanos(q) {
    const db = await dbPromise;
    const all = await db.getAll('ciudadanos');
    const low = (q || '').toLowerCase();
    return all.filter(c => (
      c.nombre?.toLowerCase().includes(low) || 
      c.apellido?.toLowerCase().includes(low) || 
      c.numero_documento?.includes(low)
    ));
  },
  async saveStaffLocal(u) {
    const db = await dbPromise;
    const tempId = u._id || `offline_${Date.now()}`;
    const user = { ...u, _id: tempId };
    await db.put('staff', user);
    await db.put('staffPendientes', user);
    return tempId;
  },
  async saveStaffList(staff) {
    const db = await dbPromise;
    const tx = db.transaction('staff', 'readwrite');
    for (const s of staff) { await tx.store.put(s); }
    await tx.done;
  },
  async deleteStaffLocal(id) {
    const db = await dbPromise;
    await db.delete('staff', id);
    await db.delete('staffPendientes', id);
  },
  async searchStaff(q) {
    const db = await dbPromise;
    const all = await db.getAll('staff');
    const low = (q || '').toLowerCase();
    return all.filter(s => (s.nombre?.toLowerCase().includes(low) || s.usuario?.toLowerCase().includes(low)));
  },

  async saveEncuestaOffline(payload) {
    const db = await dbPromise;
    return await db.add('pendientes', payload);
  },

  async getPendingCounts() {
    const db = await dbPromise;
    return { 
       ciudadanos: await db.count('ciudadanosPendientes'), 
       encuestas: await db.count('pendientes'),
       staff: await db.count('staffPendientes')
    };
  },

  // EL MOTOR DE SUBIDA DE ALTA VELOCIDAD (SYNC)
  async syncData(onProgress) {
    const db = await dbPromise;
    const pendingUsers = await db.getAll('ciudadanosPendientes');
    const pendingSurveys = await db.getAll('pendientes');
    
    let processed = 0;
    const total = pendingUsers.length + pendingSurveys.length;
    if (total === 0) return;

    const idMap = {}; // Para mapear IDs temporales a IDs reales

    // 1. SUBIDA DE CIUDADANOS (PRIORIDAD ALTA)
    for (const u of pendingUsers) {
       try {
          const { _id, ...userData } = u;
          let res;
          if (String(_id).startsWith('offline_')) {
             res = await api.post('/usuarios', userData);
          } else {
             res = await api.put(`/usuarios/${_id}`, userData);
          }

          if (res?.status === 200 || res?.status === 201) {
             if (String(_id).startsWith('offline_') && res.data?._id) { idMap[_id] = res.data._id; }
             await db.delete('ciudadanosPendientes', _id);
          }
       } catch (e) { console.error("Falla subida usuario:", e); }
       processed++;
       if (onProgress) onProgress(`Sincronizando Ciudadanos: ${processed}/${total}`);
    }

    // 1.5 SUBIDA DE STAFF
    const pendingStaff = await db.getAll('staffPendientes');
    for (const s of pendingStaff) {
       try {
          const { _id, ...staffData } = s;
          let res;
          if (String(_id).startsWith('offline_')) {
             res = await api.post('/staff', staffData);
          } else {
             // Si es edit, quitamos password si está vacío
             if (!staffData.password) delete staffData.password;
             res = await api.put(`/staff/${_id}`, staffData);
          }
          if (res?.status === 200 || res?.status === 201) {
             await db.delete('staffPendientes', _id);
          }
       } catch (e) { console.error("Falla subida staff:", e); }
       processed++;
       if (onProgress) onProgress(`Sincronizando Staff: ${processed}/${total}`);
    }

    // 2. SUBIDA DE ENCUESTAS (CON ACTUALIZACIÓN DE ID DE CIUDADANO)
    const surveyKeys = await db.getAllKeys('pendientes');
    for (let i = 0; i < pendingSurveys.length; i++) {
       const s = pendingSurveys[i];
       const key = surveyKeys[i];
       try {
          // Si el ciudadano era de campo, usamos el ID real que nos dio el server
          if (idMap[s.usuario_id]) { s.usuario_id = idMap[s.usuario_id]; }
          
          await api.post('/encuestas', s);
          await db.delete('pendientes', key);
       } catch (e) { console.error("Falla subida encuesta:", e); }
       processed++;
       if (onProgress) onProgress(`Subiendo Encuestas: ${processed}/${total}`);
    }

    return true;
  }
};

export default localDb;
