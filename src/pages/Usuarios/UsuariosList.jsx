import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, MenuItem, Stack, Paper, IconButton, Grid, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CakeIcon from '@mui/icons-material/Cake';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/api';
import localDb from '../../api/offline';

const calcularEdad = (fecha) => {
  if (!fecha) return '';
  const hoy = new Date();
  const cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) { edad--; }
  return edad;
};

const EMPTY_FORM = {
  tipo_documento: 'Cédula de Ciudadanía',
  numero_documento: '',
  nombre: '',
  apellido: '',
  telefono: '',
  correo: '',
  direccion: '',
  fecha_nacimiento: '',
  edad: '',
  rol: 'poblacion'
};

const getSiglaDocumento = (tipo) => {
  if (tipo === 'Cédula de Ciudadanía') return 'CC';
  if (tipo === 'Tarjeta de Identidad') return 'TI';
  if (tipo === 'Pasaporte') return 'PAS';
  if (tipo === 'Cédula de Extranjería') return 'CE';
  return 'DOC';
};

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    const checkNet = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', checkNet);
    window.addEventListener('offline', checkNet);
    return () => { window.removeEventListener('online', checkNet); window.removeEventListener('offline', checkNet); };
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      if (navigator.onLine) {
         const res = await api.get('/usuarios?rol=poblacion');
         setUsuarios(res?.data || []);
         await Promise.all((res?.data || []).map(u => localDb.saveCiudadanoLocal(u)));
      } else {
         const local = await localDb.searchCiudadanos('');
         setUsuarios(local || []);
      }
    } catch (e) {
      const local = await localDb.searchCiudadanos('');
      setUsuarios(local || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleOpen = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setOpen(true);
  };

  const handleEdit = (u) => {
    setFormData({ ...u, fecha_nacimiento: u.fecha_nacimiento?.split('T')[0] || '', edad: u.edad || calcularEdad(u.fecha_nacimiento) });
    setIsEditing(true);
    setOpen(true);
  };

  const handleDelete = async (uId) => {
    if (!uId) return;
    if (!window.confirm("¿Está seguro de eliminar este ciudadano?")) return;
    try {
      if (navigator.onLine && !String(uId).startsWith('offline_')) {
         await api.delete(`/usuarios/${uId}`);
      } else if (String(uId).startsWith('offline_')) {
         await localDb.deleteCiudadanoLocal(uId);
      } else {
         return alert("MODO OFFLINE: Debe tener internet para borrar registros de la nube.");
      }
      fetchUsuarios();
    } catch (e) { alert("Fallo al eliminar."); }
  };

  const handleSaveUsuario = async () => {
    if (!formData.nombre || !formData.numero_documento) return alert("Complete los datos obligatorios.");
    try {
      if (navigator.onLine) {
         if (isEditing) await api.put(`/usuarios/${formData._id}`, formData);
         else await api.post('/usuarios', formData);
      } else {
         const tempUser = { ...formData, _id: isEditing ? formData._id : `offline_${Date.now()}` }; 
         await localDb.saveCiudadanoLocal(tempUser);
      }
      setOpen(false);
      fetchUsuarios();
    } catch (e) { alert("Fallo en guardado. Verifique datos o conexión."); }
  };

  const filteredUsuarios = usuarios.filter(u => 
    (u.nombre?.toLowerCase().includes(search.toLowerCase())) || 
    (u.numero_documento?.includes(search))
  );

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, pt: 12, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
         <Box><Typography variant="h4" fontWeight="900" color="#1e293b">Usuarios (Población)</Typography><Typography color="text.secondary">Gestión administrativa de beneficiarios</Typography></Box>
         <Stack direction="row" spacing={2}>
            {isOffline && <Chip icon={<CloudOffIcon />} label="MODO OFFLINE" color="warning" sx={{ fontWeight: 'bold' }} />}
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: 3, fontWeight: 'bold', px: 3 }}>AGREGAR CIUDADANO</Button>
         </Stack>
      </Stack>

      <Paper sx={{ borderRadius: 5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
         <Box sx={{ p: 3, bgcolor: 'white' }}>
            <TextField fullWidth size="small" placeholder="Buscar identificación o nombre..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
         </Box>

         <TableContainer>
            <Table>
               <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                     <TableCell sx={{ fontWeight: 'bold' }}>Identificación</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }}>Nacimiento / Edad</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                     <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
               </TableHead>
               <TableBody>
                  {loading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={20} sx={{ m: 3 }} /></TableCell></TableRow> : (
                    filteredUsuarios.map(u => (
                       <TableRow key={u._id || u.id} hover>
                          <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>
                             {getSiglaDocumento(u.tipo_documento)}: {u.numero_documento}
                          </TableCell>
                          <TableCell fontWeight="800" sx={{ color: '#1e293b' }}>{u.nombre} {u.apellido}</TableCell>
                          <TableCell>
                             {u.fecha_nacimiento?.split('T')[0] || '---'} 
                             <Typography variant="caption" sx={{ ml: 1, bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1 }}>
                                ({u.edad || calcularEdad(u.fecha_nacimiento)} años)
                             </Typography>
                          </TableCell>
                          <TableCell>
                             {String(u._id)?.startsWith('offline_') ? (
                                <Chip size="small" label="Local" color="warning" variant="outlined" sx={{ fontWeight: 'bold' }} />
                             ) : (
                                <Chip size="small" label="Nube" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />
                             )}
                          </TableCell>
                          <TableCell align="center">
                             <Stack direction="row" spacing={1} justifyContent="center">
                                <IconButton size="small" color="primary" onClick={() => handleEdit(u)} sx={{ bgcolor: '#eff6ff' }}><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete(u._id || u.id)} sx={{ bgcolor: '#fef2f2' }}><DeleteIcon fontSize="small" /></IconButton>
                             </Stack>
                          </TableCell>
                       </TableRow>
                    ))
                  )}
               </TableBody>
            </Table>
         </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
         <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', color: 'white' }}>
            <Typography variant="h6" fontWeight="bold">{isEditing ? 'Editar Ciudadano' : 'Nuevo Usuario Población'}</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
         </DialogTitle>
         <DialogContent sx={{ p: 4, pt: 5 }}>
            <Grid container spacing={3}>
               <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Tipo de Documento" size="small" sx={{ mt: 1.5 }} value={formData.tipo_documento} onChange={e => setFormData({...formData, tipo_documento: e.target.value})}>
                     <MenuItem value="Cédula de Ciudadanía">Cédula de Ciudadanía</MenuItem>
                     <MenuItem value="Tarjeta de Identidad">Tarjeta de Identidad</MenuItem>
                     <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                  </TextField>
               </Grid>
               <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Número de Documento" size="small" sx={{ mt: 1.5 }} value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value})} />
               </Grid>
               <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Nombre" size="small" sx={{ mt: 1.5 }} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
               </Grid>
               <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Apellido" size="small" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
               </Grid>
               <Grid item xs={12} sm={8}>
                  <TextField fullWidth label="Dirección de Residencia" size="small" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
               </Grid>
               <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Teléfono" size="small" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} />
               </Grid>
               <Grid item xs={12}>
                  <TextField fullWidth label="Correo Electrónico" size="small" type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
               </Grid>
               <Grid item xs={12} sm={8}>
                  <TextField fullWidth label="Fecha de Nacimiento" type="date" size="small" InputLabelProps={{ shrink: true }} value={formData.fecha_nacimiento} onChange={e => {
                     const date = e.target.value;
                     setFormData({...formData, fecha_nacimiento: date, edad: calcularEdad(date)});
                  }} />
               </Grid>
               <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Edad" size="small" disabled value={formData.edad} InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon fontSize="small" /></InputAdornment> }} />
               </Grid>
            </Grid>
         </DialogContent>
         <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
            <Button variant="contained" onClick={handleSaveUsuario} sx={{ px: 5, borderRadius: 3, fontWeight: 'bold' }}>{isEditing ? 'ACTUALIZAR DATOS' : 'GUARDAR CIUDADANO'}</Button>
         </DialogActions>
      </Dialog>
    </Box>
  );
}
