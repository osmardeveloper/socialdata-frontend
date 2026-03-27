import React, { useState, useMemo, useRef } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, Divider, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Grid, Paper, Stack,
  TextField, MenuItem, Button, IconButton, useTheme, Card, CardContent,
  LinearProgress, Chip, Fade
} from '@mui/material';

// Iconos Profesionales
import DashboardIcon from '@mui/icons-material/Dashboard';
import PollIcon from '@mui/icons-material/Poll';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import UpdateIcon from '@mui/icons-material/Update';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

// Gráficos y Exportación
import { BarChart, PieChart } from '@mui/x-charts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const drawerWidth = 260;

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const printRef = useRef(null);
  
  // --- ESTADO GLOBAL ---
  const [selectedSurvey, setSelectedSurvey] = useState("Encuesta de Salud 2024");
  const [view, setView] = useState("general"); // general | preguntas | reportes
  const [filters, setFilters] = useState({ date: 'all', staff: 'todos', location: 'todos' });

  // --- MOCK DATA (Simulando API) ---
  const surveysList = ["Encuesta de Salud 2024", "Clima Organizacional", "Satisfacción del Ciudadano"];
  
  const stats = useMemo(() => ({
    totalResponses: 1248,
    uniqueRespondents: 1102,
    completionRate: 88,
    lastUpdate: 'Hace 5 minutos'
  }), []);

  const chartData = [
    { label: 'Urbano', value: 750, color: '#1976d2' },
    { label: 'Rural', value: 498, color: '#2e7d32' }
  ];

  // --- FUNCIONES DE EXPORTACIÓN ---
  const handleExportPDF = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
    pdf.save(`Reporte_SocialData_${selectedSurvey}.pdf`);
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      {/* 1. SIDEBAR (Power BI Style) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#001e3c', color: 'white' },
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
          <PollIcon sx={{ fontSize: 35, mr: 1, color: '#4fc3f7' }} />
          <Typography variant="h6" fontWeight="bold">SocialData</Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <List sx={{ px: 1 }}>
          <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', opacity: 0.6 }}>PRINCIPAL</Typography>
          {[
            { text: 'Vista General', icon: <DashboardIcon />, id: 'general' },
            { text: 'Análisis x Pregunta', icon: <PollIcon />, id: 'preguntas' },
            { text: 'Reportes Detallados', icon: <PictureAsPdfIcon />, id: 'reportes' },
          ].map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                selected={view === item.id}
                onClick={() => setView(item.id)}
                sx={{ 
                  borderRadius: 2, 
                  '&.Mui-selected': { bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } } 
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <List sx={{ px: 1 }}>
          <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', opacity: 0.6 }}>MIS ENCUESTAS</Typography>
          {surveysList.map((survey) => (
            <ListItemButton 
              key={survey} 
              selected={selectedSurvey === survey} 
              onClick={() => setSelectedSurvey(survey)}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemText primary={survey} primaryTypographyProps={{ fontSize: 13, noWrap: true }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* 2. CONTENIDO PRINCIPAL */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, transition: '0.3s' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', color: 'text.primary', mb: 3 }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0', pb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">{selectedSurvey}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip icon={<DashboardIcon fontSize="small" />} label={view.toUpperCase()} size="small" color="primary" variant="outlined" />
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <UpdateIcon fontSize="inherit" sx={{ mr: 0.5 }} /> {stats.lastUpdate}
                </Typography>
              </Stack>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                startIcon={<PictureAsPdfIcon />} 
                onClick={handleExportPDF}
                sx={{ borderRadius: 2, px: 3, fontWeight: 'bold', bgcolor: '#001e3c' }}
              >
                Exportar Reporte
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* CONTENEDOR DE REPORTES (PARA PDF) */}
        <Box ref={printRef}>
          {/* HEADER DE FILTROS */}
          <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterAltIcon color="action" />
              <Typography fontWeight="bold">Filtros Globales:</Typography>
            </Stack>
            <TextField 
              select 
              size="small" 
              label="Rango de Fecha" 
              value={filters.date} 
              sx={{ minWidth: 150 }}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
            >
              <MenuItem value="all">Todo el periodo</MenuItem>
              <MenuItem value="today">Hoy</MenuItem>
              <MenuItem value="month">Este Mes</MenuItem>
            </TextField>
            <TextField 
              select 
              size="small" 
              label="Ubicación" 
              value={filters.location} 
              sx={{ minWidth: 150 }}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            >
              <MenuItem value="todos">Todas las sedes</MenuItem>
              <MenuItem value="norte">Sede Norte</MenuItem>
              <MenuItem value="sur">Sede Sur</MenuItem>
            </TextField>
          </Paper>

          {/* 3. SECCIÓN KPIs */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Respuestas Totales" value={stats.totalResponses} icon={<PollIcon color="primary" />} trend="+12% vs mes anterior" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Encuestados Únicos" value={stats.uniqueRespondents} icon={<GroupIcon color="success" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%', border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">Tasa de Finalización</Typography>
                  <Typography variant="h4" sx={{ my: 1, fontWeight: 'bold' }}>{stats.completionRate}%</Typography>
                  <LinearProgress variant="determinate" value={stats.completionRate} sx={{ borderRadius: 5, height: 8 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Carga de Datos" value="Óptima" icon={<UpdateIcon color="warning" />} sub="Tiempo real activo" />
            </Grid>
          </Grid>

          {/* 4. SECCIÓN GRÁFICOS PRINCIPALES */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Distribución Geográfica</Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                  <BarChart
                    xAxis={[{ scaleType: 'band', data: chartData.map(d => d.label) }]}
                    series={[{ data: chartData.map(d => d.value), label: 'Votos', color: '#1976d2' }]}
                    height={350}
                    margin={{ top: 20, bottom: 60, left: 40 }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Composición de Población</Typography>
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart
                    series={[{
                      data: chartData.map((d, i) => ({ id: i, value: d.value, label: d.label, color: d.color })),
                      innerRadius: 80,
                      outerRadius: 130,
                      paddingAngle: 5,
                      cornerRadius: 5,
                    }]}
                    height={300}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

// --- COMPONENTE KPI CARD REUTILIZABLE ---
const KpiCard = ({ title, value, icon, trend, sub }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0', height: '100%' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>{title}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
          {trend && <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>{trend}</Typography>}
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.03)', width: 45, height: 45 }}>{icon}</Avatar>
      </Stack>
    </CardContent>
  </Card>
);

export default AnalyticsDashboard;
