import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import api from '../../api/api';
import localDb from '../../api/offline';

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    rol: 'encuestador'
  });

  useEffect(() => {
    const checkNet = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', checkNet);
    window.addEventListener('offline', checkNet);
    return () => { window.removeEventListener('online', checkNet); window.removeEventListener('offline', checkNet); };
  }, []);

  const loadStaff = async () => {
    try {
      if (navigator.onLine) {
        const { data } = await api.get('/staff');
        setStaff(data);
        await localDb.saveStaffList(data);
      } else {
        const local = await localDb.searchStaff('');
        setStaff(local || []);
      }
    } catch (error) {
      const local = await localDb.searchStaff('');
      setStaff(local || []);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user._id || user.id);
      setFormData({ nombre: user.nombre, usuario: user.usuario, password: '', rol: user.rol, _id: user._id || user.id });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', usuario: '', password: '', rol: 'encuestador' });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (navigator.onLine) {
        if (editingId && !String(editingId).startsWith('offline_')) {
          const payload = { ...formData };
          if (!payload.password) delete payload.password;
          await api.put(`/staff/${editingId}`, payload);
        } else {
          await api.post('/staff', formData);
        }
      } else {
        const tempStaff = { ...formData, _id: editingId || `offline_${Date.now()}` };
        await localDb.saveStaffLocal(tempStaff);
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
        if (navigator.onLine && !String(id).startsWith('offline_')) {
          await api.delete(`/staff/${id}`);
        } else {
          await localDb.deleteStaffLocal(id);
        }
        loadStaff();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
           <Typography variant="h4" fontWeight="bold">Gestión de Staff</Typography>
           <Typography variant="body2" color="text.secondary">Usuarios con acceso al sistema</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isOffline && <Chip icon={<CloudOffIcon />} label="MODO OFFLINE" color="warning" sx={{ fontWeight: 'bold' }} />}
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
            Nuevo Usuario Staff
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rol</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Origen</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((row) => (
              <TableRow key={row._id || row.id} hover>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.usuario}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{row.rol}</TableCell>
                <TableCell>
                  {String(row._id || row.id).startsWith('offline_') ? (
                    <Chip size="small" label="Local" color="warning" variant="outlined" />
                  ) : (
                    <Chip size="small" label="Nube" color="success" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(row._id || row.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay registros para mostrar</TableCell>
              </TableRow>
            )}
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
