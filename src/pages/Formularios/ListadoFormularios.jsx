import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Collapse, Alert, Button, Divider,
  Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItem, ListItemIcon, ListItemText, Checkbox
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api/api';

const TIPO_COLOR = { texto: 'default', booleano: 'secondary', numero: 'primary', simple: 'info', multiple: 'warning' };

// Fila expandible para mostrar las preguntas del formulario
function FormRow({ form, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 60 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell><Typography fontWeight="bold">{form.titulo}</Typography></TableCell>
        <TableCell>{form.preguntas?.reduce((acc, b) => acc + (b.detalles?.length || 0), 0)} preguntas</TableCell>
        <TableCell>{new Date(form.createdAt).toLocaleDateString()}</TableCell>
        <TableCell align="right">
          <Tooltip title="Editar Formulario">
            <IconButton color="primary" onClick={() => onEdit(form)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Formulario">
            <IconButton color="error" onClick={() => onDelete(form._id || form.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 4, py: 2, bgcolor: '#f9f9f9', borderLeft: '4px solid #1565C0', my: 1 }}>
              <Typography variant="subtitle2" color="secondary.main" fontWeight="bold" gutterBottom>
                Preguntas incluidas:
              </Typography>
              {form.preguntas?.map((bloque, bi) =>
                bloque.detalles?.map((d, di) => (
                  <Box key={`${bi}-${di}`} display="flex" alignItems="center" gap={2} mb={1}>
                    <Chip label={d.tipo} size="small" color={TIPO_COLOR[d.tipo] || 'default'} variant="outlined" />
                    <Typography variant="body2">{d.nombre}</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ListadoFormularios() {
  const [formularios, setFormularios] = useState([]);
  const [availablePreguntas, setAvailablePreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para Modal de Edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editSelectedIds, setEditSelectedIds] = useState([]);
  const [editSearch, setEditSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: forms }, { data: pregs }] = await Promise.all([
        api.get('/formularios'),
        api.get('/formularios/preguntas')
      ]);
      setFormularios(forms);
      setAvailablePreguntas(pregs);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este formulario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/formularios/${id}`);
      setMessage({ type: 'success', text: 'Formulario eliminado correctamente' });
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar el formulario' });
    }
  };

  const handleEditOpen = (form) => {
    setEditingForm(form);
    setEditTitulo(form.titulo);
    // Extraer solo IDs de las preguntas actuales (pueden ser pobladas u objetos)
    const pIds = form.preguntas.map(p => p._id || p.id);
    setEditSelectedIds(pIds);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditingForm(null);
    setEditSelectedIds([]);
  };

  const handleTogglePregunta = (id) => {
    setEditSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSaveEdit = async () => {
    if (!editTitulo.trim() || editSelectedIds.length === 0) return;
    setSaving(true);
    try {
      await api.put(`/formularios/${editingForm._id || editingForm.id}`, {
        titulo: editTitulo,
        preguntas: editSelectedIds
      });
      setMessage({ type: 'success', text: 'Formulario actualizado correctamente' });
      handleEditClose();
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al actualizar.' });
    } finally { setSaving(false); }
  };

  const filteredPreguntas = useMemo(() => 
    availablePreguntas.filter(p => p.detalles?.[0]?.nombre?.toLowerCase().includes(editSearch.toLowerCase())),
  [availablePreguntas, editSearch]);

  const selectedPreview = useMemo(() => 
    availablePreguntas.filter(p => editSelectedIds.includes(p._id || p.id)),
  [availablePreguntas, editSelectedIds]);

  if (loading && formularios.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 3 }}>
        Listado de Formularios
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'secondary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', width: 60 }} />
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Título del Formulario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Preguntas</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha de Creación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formularios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No hay formularios creados aún.
                </TableCell>
              </TableRow>
            ) : (
              formularios.map(f => (
                <FormRow 
                  key={f._id || f.id} 
                  form={f} 
                  onDelete={handleDelete} 
                  onEdit={handleEditOpen} 
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE EDICIÓN DE FORMULARIO */}
      <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Editar Formulario: {editingForm?.titulo}
          <IconButton onClick={handleEditClose}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField 
            fullWidth label="Título del Formulario" 
            value={editTitulo} 
            onChange={(e) => setEditTitulo(e.target.value)} 
            sx={{ mb: 3 }} 
          />
          <Box sx={{ display: 'flex', gap: 2, height: '400px' }}>
            {/* Panel de Preguntas Disponibles */}
            <Paper variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold">Preguntas Disponibles</Typography>
              <TextField 
                size="small" placeholder="Filtrar..." 
                value={editSearch} onChange={(e) => setEditSearch(e.target.value)} 
                sx={{ my: 1 }} 
              />
              <Divider />
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {filteredPreguntas.map(p => (
                  <ListItem key={p._id || p.id} dense button onClick={() => handleTogglePregunta(p._id || p._localId)}>
                    <ListItemIcon><Checkbox edge="start" checked={editSelectedIds.includes(p._id || p._localId)} /></ListItemIcon>
                    <ListItemText primary={p.detalles?.[0]?.nombre} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Panel de Preguntas Seleccionadas */}
            <Paper variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
              <Typography variant="subtitle2" fontWeight="bold">En este Formulario ({editSelectedIds.length})</Typography>
              <Divider sx={{ my: 1 }} />
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {selectedPreview.map(p => (
                  <ListItem key={p._id || p.id} dense>
                    <ListItemText primary={p.detalles?.[0]?.nombre} />
                    <IconButton size="small" color="error" onClick={() => handleTogglePregunta(p._id || p._localId)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button 
            variant="contained" startIcon={<SaveIcon />} 
            onClick={handleSaveEdit} disabled={saving}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
