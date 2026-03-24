import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/api';

const TIPOS_DOCUMENTO = [
  'Cédula de Ciudadanía',
  'Tarjeta de Identidad',
  'Cédula de Extranjería',
  'Pasaporte',
  'Permiso de Protección Temporal (PPT)',
  'Registro Civil'
];

const EMPTY_FORM = {
  tipo_documento: '',
  numero_documento: '',
  nombre: '',
  apellido: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: ''
};

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadUsuarios = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user._id);
      setFormData({
        tipo_documento: user.tipo_documento || '',
        numero_documento: user.numero_documento || '',
        nombre: user.nombre,
        apellido: user.apellido,
        direccion: user.direccion,
        telefono: user.telefono,
        correo: user.correo,
        fecha_nacimiento: user.fecha_nacimiento?.split('T')[0] || ''
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, formData);
      } else {
        await api.post('/usuarios', formData);
      }
      handleClose();
      loadUsuarios();
    } catch (error) {
      console.error(error);
      alert('Error guardando usuario: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar registro?')) {
      try {
        await api.delete(`/usuarios/${id}`);
        loadUsuarios();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="secondary.main">
          Usuarios (Población)
        </Typography>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Agregar Registro
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'secondary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documento</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Completo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Correo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Teléfono</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{row.numero_documento}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.tipo_documento}</Typography>
                </TableCell>
                <TableCell>{row.nombre} {row.apellido}</TableCell>
                <TableCell>{row.correo}</TableCell>
                <TableCell>{row.telefono}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(row._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Registro' : 'Nuevo Registro'}</DialogTitle>
        <DialogContent dividers>
          <TextField select margin="dense" label="Tipo de Documento" name="tipo_documento" fullWidth value={formData.tipo_documento} onChange={handleChange}>
            {TIPOS_DOCUMENTO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField margin="dense" label="Número de Documento" name="numero_documento" fullWidth value={formData.numero_documento} onChange={handleChange} />
          <TextField margin="dense" label="Nombre" name="nombre" fullWidth value={formData.nombre} onChange={handleChange} />
          <TextField margin="dense" label="Apellido" name="apellido" fullWidth value={formData.apellido} onChange={handleChange} />
          <TextField margin="dense" label="Dirección" name="direccion" fullWidth value={formData.direccion} onChange={handleChange} />
          <TextField margin="dense" label="Teléfono" name="telefono" fullWidth value={formData.telefono} onChange={handleChange} />
          <TextField margin="dense" label="Correo Electrónico" name="correo" type="email" fullWidth value={formData.correo} onChange={handleChange} />
          <TextField margin="dense" label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" InputLabelProps={{ shrink: true }} fullWidth value={formData.fecha_nacimiento} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
