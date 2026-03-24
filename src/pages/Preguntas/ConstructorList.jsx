import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, TextField, MenuItem,
  Grid, Card, CardContent, Divider, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../api/api';

export default function ConstructorList() {
  const [formularios, setFormularios] = useState([]);
  const [editingForm, setEditingForm] = useState(null);
  
  // Para el formulario actual en creación/edición
  const [detalles, setDetalles] = useState([]);

  const loadFormularios = async () => {
    try {
      const { data } = await api.get('/preguntas');
      setFormularios(data);
    } catch (error) {
      console.error(error);
    }
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
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles);
  };

  const handleAddOption = (index) => {
    const newDetalles = [...detalles];
    if (newDetalles[index].tempOption && newDetalles[index].tempOption.trim() !== '') {
      if (!Array.isArray(newDetalles[index].data)) {
        newDetalles[index].data = [];
      }
      newDetalles[index].data.push(newDetalles[index].tempOption.trim());
      newDetalles[index].tempOption = ''; // Limpiar el input temporal
      setDetalles(newDetalles);
    }
  };

  const handleRemoveOption = (detalleIndex, optionIndex) => {
    const newDetalles = [...detalles];
    newDetalles[detalleIndex].data.splice(optionIndex, 1);
    setDetalles(newDetalles);
  };

  const handleSaveFormulario = async () => {
    if (detalles.length === 0) return alert('No hay preguntas para guardar');
    try {
      // Limpiamos los tempOption antes de mandar al backend
      const formattedDetalles = detalles.map((d) => ({
        nombre: d.nombre,
        tipo: d.tipo,
        data: d.data
      }));

      if (editingForm) {
        await api.put(`/preguntas/${editingForm._id}`, { detalles: formattedDetalles });
      } else {
        await api.post('/preguntas', { detalles: formattedDetalles });
      }
      setEditingForm(null);
      setDetalles([]);
      loadFormularios();
    } catch (error) {
      console.error(error);
      alert('Error guardando formulario');
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    const plainDetalles = form.detalles.map(d => ({
      ...d,
      data: Array.isArray(d.data) ? d.data : [],
      tempOption: ''
    }));
    setDetalles(plainDetalles);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este formulario de preguntas?')) {
      await api.delete(`/preguntas/${id}`);
      loadFormularios();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption(index);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Constructor de Preguntas
      </Typography>

      <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{editingForm ? 'Editar Formulario' : 'Crear Nuevo Formulario'}</Typography>
          <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={handleAddDetalle}>
            Añadir Pregunta
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        
        {detalles.map((detalle, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'flex-start' }}>
            <Grid item xs={12} sm={4}>
              <TextField 
                fullWidth 
                label="Nombre/Enunciado" 
                value={detalle.nombre} 
                onChange={(e) => handleChangeDetalle(index, 'nombre', e.target.value)} 
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                select 
                fullWidth 
                label="Tipo" 
                value={detalle.tipo} 
                onChange={(e) => handleChangeDetalle(index, 'tipo', e.target.value)} 
                size="small"
              >
                <MenuItem value="texto">Texto Libre</MenuItem>
                <MenuItem value="booleano">Booleano (Sí/No)</MenuItem>
                <MenuItem value="numero">Numérico</MenuItem>
                <MenuItem value="multiple">Selección Múltiple</MenuItem>
                <MenuItem value="simple">Selección Simple</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              {(detalle.tipo === 'multiple' || detalle.tipo === 'simple') && (
                <Box>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField 
                      fullWidth 
                      label="Escribe una opción" 
                      value={detalle.tempOption || ''} 
                      onChange={(e) => handleChangeDetalle(index, 'tempOption', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      size="small"
                    />
                    <IconButton color="primary" onClick={() => handleAddOption(index)} sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Array.isArray(detalle.data) && detalle.data.map((opt, optIndex) => (
                      <Chip 
                        key={optIndex} 
                        label={opt} 
                        color="secondary" 
                        onDelete={() => handleRemoveOption(index, optIndex)} 
                      />
                    ))}
                    {(!detalle.data || detalle.data.length === 0) && (
                      <Typography variant="caption" color="text.secondary">Agrega opciones arriba...</Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={1} textAlign="center">
              <IconButton color="error" onClick={() => handleRemoveDetalle(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        {detalles.length > 0 && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            {editingForm && (
              <Button sx={{ mr: 2 }} color="inherit" onClick={() => { setEditingForm(null); setDetalles([]); }}>
                Cancelar Edición
              </Button>
            )}
            <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSaveFormulario}>
              Guardar Formulario
            </Button>
          </Box>
        )}
      </Paper>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Preguntas Existentes
      </Typography>
      <Grid container spacing={3}>
        {formularios.map((form) => (
          <Grid item xs={12} md={6} key={form._id}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                {/* Nombre de la/s pregunta/s */}
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>
                  {form.detalles.map(d => d.nombre).join(' / ')}
                </Typography>

                {/* Tipo e info de opciones */}
                <Box mb={2}>
                  {form.detalles.map((d, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Chip
                          label={d.tipo}
                          size="small"
                          color={d.tipo === 'multiple' ? 'warning' : d.tipo === 'simple' ? 'info' : d.tipo === 'booleano' ? 'secondary' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                        {(d.tipo === 'multiple' || d.tipo === 'simple') && Array.isArray(d.data) && d.data.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            {d.data.join(' | ')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Botones */}
                <Box display="flex" gap={1} mb={1}>
                  <Button size="small" variant="outlined" onClick={() => handleEdit(form)}>Editar</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(form._id)}>Eliminar</Button>
                </Box>

                {/* Fecha al final */}
                <Typography variant="caption" color="text.secondary">
                  Creado el: {new Date(form.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
