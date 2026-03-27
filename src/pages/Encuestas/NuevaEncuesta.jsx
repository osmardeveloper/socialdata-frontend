import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, Paper, Grid, MenuItem, Divider, 
  IconButton, Accordion, AccordionSummary, AccordionDetails, 
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, FormGroup, CircularProgress, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, Switch
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CakeIcon from '@mui/icons-material/Cake';
import api from '../../api/api';
import localDb from '../../api/offline';

const TIPOS_DOCUMENTO = ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte', 'Permiso de Protección Temporal (PPT)', 'Registro Civil'];

const EMPTY_USER = {
  tipo_documento: '',
  numero_documento: '',
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  edad: '',
  correo: '',
  telefono: '',
  direccion: '',
  rol: 'poblacion'
};

const calcularEdad = (fecha) => {
  if (!fecha) return '';
  const hoy = new Date();
  const cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) { edad--; }
  return edad;
};

function QuestionRenderer({ pregunta: p, respuestas, onRespChange, level = 0 }) {
  const pId = p._id || p.id || `sub-${p.nombre}-${level}`;
  const pl = level * 20;

  return (
    <Box sx={{ ml: pl, mb: 3 }}>
      {/* Solo mostrar nombre si es una subpregunta (level > 0) para evitar duplicidad */}
      {level > 0 && <Typography variant="body1" fontWeight="bold" gutterBottom>{p.nombre}</Typography>}
      
      {(p.tipo === 'texto' || p.tipo === 'abierta') && (
        <TextField fullWidth multiline={p.tipo === 'abierta'} rows={p.tipo === 'abierta' ? 2 : 1} variant="outlined" size="small" placeholder="Escriba su respuesta..." value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)} />
      )}

      {p.tipo === 'numero' && (
        <TextField fullWidth type="number" variant="outlined" size="small" placeholder="0" value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)} />
      )}

      {p.tipo === 'booleano' && (
        <FormControlLabel control={<Switch checked={!!respuestas[pId]} onChange={(e) => onRespChange(pId, e.target.checked)} />} label={respuestas[pId] ? 'SÍ' : 'NO'} />
      )}

      {p.tipo === 'simple' && p.data && (
        <FormControl component="fieldset">
          <RadioGroup value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)}>
            {p.data.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              return (
                <Box key={i}>
                  <FormControlLabel value={optText} control={<Radio />} label={optText} />
                  {opt.subPreguntas?.length > 0 && respuestas[pId] === optText && (
                    <Box sx={{ mt: 1, borderLeft: '2px dashed #ccc', pl: 2 }}>
                       {opt.subPreguntas.map((sp, spi) => <QuestionRenderer key={spi} pregunta={sp} respuestas={respuestas} onRespChange={onRespChange} level={level + 1} />)}
                    </Box>
                  )}
                </Box>
              );
            })}
          </RadioGroup>
        </FormControl>
      )}

      {p.tipo === 'multiple' && p.data && (
        <FormControl component="fieldset">
          <FormGroup>
            {p.data.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              const isChecked = (respuestas[pId] || []).includes(optText);
              return (
                <Box key={i}>
                  <FormControlLabel control={<Checkbox checked={isChecked} onChange={(e) => onRespChange(pId, e.target.checked, true, optText)} />} label={optText} />
                  {opt.subPreguntas?.length > 0 && isChecked && (
                    <Box sx={{ mt: 1, borderLeft: '2px dashed #ccc', pl: 2 }}>
                       {opt.subPreguntas.map((sp, spi) => <QuestionRenderer key={spi} pregunta={sp} respuestas={respuestas} onRespChange={onRespChange} level={level + 1} />)}
                    </Box>
                  )}
                </Box>
              );
            })}
          </FormGroup>
        </FormControl>
      )}
    </Box>
  );
}

