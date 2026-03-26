import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, Box, TextField, Grid, Paper, List, ListItem, 
  ListItemText, ListItemIcon, Checkbox, Button, Divider, 
  Chip, Alert, CircularProgress, InputAdornment, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ListAltIcon from '@mui/icons-material/ListAlt';
import api from '../../api/api';

const PARENTESCOS = ['Mamá', 'Papá', 'Hijo', 'Hija', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Otro'];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`family-tabpanel-${index}`} style={{ width: '100%' }} {...other}>
      {value === index && <Box sx={{ py: 3, width: '100%' }}>{children}</Box>}
    </div>
  );
}

export default function GrupoFamiliarPage() {
  const [tabValue, setTabValue] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listadoSearch, setListadoSearch] = useState(''); // Nuevo buscador de listado
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editMembers, setEditMembers] = useState([]);
  const [editSearch, setEditSearch] = useState('');

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [uRes, gRes] = await Promise.all([api.get('/usuarios'), api.get('/grupos-familiares')]);
      setUsuarios(uRes.data);
      setGrupos(gRes.data);
    } catch (err) { setMessage({ type: 'error', text: 'Error al cargar datos' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTabChange = (e, newValue) => { setTabValue(newValue); fetchData(true); };

  const selectedIds = useMemo(() => selectedMembers.map(m => m._id), [selectedMembers]);
  const availableCreate = useMemo(() => usuarios.filter(u => !u.grupo_familiar_id || selectedIds.includes(u._id || u.id)), [usuarios, selectedIds]);
  const filteredCreate = useMemo(() => availableCreate.filter(u => `${u.nombre} ${u.apellido} ${u.numero_documento}`.toLowerCase().includes(search.toLowerCase())), [availableCreate, search]);

  const filteredListado = useMemo(() => {
    return grupos.filter(g => {
      const matchFamilia = g.nombre_familia.toLowerCase().includes(listadoSearch.toLowerCase());
      const matchMiembros = g.miembros?.some(m => `${m.nombre} ${m.apellido}`.toLowerCase().includes(listadoSearch.toLowerCase()));
      const matchCodigo = g.codigo_identificador?.toLowerCase().includes(listadoSearch.toLowerCase());
      return matchFamilia || matchMiembros || matchCodigo;
    });
  }, [grupos, listadoSearch]);

  const handleToggleCreate = (id) => {
    const idx = selectedIds.indexOf(id);
    if (idx === -1) setSelectedMembers([...selectedMembers, { _id: id, parentesco: 'Otro' }]);
    else setSelectedMembers(selectedMembers.filter(m => m._id !== id));
  };

  const handleParentescoChange = (id, newVal) => {
    setSelectedMembers(selectedMembers.map(m => m._id === id ? { ...m, parentesco: newVal } : m));
  };

  const handleSave = async () => {
    if (!nombreFamilia.trim() || selectedMembers.length === 0) return alert('Datos incompletos');
    setSaving(true);
    try {
      await api.post('/grupos-familiares', { nombre_familia: nombreFamilia, miembros: selectedMembers });
      setNombreFamilia(''); setSelectedMembers([]); fetchData(true);
      setMessage({ type: 'success', text: `Familia creada.` });
    } catch (err) { alert('Error al guardar'); }
    finally { setSaving(false); }
  };

  const openEditModal = (grupo) => {
    setEditingGrupo(grupo); setEditNombre(grupo.nombre_familia);
    setEditMembers(grupo.miembros.map(m => ({ _id: m._id || m.id, parentesco: m.parentesco || 'Otro' })));
    setEditDialogOpen(true);
  };

  const closeEditModal = () => { setEditDialogOpen(false); setEditingGrupo(null); setEditMembers([]); };

  const editingIds = useMemo(() => editMembers.map(m => m._id), [editMembers]);
  const handleToggleEdit = (id) => {
    const idx = editingIds.indexOf(id);
    if (idx === -1) setEditMembers([...editMembers, { _id: id, parentesco: 'Otro' }]);
    else setEditMembers(editMembers.filter(m => m._id !== id));
  };

  const handleUpdate = async () => {
    if (!editNombre.trim() || editMembers.length === 0) return;
    setSaving(true);
    try {
      await api.put(`/grupos-familiares/${editingGrupo._id || editingGrupo.id}`, { nombre_familia: editNombre, miembros: editMembers });
      closeEditModal(); fetchData(true);
      setMessage({ type: 'success', text: 'Actualizada correctamente' });
    } catch (err) { alert('Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar grupo?')) return;
    await api.delete(`/grupos-familiares/${id}`);
    fetchData(true);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <FamilyRestroomIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold">Grupos Familiares</Typography>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<PostAddIcon />} iconPosition="start" label="Creación" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<ListAltIcon />} iconPosition="start" label="Listado" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', gap: 3, width: '100%', height: '70vh', mt: 1 }}>
          <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">Población Disponible</Typography>
            <TextField fullWidth size="small" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {filteredCreate.map((u) => (
                <ListItem key={u._id || u.id} dense button onClick={() => handleToggleCreate(u._id || u.id)} sx={{ borderRadius: 1 }}>
                  <ListItemIcon><Checkbox edge="start" checked={selectedIds.includes(u._id || u.id)} /></ListItemIcon>
                  <ListItemText primary={`${u.nombre} ${u.apellido}`} secondary={`CC: ${u.numero_documento}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
          <Paper sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', bgcolor: '#fbfbfb', borderRadius: 2 }}>
            <TextField fullWidth label="Nombre de la Familia" value={nombreFamilia} onChange={(e) => setNombreFamilia(e.target.value)} sx={{ mb: 3, bgcolor: 'white' }} />
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {selectedMembers.map((m) => {
                const u = usuarios.find(usr => usr._id === m._id || usr.id === m._id);
                return (
                  <ListItem key={m._id} divider sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <ListItemText primary={`${u?.nombre} ${u?.apellido}`} sx={{ flex: '1 1 200px' }} />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={m.parentesco} onChange={(e) => handleParentescoChange(m._id, e.target.value)}>
                        {PARENTESCOS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <IconButton size="small" color="error" onClick={() => handleToggleCreate(m._id)}><CloseIcon /></IconButton>
                  </ListItem>
                );
              })}
            </List>
            <Button fullWidth variant="contained" onClick={handleSave} disabled={saving} sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}>Crear Familia</Button>
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField 
            fullWidth size="small" 
            placeholder="Buscar por nombre de familia o por cualquier integrante..." 
            value={listadoSearch} 
            onChange={(e) => setListadoSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> }}
          />
        </Paper>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow>
              <TableCell>Nombre Familia</TableCell><TableCell>Código</TableCell><TableCell>Miembros (Parentesco)</TableCell><TableCell align="center">Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filteredListado.map((g) => (
                <TableRow key={g._id || g.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{g.nombre_familia}</TableCell>
                  <TableCell><Chip label={g.codigo_identificador} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>
                    {g.miembros?.map((m) => (
                      <Chip key={m._id || m.id} label={`${m.nombre} ${m.apellido} (${m.parentesco})`} size="small" sx={{ m: 0.3 }} variant="outlined" />
                    ))}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => openEditModal(g)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(g._id || g.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredListado.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{py:3}}>No se encontraron familias</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <Dialog open={editDialogOpen} onClose={closeEditModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          Editar: {editingGrupo?.nombre_familia}
          <IconButton onClick={closeEditModal} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Nombre Familia" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} sx={{mb:2}} />
          <Box sx={{ display: 'flex', gap: 2, height: '400px' }}>
            <Paper variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              <TextField fullWidth size="small" placeholder="Filtrar disponibles..." value={editSearch} onChange={(e) => setEditSearch(e.target.value)} sx={{mb:1}} />
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {filteredCreate.map(u => ( // Re-uso lógica filtrado
                  <ListItem key={u._id || u.id} dense button onClick={() => handleToggleEdit(u._id || u.id)}>
                    <ListItemIcon><Checkbox checked={editingIds.includes(u._id || u.id)} edge="start" /> </ListItemIcon>
                    <ListItemText primary={`${u.nombre} ${u.apellido}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>
            <Paper variant="outlined" sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#fafafa' }}>
              <List>
                {editMembers.map(m => {
                  const u = usuarios.find(usr => usr._id === m._id || usr.id === m._id);
                  return (
                    <ListItem key={m._id} divider sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <ListItemText primary={`${u?.nombre} ${u?.apellido}`} sx={{ flex: '1 1 100%' }} />
                      <Select size="small" fullWidth value={m.parentesco} onChange={(e) => setEditMembers(editMembers.map(ev => ev._id === m._id ? {...ev, parentesco: e.target.value} : ev))}>
                        {PARENTESCOS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </Select>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={handleUpdate}>Actualizar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
