import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Collapse, Dialog, DialogTitle,
  DialogContent, Button, Divider
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from '../../api/api';

// Fila expandible para mostrar las preguntas del formulario
function FormRow({ form }) {
  const [open, setOpen] = useState(false);

  const tipoColor = { texto: 'default', booleano: 'secondary', numero: 'primary', simple: 'info', multiple: 'warning' };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell><Typography fontWeight="bold">{form.titulo}</Typography></TableCell>
        <TableCell>{form.preguntas?.reduce((acc, b) => acc + (b.detalles?.length || 0), 0)} preguntas</TableCell>
        <TableCell>{new Date(form.createdAt).toLocaleDateString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 4, py: 2, bgcolor: '#f9f9f9' }}>
              <Typography variant="subtitle2" color="secondary.main" fontWeight="bold" gutterBottom>
                Preguntas incluidas:
              </Typography>
              {form.preguntas?.map((bloque, bi) =>
                bloque.detalles?.map((d, di) => (
                  <Box key={`${bi}-${di}`} display="flex" alignItems="center" gap={2} mb={1}>
                    <Chip label={d.tipo} size="small" color={tipoColor[d.tipo] || 'default'} />
                    <Typography variant="body2">{d.nombre}</Typography>
                    {(d.tipo === 'simple' || d.tipo === 'multiple') && Array.isArray(d.data) && (
                      <Typography variant="caption" color="text.secondary">
                        ({d.data.join(', ')})
                      </Typography>
                    )}
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

  useEffect(() => {
    api.get('/formularios').then(({ data }) => setFormularios(data)).catch(console.error);
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Listado de Formularios
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', width: 60 }} />
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Título del Formulario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Preguntas</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha de Creación</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formularios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay formularios creados aún.
                </TableCell>
              </TableRow>
            ) : (
              formularios.map(f => <FormRow key={f._id} form={f} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
