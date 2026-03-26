import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, TextField, MenuItem,
  Grid, Card, CardContent, Divider, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText, Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import PostAddIcon from '@mui/icons-material/PostAdd';
import api from '../../api/api';

const TIPOS_PREGUNTA = [
  { value: 'texto', label: 'Texto Libre' },
  { value: 'booleano', label: 'Booleano (Sí/No)' },
  { value: 'numero', label: 'Numérico' },
  { value: 'multiple', label: 'Selección Múltiple' },
  { value: 'simple', label: 'Selección Simple' },
];

export default function ConstructorList() {
  const [formularios, setFormularios] = useState([]);
  const [editingForm, setEditingForm] = useState(null);
  const [detalles, setDetalles] = useState([]);

  // Estados para el Modal de Sub-preguntas
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [activeDetalleIndex, setActiveDetalleIndex] = useState(null);
  const [activeOptionIndex, setActiveOptionIndex] = useState(null);
  const [tempSubPreguntas, setTempSubPreguntas] = useState([]);
  
  const loadFormularios = async () => {
    try {
      const { data } = await api.get('/preguntas');
      setFormularios(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadFormularios(); }, []);

  const handleAddDetalle = () => {
    setDetalles([...detalles, { nombre: '', tipo: 'texto', data: [], tempOption: '' }]);
  };

  const handleChangeDetalle = (index, field, value) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;
    setDetalles(newDetalles);
  };

  const handleRemoveDetalle = (index) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddOption = (index) => {
    const newDetalles = [...detalles];
    const val = newDetalles[index].tempOption?.trim();
    if (val) {
      if (!Array.isArray(newDetalles[index].data)) newDetalles[index].data = [];
      newDetalles[index].data.push({ text: val, subPreguntas: [] });
      newDetalles[index].tempOption = '';
      setDetalles(newDetalles);
    }
  };

  const handleRemoveOption = (dIdx, oIdx) => {
    const newDetalles = [...detalles];
    newDetalles[dIdx].data.splice(oIdx, 1);
    setDetalles(newDetalles);
  };

  // --- Lógica de Sub-preguntas ---
  const openSubPreguntas = (dIdx, oIdx) => {
    setActiveDetalleIndex(dIdx);
    setActiveOptionIndex(oIdx);
    const op = detalles[dIdx].data[oIdx];
    const currentSubs = (op.subPreguntas || []).map(sp => ({ 
      ...sp, 
      tempSubOption: '',
      data: Array.isArray(sp.data) ? sp.data : []
    }));
    setTempSubPreguntas(currentSubs);
    setSubModalOpen(true);
  };

  const handleAddSubPregunta = () => {
    setTempSubPreguntas([...tempSubPreguntas, { nombre: '', tipo: 'texto', data: [], tempSubOption: '' }]);
  };

  const handleAddSubOption = (spIdx) => {
    const updated = [...tempSubPreguntas];
    const oVal = updated[spIdx].tempSubOption?.trim();
    if (oVal) {
      if (!Array.isArray(updated[spIdx].data)) updated[spIdx].data = [];
      updated[spIdx].data.push(oVal);
      updated[spIdx].tempSubOption = '';
      setTempSubPreguntas(updated);
    }
  };

  const handleRemoveSubOption = (spIdx, optIdx) => {
    const updated = [...tempSubPreguntas];
    updated[spIdx].data.splice(optIdx, 1);
    setTempSubPreguntas(updated);
  };

  const handleChangeSubPregunta = (idx, field, value) => {
    const updated = [...tempSubPreguntas];
    updated[idx][field] = value;
    setTempSubPreguntas(updated);
  };

  const handleSaveSubPreguntas = () => {
    const updatedDetalles = [...detalles];
    const cleanSubs = tempSubPreguntas.map(({ tempSubOption, ...rest }) => rest);
    updatedDetalles[activeDetalleIndex].data[activeOptionIndex].subPreguntas = cleanSubs;
    setDetalles(updatedDetalles);
    setSubModalOpen(false);
  };

  const handleSaveFormulario = async () => {
    if (detalles.length === 0) return alert('No hay preguntas para guardar');
    try {
      const formatted = detalles.map(d => ({
        nombre: d.nombre,
        tipo: d.tipo,
        data: d.data.map(opt => typeof opt === 'string' ? { text: opt, subPreguntas: [] } : opt)
      }));

      const id = editingForm?._id || editingForm?.id;
      if (id) {
        await api.put(`/preguntas/${id}`, { detalles: formatted });
      } else {
        await api.post('/preguntas', { detalles: formatted });
      }
      setEditingForm(null); setDetalles([]); loadFormularios();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { alert('Error guardando formulario'); }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    const mapped = form.detalles.map(d => ({
      ...d,
      data: (d.data || []).map(opt => typeof opt === 'string' ? { text: opt, subPreguntas: [] } : opt),
      tempOption: ''
    }));
    setDetalles(mapped);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Feedback visual: ir arriba
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta pregunta permanentemente?')) {
      await api.delete(`/preguntas/${id}`);
      loadFormularios();
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>Constructor de Preguntas</Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: editingForm ? '2px solid #1565C0' : '1px solid #eee' }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6" color={editingForm ? "primary.main" : "text.primary"}>
            {editingForm ? `Editando: ${editingForm.detalles[0]?.nombre}` : 'Nueva Pregunta'}
          </Typography>
          <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={handleAddDetalle}>Crear pregunta</Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        
        {detalles.map((d, dIdx) => (
          <Grid container spacing={2} key={dIdx} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Enunciado" value={d.nombre} onChange={(e) => handleChangeDetalle(dIdx, 'nombre', e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Tipo" value={d.tipo} onChange={(e) => handleChangeDetalle(dIdx, 'tipo', e.target.value)} size="small">
                {TIPOS_PREGUNTA.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              {(d.tipo === 'multiple' || d.tipo === 'simple') && (
                <Box>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField fullWidth label="Opción" value={d.tempOption || ''} onChange={(e) => handleChangeDetalle(dIdx, 'tempOption', e.target.value)} size="small" onKeyDown={(e) => e.key === 'Enter' && handleAddOption(dIdx)} />
                    <IconButton color="primary" onClick={() => handleAddOption(dIdx)} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}><AddIcon /></IconButton>
                  </Box>
                  <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, maxHeight: 150, overflow: 'auto' }}>
                    {d.data.map((opt, oIdx) => (
                      <Chip 
                        key={oIdx} label={opt.text} size="small"
                        onDelete={() => handleRemoveOption(dIdx, oIdx)}
                        onClick={() => openSubPreguntas(dIdx, oIdx)}
                        icon={opt.subPreguntas?.length > 0 ? <PostAddIcon style={{color: '#1565C0'}} /> : <SettingsIcon />}
                        sx={{ 
                          m: 0.5, 
                          bgcolor: opt.subPreguntas?.length > 0 ? '#e3f2fd' : 'grey.200',
                          border: opt.subPreguntas?.length > 0 ? '1px solid #1565C0' : 'none',
                          color: opt.subPreguntas?.length > 0 ? '#1565C0' : 'inherit'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={1} textAlign="center"><IconButton color="error" onClick={() => handleRemoveDetalle(dIdx)}><DeleteIcon /></IconButton></Grid>
          </Grid>
        ))}

        {detalles.length > 0 && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            {editingForm && <Button sx={{ mr: 2 }} onClick={() => { setEditingForm(null); setDetalles([]); }}>Cancelar</Button>}
            <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSaveFormulario}>
              {editingForm ? 'Actualizar Pregunta' : 'Guardar Pregunta'}
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog open={subModalOpen} onClose={() => setSubModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Configurar Lógica Condicional
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom color="text.secondary">
            Si eligen: <strong>{detalles[activeDetalleIndex]?.data[activeOptionIndex]?.text || '—'}</strong>
          </Typography>
          
          {tempSubPreguntas.map((sp, spIdx) => (
            <Box key={spIdx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2, bgcolor: '#fafafa' }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={7}>
                  <TextField fullWidth label="Pregunta" value={sp.nombre} onChange={(e) => handleChangeSubPregunta(spIdx, 'nombre', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={4}>
                  <TextField select fullWidth label="Tipo" value={sp.tipo} onChange={(e) => handleChangeSubPregunta(spIdx, 'tipo', e.target.value)} size="small">
                    {TIPOS_PREGUNTA.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={1}>
                  <IconButton size="small" color="error" onClick={() => setTempSubPreguntas(prev => prev.filter((_, i) => i !== spIdx))}><DeleteIcon fontSize="small" /></IconButton>
                </Grid>

                {(sp.tipo === 'simple' || sp.tipo === 'multiple') && (
                   <Grid item xs={12} sx={{ mt: 1 }}>
                     <Box display="flex" gap={1} mb={1}>
                        <TextField fullWidth label="Nueva Sub-Opción" size="small" value={sp.tempSubOption || ''} onChange={(e) => handleChangeSubPregunta(spIdx, 'tempSubOption', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubOption(spIdx)} />
                        <IconButton size="small" sx={{ bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } }} onClick={() => handleAddSubOption(spIdx)}><AddIcon /></IconButton>
                     </Box>
                     <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {(sp.data || []).map((subOpt, soIdx) => (
                           <Chip key={soIdx} label={subOpt} size="small" onDelete={() => handleRemoveSubOption(spIdx, soIdx)} color="secondary" variant="outlined" />
                        ))}
                     </Stack>
                   </Grid>
                )}
              </Grid>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={handleAddSubPregunta} variant="outlined" fullWidth sx={{ mt: 1 }}>Crear pregunta anidada</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveSubPreguntas}>Guardar Lógica</Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h6" sx={{ mt: 5, mb: 2, fontWeight: 'bold' }}>Banco de Preguntas</Typography>
      <Grid container spacing={3}>
        {formularios.map((form) => (
          <Grid item xs={12} md={6} key={form._id || form.id}>
            <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '5px solid #1565C0' }}>
              <CardContent>
                {form.detalles.map((d, i) => (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold">{d.nombre}</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                      <Chip label={d.tipo} size="small" color="primary" variant="outlined" />
                      {(d.tipo === 'multiple' || d.tipo === 'simple') && (d.data || []).map((opt, oIdx) => {
                        const optText = typeof opt === 'string' ? opt : opt.text;
                        const hasSub = opt.subPreguntas?.length > 0;
                        return (
                          <Chip 
                            key={oIdx} 
                            label={optText} 
                            size="small" 
                            sx={{ 
                              m: 0.3, 
                              bgcolor: hasSub ? '#e3f2fd' : 'grey.100',
                              color: hasSub ? '#1565C0' : 'inherit',
                              border: hasSub ? '1px solid #1565C0' : 'none'
                             }} 
                             icon={hasSub ? <PostAddIcon style={{fontSize: '14px', color: '#1565C0'}} /> : undefined}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" justifyContent="space-between">
                  <Box display="flex" gap={1}>
                    <Button size="small" variant="contained" onClick={() => handleEdit(form)}>Editar</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(form._id || form.id)}>Eliminar</Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