export default function NuevaEncuesta() {
  const [usuarios, setUsuarios] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [formSelect, setFormSelect] = useState('');
  const [preguntasActuales, setPreguntasActuales] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [userData, setUserData] = useState(EMPTY_USER);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      if (navigator.onLine) {
        const [uRes, fRes] = await Promise.all([api.get('/usuarios'), api.get('/formularios')]);
        setUsuarios(uRes.data);
        setFormularios(fRes.data);
        if (fRes.data) await localDb.saveTemplates(fRes.data);
        if (uRes.data) await localDb.saveCiudadanosList(uRes.data);
      } else {
        const localTemplates = await localDb.getTemplates();
        const localUsers = await localDb.searchCiudadanos('');
        setFormularios(localTemplates || []);
        setUsuarios(localUsers || []);
      }
    } catch (error) { 
      const localTemplates = await localDb.getTemplates();
      setFormularios(localTemplates || []);
    }
  };
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (userData.fecha_nacimiento) { setUserData(prev => ({ ...prev, edad: calcularEdad(userData.fecha_nacimiento) })); }
  }, [userData.fecha_nacimiento]);

  const handleSelectUser = (user) => {
    setUsuarioEncontrado(user);
    setUserData({ ...user, fecha_nacimiento: user.fecha_nacimiento?.split('T')[0] || '', edad: user.edad || calcularEdad(user.fecha_nacimiento) });
    setUserModalOpen(false);
  };

  const handleDocumentoChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setUserData(prev => ({ ...prev, numero_documento: val }));
    setUsuarioEncontrado(null);
    clearTimeout(debounceRef.current);
    if (val.length >= 4) {
      if (navigator.onLine) {
        setBuscando(true);
        debounceRef.current = setTimeout(async () => {
          try {
            const { data } = await api.get(`/usuarios/buscar?numero_documento=${val}`);
            handleSelectUser(data);
          } catch { 
            // Si falla el server, intentamos local
            const found = usuarios.find(u => u.numero_documento === val);
            if (found) handleSelectUser(found);
          }
          setBuscando(false);
        }, 600);
      } else {
        const found = usuarios.find(u => u.numero_documento === val);
        if (found) handleSelectUser(found);
      }
    } else { setBuscando(false); }
  };

  const handleFormSelect = (e) => {
    const formId = e.target.value;
    setFormSelect(formId);
    const form = formularios.find(f => f._id === formId || f.id === formId);
    if (form) {
      const flat = form.preguntas.flatMap(b => b.detalles);
      setPreguntasActuales(flat);
      if (flat.length > 0) setExpanded(flat[0]._id || flat[0].id);
      setRespuestas({});
    }
  };

  const handleRespChange = (pregId, valor, isMultiple = false, item = null) => {
    if (isMultiple) {
      const prev = Array.isArray(respuestas[pregId]) ? respuestas[pregId] : [];
      const next = valor ? [...prev, item] : prev.filter(v => v !== item);
      setRespuestas({ ...respuestas, [pregId]: next });
    } else { setRespuestas({ ...respuestas, [pregId]: valor }); }
  };

  const handleGuardar = async () => {
    if (!userData.numero_documento || !userData.nombre || !formSelect) return alert('Completa los campos obligatorios');
    try {
      let finalUserId = usuarioEncontrado?._id || usuarioEncontrado?.id;
      const respArray = Object.keys(respuestas).map(k => ({
        pregunta_id: k.startsWith('sub-') ? null : k,
        pregunta_nombre: k.startsWith('sub-') ? k : null,
        respuesta: respuestas[k]
      }));

      if (navigator.onLine) {
        if (!finalUserId) {
          const { data: newUser } = await api.post('/usuarios', userData);
          finalUserId = newUser._id || newUser.id;
        }
        await api.post('/encuestas', { formulario_id: formSelect, usuario_id: finalUserId, respuestas: respArray });
        alert('¡Encuesta guardada con éxito en la nube!');
      } else {
        if (!finalUserId) {
          finalUserId = await localDb.saveCiudadanoLocal({ ...userData });
        }
        await localDb.saveEncuestaOffline({
          formulario_id: formSelect,
          usuario_id: finalUserId,
          respuestas: respArray,
          fecha: new Date().toISOString(),
          _tempId: `survey_${Date.now()}`
        });
        alert('✅ BLOQUEO OFFLINE: Encuesta guardada LOCALMENTE. Se sincronizará al detectar internet.');
      }
      setUserData(EMPTY_USER); setUsuarioEncontrado(null); setFormSelect(''); setPreguntasActuales([]); setRespuestas({});
    } catch (err) { alert('Error: ' + err.message); }
  };

  const filteredUsers = useMemo(() => {
    return usuarios.filter(u => `${u.nombre} ${u.apellido} ${u.numero_documento}`.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [usuarios, searchQuery]);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>Nueva Caracterización</Typography>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="secondary.main" fontWeight="bold">1. Datos del Ciudadano</Typography>
          <Button variant="outlined" startIcon={<PersonSearchIcon />} onClick={() => setUserModalOpen(true)}>Buscador de Ciudadanos</Button>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Tipo de Documento" value={userData.tipo_documento} onChange={e => setUserData({ ...userData, tipo_documento: e.target.value })} disabled={!!usuarioEncontrado} size="small">
               {TIPOS_DOCUMENTO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Número de Documento" value={userData.numero_documento} onChange={handleDocumentoChange} size="small" InputProps={{ startAdornment: <SearchIcon color="action" /> }} helperText={usuarioEncontrado ? `✔ Ciudadano: ${usuarioEncontrado.nombre} ${usuarioEncontrado.apellido}` : ''} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nombre" value={userData.nombre} onChange={e => setUserData({ ...userData, nombre: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Apellido" value={userData.apellido} onChange={e => setUserData({ ...userData, apellido: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Fecha de Nacimiento" type="date" InputLabelProps={{ shrink: true }} value={userData.fecha_nacimiento} onChange={e => setUserData({ ...userData, fecha_nacimiento: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Edad" value={userData.edad} disabled size="small" InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon fontSize="small" /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Dirección" multiline rows={2} value={userData.direccion} onChange={e => setUserData({ ...userData, direccion: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" color="secondary.main" fontWeight="bold" gutterBottom>2. Caracterización</Typography>
        <TextField select fullWidth label="Seleccionar Formulario" value={formSelect} onChange={handleFormSelect} sx={{ mb: 3 }}>
          {formularios.map(f => <MenuItem key={f._id || f.id} value={f._id || f.id}>{f.titulo}</MenuItem>)}
        </TextField>
        {preguntasActuales.length > 0 && (
          <Box>
            {preguntasActuales.map((p, idx) => (
              <Accordion key={p._id || p.id} expanded={expanded === (p._id || p.id)} onChange={() => setExpanded(expanded === (p._id || p.id) ? false : (p._id || p.id))} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="bold">{idx + 1}. {p.nombre}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <QuestionRenderer pregunta={p} respuestas={respuestas} onRespChange={handleRespChange} />
                </AccordionDetails>
              </Accordion>
            ))}
            <Button variant="contained" color="success" size="large" fullWidth sx={{ mt: 3 }} onClick={handleGuardar} startIcon={<SendIcon />}>Guardar Encuesta</Button>
          </Box>
        )}
      </Paper>
      <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle> Selección de Ciudadano </DialogTitle>
        <DialogContent dividers>
          <TableContainer><Table><TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Documento</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>
            {filteredUsers.map(u => (<TableRow key={u._id || u.id} hover><TableCell>{u.nombre} {u.apellido}</TableCell><TableCell>{u.numero_documento}</TableCell><TableCell><Button variant="contained" size="small" onClick={() => handleSelectUser(u)}>Seleccionar</Button></TableCell></TableRow>))}
          </TableBody></Table></TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
