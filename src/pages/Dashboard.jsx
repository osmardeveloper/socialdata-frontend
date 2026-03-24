import { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, Box } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import api from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    usuariosStaff: 0,
    usuariosPoblacion: 0,
    formularios: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const staffRes = await api.get('/staff');
        const usuariosRes = await api.get('/usuarios');
        const preguntasRes = await api.get('/preguntas');
        setStats({
          usuariosStaff: staffRes.data.length,
          usuariosPoblacion: usuariosRes.data.length,
          formularios: preguntasRes.data.length,
        });
      } catch (err) {
        // En caso de que sea encuestador no podrá ver staff, se maneja el error silencioamente
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
          A través de una interfaz intuitiva, podrás crear preguntas adaptables, gestionar usuarios y optimizar 
          los procesos de levantamiento de datos.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 3, bgcolor: '#e3f2fd', color: '#1565c0' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#bbdefb', borderRadius: '50%' }}>
              <AssignmentIndIcon fontSize="large" />
            </Box>
            <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
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
            <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
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
            <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
              <Typography variant="h5" fontWeight="bold">{stats.formularios}</Typography>
              <Typography variant="subtitle1" fontWeight="medium">Formularios (Constructor)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
