import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, TextField,
  Grid, Card, CardContent, Checkbox, FormControlLabel, Divider,
  ToggleButtonGroup, ToggleButton, InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api/api';

const TIPOS = ['todos', 'texto', 'booleano', 'numero', 'simple', 'multiple'];

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
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { loadPreguntas(); }, []);

  const handleToggle = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveFormulario = async () => {
    if (!titulo.trim()) return alert('Debe ingresar un título');
    if (seleccionadas.length === 0) return alert('Debe seleccionar al menos un bloque de preguntas');
    try {
      await api.post('/formularios', { titulo, preguntas: seleccionadas });
      setTitulo('');
      setSeleccionadas([]);
      alert('Formulario creado con éxito');
    } catch (error) {
      console.error(error);
      alert('Error al crear el formulario');
    }
  };

  // Lógica de filtro: busca en "nombre" y filtra por "tipo"
  const preguntasFiltradas = useMemo(() => {
    return preguntasDisponibles.filter((bloque) => {
      const matchBusqueda = busqueda.trim() === '' ||
        bloque.detalles.some(d =>
          d.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

      const matchTipo = filtroTipo === 'todos' ||
        bloque.detalles.some(d => d.tipo === filtroTipo);

      return matchBusqueda && matchTipo;
    });
  }, [preguntasDisponibles, busqueda, filtroTipo]);

  const labelTipo = (tipo) => {
    const labels = {
      todos: 'Todos', texto: 'Texto', booleano: 'Booleano',
      numero: 'Numérico', simple: 'Selección Simple', multiple: 'Selección Múltiple'
    };
    return labels[tipo] || tipo;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Generador de Formularios Personalizados
      </Typography>

      <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="secondary.main">1. Definir Título</Typography>
        <TextField
          fullWidth
          label="Título del Formulario (ej: Censo Comunitario 2026)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Typography variant="h6" gutterBottom color="secondary.main">2. Seleccionar Preguntas</Typography>

        {/* Barra de búsqueda + filtro por tipo */}
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={3}>
          <TextField
            label="Buscar pregunta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />
          <ToggleButtonGroup
            value={filtroTipo}
            exclusive
            onChange={(_, val) => { if (val !== null) setFiltroTipo(val); }}
            size="small"
          >
            {TIPOS.map((tipo) => (
              <ToggleButton key={tipo} value={tipo} sx={{ textTransform: 'none', fontWeight: 500 }}>
                {labelTipo(tipo)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {preguntasFiltradas.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={3}>
            No se encontraron preguntas con ese criterio.
          </Typography>
        )}

        <Grid container spacing={3}>
          {preguntasFiltradas.map((bloque) => (
            <Grid item xs={12} md={6} key={bloque._id}>
              <Card variant="outlined" sx={{
                borderRadius: 2,
                borderColor: seleccionadas.includes(bloque._id) ? 'primary.main' : 'grey.300',
                borderWidth: seleccionadas.includes(bloque._id) ? 2 : 1,
                bgcolor: seleccionadas.includes(bloque._id) ? '#e3f2fd' : 'white',
                transition: 'all 0.2s ease'
              }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={seleccionadas.includes(bloque._id)}
                        onChange={() => handleToggle(bloque._id)}
                        color="primary"
                      />
                    }
                    label={<Typography fontWeight="bold">{bloque.detalles.map(d => d.nombre).join(' / ')}</Typography>}
                  />
                  <Divider sx={{ my: 1 }} />
                  <Box mt={1} pl={4}>
                    {bloque.detalles.map((d, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <span style={{ fontWeight: 600 }}>Tipo:</span> {labelTipo(d.tipo)}
                        </Typography>
                        {(d.tipo === 'multiple' || d.tipo === 'simple') && Array.isArray(d.data) && d.data.length > 0 && (
                          <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
                            <span style={{ fontWeight: 600 }}>Opciones:</span> {d.data.join(' | ')}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            {seleccionadas.length} pregunta(s) seleccionada(s)
          </Typography>
          <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSaveFormulario}>
            Guardar Formulario Personalizado
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
