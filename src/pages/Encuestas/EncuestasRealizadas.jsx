import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, Divider,
  Chip, Accordion, AccordionSummary, AccordionDetails, MenuItem, TextField,
  IconButton, Grid, Stack, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemIcon,
  Tabs, Tab, CircularProgress, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import PieChartIcon from '@mui/icons-material/PieChart';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import InfoIcon from '@mui/icons-material/Info';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import { BarChart, PieChart } from '@mui/x-charts';
import api from '../../api/api';

const PALETA_COLORES = [
  '#2f4b7c', '#007bff', '#665191', '#a05195', '#d45087', 
  '#f95d6a', '#ff7c43', '#ffa600', '#2e7d32', '#0097a7'
];

export default function EncuestasRealizadas() {
  const [encuestas, setEncuestas] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFormulario, setFiltroFormulario] = useState('todos');
  const [open, setOpen] = useState(false);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);
  const [dashOpen, setDashOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [tabValue, setTabValue] = useState(0); 

  const [namesDialogOpen, setNamesDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [eRes, fRes] = await Promise.all([api.get('/encuestas'), api.get('/formularios')]);
        if (active) { setEncuestas(eRes?.data || []); setFormularios(fRes?.data || []); }
      } catch (err) { console.error(err); } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  // MOTOR DE BÚSQUEDA DE NOMBRES DE PREGUNTA
  const buscarNombrePregunta = (pId, formId) => {
    if (!pId || !formId || !Array.isArray(formularios)) return 'Pregunta';
    const form = formularios.find(f => String(f._id || f.id) === String(formId));
    if (!form || !Array.isArray(form.preguntas)) return 'Pregunta';
    
    let nombreEncontrado = null;
    const recursivo = (lista) => {
       if (nombreEncontrado) return;
       lista.forEach(preg => {
          if (String(preg._id || preg.id) === String(pId)) { nombreEncontrado = preg.nombre; return; }
          if (Array.isArray(preg.data)) {
             preg.data.forEach(opt => { if (Array.isArray(opt.subPreguntas)) recursivo(opt.subPreguntas); });
          }
       });
    };
    form.preguntas.forEach(block => { if (Array.isArray(block.detalles)) recursivo(block.detalles); });
    return nombreEncontrado || 'Pregunta Sin Título';
  };

  const getEdadSencilla = (it) => {
    try {
      const u = it?.usuario_id;
      if (!u) return '';
      if (u.edad && !isNaN(u.edad)) return `${u.edad} años`;
      const fNac = u.fecha_nacimiento || u.fechaNacimiento;
      if (fNac) {
        const bd = new Date(fNac);
        const hoy = new Date();
        let age = hoy.getFullYear() - bd.getFullYear();
        if (hoy.getMonth() < bd.getMonth() || (hoy.getMonth() === bd.getMonth() && hoy.getDate() < bd.getDate())) age--;
        return age > 0 ? `${age} años` : '';
      }
    } catch (e) { return ''; }
    return '';
  };

  const agrupadas = useMemo(() => {
    if (!Array.isArray(encuestas)) return [];
    try {
      const gList = {};
      const filtradas = encuestas.filter(e => {
        if (!e) return false;
        if (filtroFormulario === 'todos') return true;
        return String(e.formulario_id?._id || e.formulario_id) === String(filtroFormulario);
      });
      filtradas.forEach(e => {
        const key = String(e.formulario_id?._id || e.formulario_id || 'unassigned');
        const titulo = e.formulario_id?.titulo || 'Auditoría Poblacional';
        const formOrg = Array.isArray(formularios) ? formularios.find(f => String(f._id || f.id) === key) : null;
        if (!gList[key]) gList[key] = { titulo, items: [], formOriginal: formOrg };
        gList[key].items.push(e);
      });
      return Object.values(gList);
    } catch (e) { return []; }
  }, [encuestas, filtroFormulario, formularios]);

  const statsPro = useMemo(() => {
    if (!selectedGrupo || !selectedGrupo.formOriginal || !Array.isArray(selectedGrupo.items)) return [];
    try {
      const items = selectedGrupo.items;
      const result = [];
      const procesar = (preg, level = 0, pTrig = null) => {
        if (!preg || level > 5) return;
        if (!['simple', 'multiple', 'booleano', 'condicional'].includes(preg.tipo)) return;

        const dMap = {};
        const lList = preg.tipo === 'booleano' ? ['SI', 'NO'] : (preg.data || []).map(o => typeof o === 'string' ? o : o?.text).filter(Boolean);
        lList.forEach(l => { dMap[l] = { count: 0, users: [] }; });

        items.forEach(it => {
          if (!it || !it.respuestas) return;
          const r = it.respuestas.find(rp => String(rp?.pregunta_id?._id || rp?.pregunta_id || '') === String(preg._id || preg.id));
          if (r && r.respuesta !== undefined) {
             const uDisp = `${it.usuario_id?.nombre || ''} ${it.usuario_id?.apellido || ''} ${getEdadSencilla(it)}`.trim();
             const handleV = (v) => {
                let n = (v === true || String(v).toLowerCase() === 'true') ? 'SI' : ((v === false || String(v).toLowerCase() === 'false') ? 'NO' : String(v));
                if (dMap[n]) { dMap[n].count++; dMap[n].users.push({ name: uDisp }); }
             };
             if (Array.isArray(r.respuesta)) r.respuesta.forEach(handleV); else handleV(r.respuesta);
          }
        });

        const axis = Object.keys(dMap);
        const vals = axis.map(k => dMap[k].count);
        const sum = vals.reduce((a, b) => a + b, 0);

        if (sum > 0) {
           const metrics = axis.map((lab, i) => ({ 
              label: lab, 
              value: dMap[lab].count, 
              color: PALETA_COLORES[i % PALETA_COLORES.length] 
           }));
           result.push({
              titulo: preg.nombre,
              axis, metrics, users: dMap, level, trigger: pTrig, total: sum,
              win: axis[vals.indexOf(Math.max(...vals))],
              perc: ((Math.max(...vals)/sum)*100).toFixed(0),
              series: metrics.map(x => ({ data: [x.value], label: x.label, color: x.color }))
           });
        }
        if (Array.isArray(preg.data)) {
            preg.data.forEach(o => { 
                if (o?.subPreguntas) o.subPreguntas.forEach(sp => procesar(sp, level + 1, o.text || (o === true ? 'SI' : 'NO')));
            });
        }
      };
      selectedGrupo.formOriginal.preguntas?.forEach(b => b.detalles?.forEach(p => procesar(p)));
      return result;
    } catch (e) { return [{ error: true }]; }
  }, [selectedGrupo]);

  const handleOpenDashboard = (g) => { setDashOpen(true); if (g) setSelectedGrupo(g); };
  const handlePointClick = (st, idx) => { if (st && idx !== undefined) { const lab = st.axis[idx]; if (lab) { setSelectedUsers(st.users[lab]?.users || []); setNamesDialogOpen(true); } } };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f7fa', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="900" color="#1a335a" sx={{ mb: 4 }}>Centro de Inteligencia de Datos</Typography>
      {loading ? ( <Stack alignItems="center" py={12}><CircularProgress /><Typography mt={2}>Sincronizando información...</Typography></Stack> ) : (
        <>
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 5, border: '1px solid #e0e6ed' }}>
             <Stack direction="row" spacing={3} alignItems="center"><FilterListIcon color="primary" /><TextField select label="Elegir Caracterización" value={filtroFormulario} fullWidth size="small" onChange={(e) => setFiltroFormulario(e.target.value)}><MenuItem value="todos">Todos los registros</MenuItem>{(formularios || []).map(f => (<MenuItem key={String(f?._id || f?.id)} value={String(f?._id || f?.id)}>{f?.titulo}</MenuItem>))}</TextField></Stack>
          </Paper>
          {(agrupadas || []).map((g, i) => (
            <Accordion key={i} sx={{ mb: 2, borderRadius: '16px !important', overflow: 'hidden', border: '1px solid #dee2e6', '&:before': { display: 'none' } }}>
               <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ bgcolor: '#1a335a', color: 'white' }}><Stack direction="row" justifyContent="space-between" width="100%" px={1} alignItems="center"><Typography fontWeight="800">{g.titulo}</Typography><Button variant="contained" onClick={(e) => { e.stopPropagation(); handleOpenDashboard(g); }} sx={{ bgcolor: 'white', color: '#1a335a', fontWeight: '900', borderRadius: 2 }}>ANALIZAR</Button></Stack></AccordionSummary>
               <AccordionDetails sx={{ p: 0 }}><TableContainer><Table size="small"><TableHead sx={{ bgcolor: '#f8f9fa' }}><TableRow><TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell><TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell><TableCell align="center">Ver</TableCell></TableRow></TableHead><TableBody>{(g.items || []).map(r => (<TableRow key={String(r?._id || r?.id)} hover><TableCell fontWeight="700">{r?.usuario_id?.nombre || 'Anónimo'}</TableCell><TableCell>{r?.fecha ? new Date(r.fecha).toLocaleDateString() : '—'}</TableCell><TableCell align="center"><Button onClick={() => { setSelectedEncuesta(r); setOpen(true); }} variant="outlined" size="small">Resumen</Button></TableCell></TableRow>))}</TableBody></Table></TableContainer></AccordionDetails>
            </Accordion>
          ))}
        </>
      )}

      {/* DASHBOARD EJECUTIVO */}
      <Dialog open={dashOpen} onClose={() => setDashOpen(false)} maxWidth="lg" fullWidth scroll="body">
        <DialogTitle sx={{ bgcolor: '#00264d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
           <Typography variant="h5" fontWeight="900">TABLERO ANALÍTICO POBLACIONAL</Typography>
           <IconButton onClick={() => setDashOpen(false)} color="inherit"><CloseIcon /></IconButton>
        </DialogTitle>
        <Box sx={{ bgcolor: 'white' }}><Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} centered><Tab icon={<PieChartIcon />} label="DISTRIBUCIÓN" /><Tab icon={<ViewWeekIcon />} label="COMPARATIVA VERTICAL" /></Tabs></Box>
        <DialogContent sx={{ bgcolor: '#f0f4f8', p: { xs: 2, md: 5 } }}>
           {(!statsPro || statsPro.length === 0) ? (
              <Stack alignItems="center" py={12} spacing={2}><InfoIcon color="disabled" sx={{ fontSize: 60 }} /><Typography variant="h6" color="text.secondary">Sincronizando...</Typography></Stack>
           ) : (
              statsPro.map((st, idx) => (
                <Paper key={idx} elevation={3} sx={{ p: 4, mb: 6, borderRadius: 6, borderTop: `15px solid ${st.level > 0 ? '#ff9800' : '#005bb5'}`, ml: { xs: 0, md: st.level * 6 } }}>
                   <Stack direction="row" spacing={1.5} alignItems="center" mb={1} fontStyle="italic">
                      {st.level > 0 ? <AccountTreeIcon color="warning" /> : <EmojiEventsIcon color="primary" />}
                      <Box><Typography variant="h5" fontWeight="900" color="#1e293b">{st.titulo}</Typography>{st.trigger && <Chip label={`Filtro: ${st.trigger}`} size="small" color="warning" sx={{ mt: 0.5, fontWeight: '800' }} />}</Box>
                   </Stack>
                   <Divider sx={{ my: 3 }} />
                   <Grid container spacing={3} alignItems="center" justifyContent="center">
                      <Grid item xs={12} md={5}>
                         <Box sx={{ height: 360, width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {tabValue === 0 && <PieChart series={[{ data: (st.metrics || []).map((l, i) => ({ id: i, value: l.value, color: l.color })), innerRadius: 70, outerRadius: 150, paddingAngle: 4 }]} height={360} slotProps={{ legend: { hidden: true }, tooltip: { trigger: 'none' } }} onItemClick={(e, d) => handlePointClick(st, d.dataIndex)} />}
                            {tabValue === 1 && <BarChart xAxis={[{ scaleType: 'band', data: ['Resultados'], hide: true }]} series={st.series || []} height={360} slotProps={{ legend: { hidden: true }, tooltip: { trigger: 'none' } }} onItemClick={(e, d) => handlePointClick(st, d.seriesIndex)} barLabel="value" />}
                         </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                         <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'white', borderRadius: 5, border: '1px solid #cbd5e1' }}>
                            <Typography variant="overline" fontWeight="900" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>LEYENDA (NOMBRE + VOTOS)</Typography>
                            <Stack spacing={1.5}>
                               {(st.metrics || []).map((m, i) => (
                                  <Box key={i} onClick={() => handlePointClick(st, i)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, bgcolor: '#f8fafc', borderRadius: 3, cursor: 'pointer', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#e0f2fe', borderColor: '#0ea5e9' } }}>
                                     <Box sx={{ width: 14, height: 14, bgcolor: m.color, borderRadius: '4px', flexShrink: 0 }} />
                                     <Typography variant="caption" fontWeight="900" sx={{ flexGrow: 1, color: '#334155' }}>{m.label}</Typography>
                                     <Typography fontWeight="900" color="primary" variant="body2">{m.value}</Typography>
                                  </Box>
                               ))}
                            </Stack>
                         </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                         <Paper elevation={0} sx={{ p: 3, bgcolor: '#fffbed', borderRadius: 5, border: '2px solid #fde68a', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box><Typography variant="caption" fontWeight="900" color="#92400e">GANADOR</Typography><Typography variant="h6" fontWeight="900" color="#78350f">{st.win}</Typography></Box>
                            <Divider sx={{ my: 0.5, borderColor: '#fde68a' }} />
                            <Stack direction="row" justifyContent="space-around">
                               <Box><Typography variant="caption" color="#92400e" fontWeight="700">TOTAL</Typography><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}><GroupIcon fontSize="small" color="primary" /><Typography variant="h5" fontWeight="900">{st.total}</Typography></Box></Box>
                               <Box><Typography variant="caption" color="#92400e" fontWeight="700">PESO</Typography><Typography variant="h5" fontWeight="900" color="#059669">{st.perc}%</Typography></Box>
                            </Stack>
                         </Paper>
                      </Grid>
                   </Grid>
                </Paper>
              ))
           )}
        </DialogContent>
      </Dialog>

      {/* MODAL: FICHA INDIVIDUAL CON NOMBRES DE PREGUNTAS ACTUALIZADO */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00264d', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
           <PersonIcon /> FICHA DE RESPUESTA INDIVIDUAL
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f4f7f6' }}>
          {selectedEncuesta && (
            <Box>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', mb: 4, borderRadius: 4, border: '1px solid #e0e6ed', textAlign: 'center' }}>
                 <Typography variant="overline" color="text.secondary" fontWeight="900">CIUDADANO AUDITADO</Typography>
                 <Typography variant="h5" fontWeight="900" color="#00264d">{selectedEncuesta.usuario_id?.nombre || 'Anónimo'} {selectedEncuesta.usuario_id?.apellido || ''}</Typography>
                 <Chip label={new Date(selectedEncuesta.fecha).toLocaleDateString()} size="small" sx={{ mt: 1, fontWeight: '800' }} />
              </Paper>
              <Stack spacing={3}>
                {(selectedEncuesta.respuestas || []).map((r, i) => (
                  <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 3, borderLeft: '6px solid #007bff', bgcolor: 'white' }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
                      <HelpCenterIcon sx={{ fontSize: 18, color: '#007bff', mt: 0.3 }} />
                      <Typography variant="body2" fontWeight="900" color="#2d3748" sx={{ lineHeight: 1.2 }}>
                        {r.pregunta_nombre || buscarNombrePregunta(r.pregunta_id, selectedEncuesta.formulario_id?._id || selectedEncuesta.formulario_id)}
                      </Typography>
                    </Stack>
                    <Typography color="primary" fontWeight="800" variant="h6" sx={{ pl: 3.5 }}>
                      {Array.isArray(r.respuesta) ? r.respuesta.join(', ') : (r.respuesta === true ? 'SI' : (r.respuesta === false ? 'NO' : String(r.respuesta || '—')))}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={namesDialogOpen} onClose={() => setNamesDialogOpen(false)} maxWidth="xs" fullWidth><DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 'bold' }}>CIUDADANOS</DialogTitle><DialogContent sx={{ p: 0 }}><List sx={{ pt: 0 }}>{selectedUsers.map((u, i) => (<ListItem key={i} divider><ListItemIcon><Avatar sx={{ width: 32, height: 32 }}><PersonIcon /></Avatar></ListItemIcon><ListItemText primary={<Typography fontWeight="900" variant="body2">{u.name}</Typography>} /></ListItem>))}</List></DialogContent></Dialog>
    </Box>
  );
}
