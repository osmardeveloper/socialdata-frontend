import { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, Box, Button, Alert } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import api from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    usuariosStaff: 0,
    usuariosPoblacion: 0,
    formularios: 0
  });

  const { isOnline, isSyncing, pendingSync, pendingCount, triggerPull, syncMessage, lastPullDate } = useOnlineStatus();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const staffRes = await api.get('/staff');
        const usuariosRes = await api.get('/usuarios?rol=poblacion');
        const preguntasRes = await api.get('/preguntas');
        setStats({
          usuariosStaff: staffRes.data.length,
          usuariosPoblacion: usuariosRes.data.length,
          formularios: preguntasRes.data.length,
        });
      } catch (err) {
        // Manejo silencioso en offline
      }
    };
    fetchStats();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 4, p: 4, bgcolor: 'white', borderRadius: 3, boxShadow: 1, borderLeft: 5, borderColor: 'primary.main' }}>
        <Typography variant="h3" gutterBottom color="primary.main">Dashboard de Caracterización</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.8 }}>
          Bienvenido al sistema de construcción de formularios dinámicos para la caracterización de poblaciones. 
          Esta plataforma permite diseñar, gestionar y analizar formularios personalizados que facilitan la 
          recolección de información relevante en distintos contextos sociales, administrativos y de investigación. 
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 3, bgcolor: '#e3f2fd', color: '#1565c0' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#bbdefb', borderRadius: '50%' }}>
              <AssignmentIndIcon fontSize="large" />
            </Box>
            <CardContent sx={{ flex: 1, p: 0 }}>
              <Typography variant="h5" fontWeight="bold">{stats.usuariosStaff}</Typography>
              <Typography variant="subtitle1" fontWeight="medium">Personal (Staff)</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 3, bgcolor: '#eceff1', color: '#455a64' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#cfd8dc', borderRadius: '50%' }}>
              <GroupIcon fontSize="large" />
            </Box>
            <CardContent sx={{ flex: 1, p: 0 }}>
              <Typography variant="h5" fontWeight="bold">{stats.usuariosPoblacion}</Typography>
              <Typography variant="subtitle1" fontWeight="medium">Población Registrada</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 3, bgcolor: '#e0f2f1', color: '#00695c' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#b2dfdb', borderRadius: '50%' }}>
              <AssignmentIcon fontSize="large" />
            </Box>
            <CardContent sx={{ flex: 1, p: 0 }}>
              <Typography variant="h5" fontWeight="bold">{stats.formularios}</Typography>
              <Typography variant="subtitle1" fontWeight="medium">Formularios (Constructor)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección Offline con Sello Permanente */}
      <Box sx={{ mt: 6, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: isOnline ? 'rgba(76, 175, 80, 0.04)' : 'rgba(244, 67, 54, 0.04)' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {isOnline ? '🟢 Preparación para Salida a Campo' : '🔴 Modo Offline Activado'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {isOnline 
            ? 'Si vas a trabajar en zonas sin internet, pulsa el botón para actualizar las plantillas y formularios en este dispositivo.'
            : 'Actualmente no tienes conexión. Los datos recaudados se sincronizarán al recuperar la señal.'}
        </Typography>
        {isOnline && (
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<CloudDownloadIcon />} 
            onClick={triggerPull}
            disabled={isSyncing}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            Descargar plantillas para uso offline
          </Button>
        )}
        
        {/* EL ESTADO DE SINCRONIZACIÓN Y FECHA PERMANENTE */}
        {(syncMessage || lastPullDate) && (
           <Alert 
             severity={
                syncMessage.toLowerCase().includes('no se pudo') || syncMessage.toLowerCase().includes('error') ? 'error' : 
                syncMessage.toLowerCase().includes('correctamente') || syncMessage.toLowerCase().includes('completada') ? 'success' : 'info'
             }
             sx={{ mt: 2, borderRadius: 2 }}
           >
             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {syncMessage && <Typography fontWeight="bold" sx={{ fontSize: '0.9rem' }}>{syncMessage}</Typography>}
                {lastPullDate && (
                   <Typography variant="caption" sx={{ fontWeight: '800', opacity: 0.9 }}>
                      📅 Datos actualizados hasta: {lastPullDate}
                   </Typography>
                )}
             </Box>
           </Alert>
        )}

        {!isOnline && pendingSync && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            ⚠️ Tienes {pendingCount} registros locales pendientes de subir a la nube.
          </Alert>
        )}
      </Box>
    </Box>
  );
}
