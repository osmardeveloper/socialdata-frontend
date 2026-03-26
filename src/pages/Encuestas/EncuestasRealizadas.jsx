import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, Divider,
  Chip, Accordion, AccordionSummary, AccordionDetails, MenuItem, TextField,
  IconButton, Grid, Stack, Avatar, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import EventIcon from '@mui/icons-material/Event';
import { BarChart } from '@mui/x-charts';
import api from '../../api/api';

export default function EncuestasRealizadas() {
  const [encuestas, setEncuestas] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [filtroFormulario, setFiltroFormulario] = useState('todos');
  const [open, setOpen] = useState(false);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);
  
  const [dashOpen, setDashOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);

  const [namesDialogOpen, setNamesDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedOptionLabel, setSelectedOptionLabel] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, fRes] = await Promise.all([
          api.get('/encuestas'),
          api.get('/formularios')
        ]);
        setEncuestas(eRes.data || []);
        setFormularios(fRes.data || []);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      }
    };
    load();
  }, []);

  const encuestasFiltradas = useMemo(() => {
    if (filtroFormulario === 'todos') return encuestas;
    return encuestas.filter(e => e.formulario_id?._id === filtroFormulario || e.formulario_id?.id === filtroFormulario);
  }, [encuestas, filtroFormulario]);

  const agrupadas = useMemo(() => {
    const grupos = {};
    encuestasFiltradas.forEach(e => {
      const key = e.formulario_id?._id || e.formulario_id?.id || 'sin_formulario';
      const titulo = e.formulario_id?.titulo || 'Sin formulario';
      const formOriginal = formularios.find(f => (f._id || f.id) === key);
      if (!grupos[key]) grupos[key] = { titulo, items: [], formOriginal };
      grupos[key].items.push(e);
    });
    return Object.values(grupos);
  }, [encuestasFiltradas, formularios]);

  const handleOpenDetalle = (enc) => { setSelectedEncuesta(enc); setOpen(true); };
  const handleOpenDashboard = (grupo) => { setSelectedGrupo(grupo); setDashOpen(true); };

  const getEdadSeguraLimpia = (encuesta) => {
    if (!encuesta) return '—';
    const u = encuesta.usuario_id;
    if (!u) return '—';
    const directKeys = ['edad', 'Edad', 'EDAD', 'age', 'AGE', 'years'];
    for (let key of directKeys) {
      const val = u[key];
      if (val && typeof val !== 'boolean' && !isNaN(val) && Number(val) > 0 && Number(val) < 120) return val;
    }
    if (Array.isArray(encuesta.respuestas)) {
      const rEdadValida = encuesta.respuestas.find(r => {
        const nombreMatch = (r.pregunta_nombre || '').toLowerCase().includes('edad') || 
                            (r.pregunta_id?.detalles?.[0]?.nombre || '').toLowerCase().includes('edad');
        const esNumeroValido = r.respuesta && typeof r.respuesta !== 'boolean' && !isNaN(r.respuesta) && Number(r.respuesta) > 2 && Number(r.respuesta) < 110;
        return nombreMatch && esNumeroValido;
      });
      if (rEdadValida) return rEdadValida.respuesta;
      const rCualquiera = encuesta.respuestas.find(r => 
        r.respuesta && typeof r.respuesta !== 'boolean' && !isNaN(r.respuesta) && Number(r.respuesta) > 5 && Number(r.respuesta) < 100
      );
      if (rCualquiera) return rCualquiera.respuesta;
    }
    const nidos = [u.metadata, u.datos_adicionales, u.info, u._doc];
    for (let nido of nidos) {
      if (nido) {
         const v = nido.edad || nido.Edad;
         if (v && typeof v !== 'boolean' && !isNaN(v)) return v;
      }
    }
    return '—';
  };

  const statsPro = useMemo(() => {
    if (!selectedGrupo || !selectedGrupo.formOriginal) return [];
    const items = selectedGrupo.items || [];
    const graficos = [];
    const procesarPregunta = (pregunta, level = 0, parentTitle = '') => {
      if (!pregunta) return;
      if (['simple', 'multiple'].includes(pregunta.tipo) && pregunta.data?.length > 1) {
        const dataMap = {};
        const labels = (pregunta.data || []).map(opt => typeof opt === 'string' ? opt : opt?.text);
        labels.forEach(lbl => { if (lbl) dataMap[lbl] = { count: 0, users: [] }; });
        items.forEach(it => {
          if (!it.respuestas) return;
          const rObj = it.respuestas.find(r => (r.pregunta_id?._id || r.pregunta_id?.id || r.pregunta_id) === (pregunta._id || pregunta.id));
          if (rObj && rObj.respuesta) {
            const userName = `${it.usuario_id?.nombre || 'Ciudadano'} ${it.usuario_id?.apellido || ''}`.trim();
            const userAge = getEdadSeguraLimpia(it);
            const handleValue = (val) => {
              if (dataMap[val]) { dataMap[val].count++; dataMap[val].users.push({name: userName, age: userAge}); }
            };
            if (Array.isArray(rObj.respuesta)) rObj.respuesta.forEach(handleValue);
            else handleValue(rObj.respuesta);
          }
        });
        const sortedLabels = Object.keys(dataMap);
        const sortedValues = sortedLabels.map(l => dataMap[l].count);
        if (sortedValues.some(v => v > 0)) {
          graficos.push({
            titulo: pregunta.nombre, parentTitle, level,
            xAxisData: sortedLabels, seriesData: sortedValues, usersMap: dataMap,
            totalRespuestas: sortedValues.reduce((a, b) => a + b, 0)
          });
        }
        (pregunta.data || []).forEach(opt => {
          if (opt && typeof opt !== 'string' && opt.subPreguntas?.length > 0) {
            opt.subPreguntas.forEach(subP => procesarPregunta(subP, level + 1, pregunta.nombre));
          }
        });
      }
    };
    (selectedGrupo.formOriginal.preguntas || []).forEach(bloque => { (bloque.detalles || []).forEach(preg => procesarPregunta(preg)); });
    return graficos;
  }, [selectedGrupo]);

  const handleBarClick = (stat, dataIndex) => {
    if (!stat || dataIndex === undefined) return;
    const label = stat.xAxisData[dataIndex];
    setSelectedOptionLabel(label);
    setSelectedUsers(stat.usersMap[label]?.users || []);
    setNamesDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 2 }}>Encuestas Realizadas</Typography>
      
      {/* SECCION FILTRO CON PADDING DE 20PX EXACTOS */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', bgcolor: 'white' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
           <FilterListIcon color="action" />
           <TextField 
             select 
             label="Filtrar por Formulario" 
             value={filtroFormulario} 
             size="small" 
             sx={{ minWidth: 320 }} 
             onChange={(e) => setFiltroFormulario(e.target.value)}
           >
             <MenuItem value="todos">Mostrar todos los resultados</MenuItem>
             {formularios.map(f => (<MenuItem key={f._id || f.id} value={f._id || f.id}>{f.titulo}</MenuItem>))}
           </TextField>
        </Stack>
      </Paper>

      {agrupadas.map((grupo, gi) => (
        <Accordion key={gi} sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" width="100%" justifyContent="space-between" pr={1}>
              <Typography fontWeight="bold">{grupo.titulo}</Typography>
              <Button variant="contained" size="small" onClick={(e) => { e.stopPropagation(); handleOpenDashboard(grupo); }} sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}>Dashboard de Análisis</Button>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
             <Table size="small">
               <TableHead sx={{ bgcolor: '#fafafa' }}><TableRow><TableCell>Ciudadano</TableCell><TableCell>Edad</TableCell><TableCell>Doc</TableCell><TableCell>Fecha</TableCell><TableCell align="center">Ver</TableCell></TableRow></TableHead>
               <TableBody>{grupo.items.map(row => (<TableRow key={row._id || row.id} hover><TableCell>{row.usuario_id?.nombre} {row.usuario_id?.apellido}</TableCell><TableCell><Chip label={getEdadSeguraLimpia(row)} size="small" variant="outlined" sx={{ height: 20 }} /></TableCell><TableCell>{row.usuario_id?.numero_documento}</TableCell><TableCell>{new Date(row.fecha || row.created_at).toLocaleDateString()}</TableCell><TableCell align="center"><Button onClick={() => handleOpenDetalle(row)}>Detalle</Button></TableCell></TableRow>))}</TableBody>
             </Table>
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog open={dashOpen} onClose={() => setDashOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#001e3c', color: 'white' }}>
           <Typography variant="h6" fontWeight="bold">Análisis Técnico</Typography>
           <IconButton onClick={() => setDashOpen(false)} color="inherit"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f4f6f8', p: 4 }}>
          <Grid container spacing={4}>
            {statsPro.map((stat, idx) => (
              <Grid item xs={12} key={idx}><Paper elevation={3} sx={{ p: 4, borderRadius: 3, borderTop: `8px solid ${stat.level > 0 ? '#ff9800' : '#1976d2'}`, ml: stat.level * 6 }}><Typography variant="h5" fontWeight="bold" color="primary">{stat.titulo}</Typography><Box sx={{ height: 500, width: '100%', mt: 2 }}><BarChart xAxis={[{ scaleType: 'band', data: stat.xAxisData, tickLabelStyle: { angle: 12, textAnchor: 'start', fontSize: 12 } }]} series={[{ data: stat.seriesData, label: 'Distribución', color: stat.level > 0 ? '#ff9800' : '#1976d2' }]} barLabel="value" height={450} margin={{ top: 50, bottom: 80, left: 40, right: 20 }} onItemClick={(e, d) => handleBarClick(stat, d.dataIndex)} /></Box></Paper></Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      <Dialog open={namesDialogOpen} onClose={() => setNamesDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>{selectedOptionLabel}</DialogTitle>
        <DialogContent dividers>
          <List>
            {selectedUsers.map((u, i) => (
              <ListItem key={i}><ListItemAvatar><Avatar><PersonIcon /></Avatar></ListItemAvatar><ListItemText primary={<Typography fontWeight="bold">{u.name}</Typography>} secondary={<Chip label={`${u.age} años`} size="small" sx={{ height: 20 }} variant="outlined" />} /></ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Detalle Ciudadano</DialogTitle>
        <DialogContent dividers>
          {selectedEncuesta && (
            <Box><Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 3 }}><Typography variant="h6" fontWeight="bold">{selectedEncuesta.usuario_id?.nombre} {selectedEncuesta.usuario_id?.apellido}</Typography><Chip label={`${getEdadSeguraLimpia(selectedEncuesta)} años`} size="small" color="secondary" /></Paper><Stack spacing={2}>{(selectedEncuesta.respuestas || []).map((r, i) => (<Box key={i}><Typography variant="subtitle2" fontWeight="bold">{r.pregunta_nombre || 'Pregunta'}</Typography><Typography color="primary">{Array.isArray(r.respuesta) ? r.respuesta.join(', ') : r.respuesta?.toString()}</Typography></Box>))}</Stack></Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
