import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, Divider,
  Chip, Accordion, AccordionSummary, AccordionDetails, MenuItem, TextField,
  Badge, InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../../api/api';

export default function EncuestasRealizadas() {
  const [encuestas, setEncuestas] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [filtroFormulario, setFiltroFormulario] = useState('todos');
  const [open, setOpen] = useState(false);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, fRes] = await Promise.all([
          api.get('/encuestas'),
          api.get('/formularios')
        ]);
        setEncuestas(eRes.data);
        setFormularios(fRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  // Encuestas filtradas
  const encuestasFiltradas = useMemo(() => {
    if (filtroFormulario === 'todos') return encuestas;
    return encuestas.filter(e => e.formulario_id?._id === filtroFormulario);
  }, [encuestas, filtroFormulario]);

  // Agrupar por formulario
  const agrupadas = useMemo(() => {
    const grupos = {};
    encuestasFiltradas.forEach(e => {
      const key = e.formulario_id?._id || 'sin_formulario';
      const titulo = e.formulario_id?.titulo || 'Sin formulario';
      if (!grupos[key]) grupos[key] = { titulo, items: [] };
      grupos[key].items.push(e);
    });
    return Object.values(grupos);
  }, [encuestasFiltradas]);

  const handleOpenDetalle = (enc) => {
    setSelectedEncuesta(enc);
    setOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Encuestas Realizadas
      </Typography>

      {/* Filtro por formulario */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FilterListIcon color="action" />
        <TextField
          select
          label="Filtrar por Formulario"
          value={filtroFormulario}
          onChange={(e) => setFiltroFormulario(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
        >
          <MenuItem value="todos">Todos los formularios</MenuItem>
          {formularios.map(f => (
            <MenuItem key={f._id} value={f._id}>
              {f.titulo}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary">
          {encuestasFiltradas.length} encuesta(s) encontrada(s)
        </Typography>
      </Paper>

      {/* Agrupadas por formulario */}
      {agrupadas.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">No hay encuestas registradas con este filtro.</Typography>
        </Paper>
      ) : (
        agrupadas.map((grupo, gi) => (
          <Accordion key={gi} defaultExpanded sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }} elevation={3}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography fontWeight="bold">{grupo.titulo}</Typography>
                <Chip
                  label={`${grupo.items.length} encuesta(s)`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 'bold' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ciudadano Encuestado</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Encuestador (Staff)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Respuestas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grupo.items.map((row) => (
                      <TableRow key={row._id} hover>
                        <TableCell>
                          <Typography fontWeight="bold" variant="body2">
                            {row.usuario_id?.nombre} {row.usuario_id?.apellido}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.usuario_id?.numero_documento || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.usuario_id?.tipo_documento || ''}</Typography>
                        </TableCell>
                        <TableCell>{row.encuestador_id?.nombre}</TableCell>
                        <TableCell>{new Date(row.fecha).toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleOpenDetalle(row)}>
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Modal detalle de respuestas */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold" color="primary.main">
          Detalle de Caracterización
        </DialogTitle>
        <DialogContent dividers>
          {selectedEncuesta && (
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Formulario: <strong>{selectedEncuesta.formulario_id?.titulo}</strong>
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Ciudadano: <strong>{selectedEncuesta.usuario_id?.nombre} {selectedEncuesta.usuario_id?.apellido}</strong>
              </Typography>
              {selectedEncuesta.usuario_id?.numero_documento && (
                <Typography variant="subtitle2" color="text.secondary">
                  Doc: {selectedEncuesta.usuario_id?.tipo_documento} — {selectedEncuesta.usuario_id?.numero_documento}
                </Typography>
              )}
              <Typography variant="subtitle2" color="text.secondary">
                Encuestador: <strong>{selectedEncuesta.encuestador_id?.nombre}</strong>
              </Typography>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="secondary.main" gutterBottom>Respuestas:</Typography>

              {selectedEncuesta.respuestas.map((r, i) => (
                <Box key={i} mb={2} p={2} bgcolor="grey.50" borderRadius={2} border="1px solid #e0e0e0">
                  <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
                    Pregunta #{i + 1}
                  </Typography>
                  <Typography variant="body1" color="primary.main" fontWeight="medium">
                    {Array.isArray(r.respuesta) ? (
                      r.respuesta.map((opt, idx) => <Chip key={idx} label={opt} sx={{ mr: 1 }} size="small" />)
                    ) : typeof r.respuesta === 'boolean' ? (
                      r.respuesta ? 'Sí / Verdadero' : 'No / Falso'
                    ) : (
                      r.respuesta
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
