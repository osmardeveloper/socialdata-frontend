import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, TextField,
  Grid, Card, CardContent, Checkbox, FormControlLabel, Divider,
  ToggleButtonGroup, ToggleButton, InputAdornment, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import PostAddIcon from '@mui/icons-material/PostAdd';
import api from '../../api/api';

const TIPOS = ['todos', 'texto', 'booleano', 'numero', 'simple', 'multiple'];

const labelTipo = (tipo) => {
  const labels = {
    todos: 'Todos', texto: 'Texto', booleano: 'Booleano',
    numero: 'Numérico', simple: 'Selección Simple', multiple: 'Selección Múltiple'
  };
  return labels[tipo] || tipo;
};

export default function ConstructorFormularios() {
  const [preguntasDisponibles, setPreguntasDisponibles] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const loadPreguntas = async () => {
    try {
      const { data } = await api.get('/formularios/preguntas');
      setPreguntasDisponibles(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadPreguntas(); }, []);

  const handleToggle = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveFormulario = async () => {
    if (!titulo.trim() || seleccionadas.length === 0) return alert('Completa los datos');
    try {
      await api.post('/formularios', { titulo, preguntas: seleccionadas });
      setTitulo(''); setSeleccionadas([]); alert('Formulario creado con éxito');
    } catch (error) { alert('Error al crear formulario'); }
  };

  const preguntasFiltradas = useMemo(() => {
    return preguntasDisponibles.filter((bloque) => {
      const matchBusqueda = busqueda.trim() === '' ||
        bloque.detalles.some(d => d.nombre.toLowerCase().includes(busqueda.toLowerCase()));
      const matchTipo = filtroTipo === 'todos' || bloque.detalles.some(d => d.tipo === filtroTipo);
      return matchBusqueda && matchTipo;
    });
  }, [preguntasDisponibles, busqueda, filtroTipo]);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Generador de Formularios Personalizados
      </Typography>

      <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="secondary.main">1. Definir Título</Typography>
        <TextField fullWidth label="Título del Formulario" value={titulo} onChange={(e) => setTitulo(e.target.value)} sx={{ mb: 4 }} />

        <Typography variant="h6" gutterBottom color="secondary.main">2. Seleccionar Preguntas</Typography>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={3}>
          <TextField
            label="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} size="small" sx={{ minWidth: 260 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <ToggleButtonGroup value={filtroTipo} exclusive onChange={(_, v) => v && setFiltroTipo(v)} size="small">
            {TIPOS.map(t => <ToggleButton key={t} value={t} sx={{ textTransform: 'none' }}>{labelTipo(t)}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={3}>
          {preguntasFiltradas.map((bloque) => {
            const isSel = seleccionadas.includes(bloque._id);
            return (
              <Grid item xs={12} md={6} key={bloque._id}>
                <Card variant="outlined" sx={{
                  borderRadius: 2, 
                  borderColor: isSel ? 'primary.main' : 'grey.300',
                  borderWidth: isSel ? 2 : 1,
                  bgcolor: isSel ? '#e3f2fd' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <CardContent>
                    <FormControlLabel
                      control={<Checkbox checked={isSel} onChange={() => handleToggle(bloque._id)} />}
                      label={<Typography fontWeight="bold">{bloque.detalles.map(d => d.nombre).join(' / ')}</Typography>}
                    />
                    <Divider sx={{ my: 1 }} />
                    <Box mt={1} pl={4}>
                      {bloque.detalles.map((d, i) => (
                        <Box key={i} sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Tipo: {labelTipo(d.tipo)}</Typography>
                          {(d.tipo === 'multiple' || d.tipo === 'simple') && d.data && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {d.data.map((opt, oIdx) => {
                                const text = typeof opt === 'string' ? opt : opt.text;
                                const hasSub = opt.subPreguntas?.length > 0;
                                return (
                                  <Chip 
                                    key={oIdx} label={text} size="small" 
                                    sx={{ fontSize: '0.7rem', bgcolor: hasSub ? '#e3f2fd' : 'grey.100', color: hasSub ? '#1565C0' : 'inherit', border: hasSub ? '1px solid #1565C0' : 'none' }} 
                                    icon={hasSub ? <PostAddIcon style={{ fontSize: '14px', color: '#1565C0' }} /> : undefined}
                                  />
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Typography variant="body2" color="text.secondary">{seleccionadas.length} seleccionada(s)</Typography>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveFormulario}>Guardar Formulario</Button>
        </Box>
      </Paper>
    </Box>
  );
}
