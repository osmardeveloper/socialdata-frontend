import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../../api/api';

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    rol: 'encuestador'
  });

  const loadStaff = async () => {
    try {
      const { data } = await api.get('/staff');
      setStaff(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user._id);
      setFormData({ nombre: user.nombre, usuario: user.usuario, password: '', rol: user.rol });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', usuario: '', password: '', rol: 'encuestador' });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty pass on edit
        await api.put(`/staff/${editingId}`, payload);
      } else {
        await api.post('/staff', formData);
      }
      handleClose();
      loadStaff();
    } catch (error) {
      console.error(error);
      alert('Error guardando staff');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar usuario?')) {
      try {
        await api.delete(`/staff/${id}`);
        loadStaff();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Gestión de Staff</Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpen()}>
          Nuevo Usuario Staff
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rol</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.usuario}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{row.rol}</TableCell>
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
        <DialogTitle>{editingId ? 'Editar Staff' : 'Nuevo Staff'}</DialogTitle>
        <DialogContent dividers>
          <TextField margin="dense" label="Nombre" name="nombre" fullWidth value={formData.nombre} onChange={handleChange} />
          <TextField margin="dense" label="Usuario de Ingreso" name="usuario" fullWidth value={formData.usuario} onChange={handleChange} />
          <TextField margin="dense" label="Contraseña" name="password" type="password" fullWidth value={formData.password} onChange={handleChange} helperText={editingId ? "Dejar vacío para no cambiar" : ""} />
          <TextField margin="dense" label="Rol" name="rol" select fullWidth value={formData.rol} onChange={handleChange}>
            <MenuItem value="encuestador">Encuestador</MenuItem>
            <MenuItem value="administrador">Administrador</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
