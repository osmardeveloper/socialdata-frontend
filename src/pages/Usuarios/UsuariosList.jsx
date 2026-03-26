import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, InputAdornment, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CakeIcon from '@mui/icons-material/Cake';
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
  tipo_documento: 'Cédula de Ciudadanía',
  numero_documento: '',
  nombre: '',
  apellido: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
  edad: ''
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  if (isNaN(cumple.getTime())) return '';
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return edad;
};

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsuarios = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadUsuarios(); }, []);

  useEffect(() => {
    if (formData.fecha_nacimiento) {
      setFormData(prev => ({ ...prev, edad: calcularEdad(formData.fecha_nacimiento) }));
    }
  }, [formData.fecha_nacimiento]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user._id || user.id);
      setFormData({
        ...user,
        fecha_nacimiento: user.fecha_nacimiento?.split('T')[0] || '',
        edad: user.edad || calcularEdad(user.fecha_nacimiento)
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
      if (editingId) await api.put(`/usuarios/${editingId}`, formData);
      else await api.post('/usuarios', formData);
      handleClose(); loadUsuarios();
    } catch (error) { alert('Error guardando usuario'); }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar registro?')) {
      await api.delete(`/usuarios/${id}`);
      loadUsuarios();
    }
  };

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u =>
      `${u.nombre} ${u.apellido} ${u.numero_documento}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usuarios, searchTerm]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="secondary.main">
          Usuarios (Población)
        </Typography>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Agregar Usuario Población
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          fullWidth size="small"
          placeholder="Buscar habitante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="secondary" /></InputAdornment> }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {filteredUsuarios.length} ciudadanos
        </Typography>
      </Paper>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'secondary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Identificación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Completo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Edad / Nacimiento</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contacto</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsuarios.map((row) => (
              <TableRow key={row._id || row.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{row.numero_documento}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.tipo_documento}</Typography>
                </TableCell>
                <TableCell>{row.nombre} {row.apellido}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={`${row.edad || calcularEdad(row.fecha_nacimiento)} años`} size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
                    <Typography variant="caption" color="text.secondary">({row.fecha_nacimiento?.split('T')[0]})</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{row.telefono}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.correo}</Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(row._id || row.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Registro' : 'Nuevo Usuario Población'}</DialogTitle>
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

          <Box display="flex" gap={2} mt={1}>
            <TextField margin="dense" label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" InputLabelProps={{ shrink: true }} fullWidth value={formData.fecha_nacimiento} onChange={handleChange} />
            <TextField
              margin="dense" label="Edad" value={formData.edad} disabled sx={{ width: '120px' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
