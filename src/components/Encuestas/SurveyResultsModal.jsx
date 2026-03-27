import React, { useState, useMemo, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Tab, Tabs,
  Box, Typography, Chip, Stack, List, ListItem, ListItemText, Divider,
  Paper, IconButton, Fade, Tooltip, Avatar, Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FunctionsIcon from '@mui/icons-material/Functions';

// Librerías de Gráficos y Exportación
import { BarChart, PieChart } from '@mui/x-charts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * COMPONENTE: SurveyResultsModal
 * Reutilizable para mostrar análisis de encuestas (Categóricas, Numéricas, Texto)
 */
const SurveyResultsModal = ({ open, onClose, question, responses = [] }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const printRef = useRef(null);

  // --- LÓGICA DE PROCESAMIENTO DE DATOS ---

  const processedData = useMemo(() => {
    if (!responses.length) return null;

    if (question.tipo === 'categorica') {
      const counts = {};
      responses.forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
      });
      // Mantener orden de opciones originales si existen
      const labels = question.opciones || Object.keys(counts);
      return labels.map(label => ({
        label,
        value: counts[label] || 0
      }));
    }

    if (question.tipo === 'numerica') {
      const nums = responses.map(Number).filter(n => !isNaN(n));
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;

      // Generar Rangos automáticamente (Histograma)
      const rangeSize = Math.ceil((max - min) / 5) || 5;
      const ranges = {};
      for (let i = 0; i < 5; i++) {
        const start = min + i * rangeSize;
        const end = start + rangeSize - 1;
        const label = `${start}-${end}`;
        ranges[label] = nums.filter(n => n >= start && n <= end).length;
      }

      return {
        stats: { min, max, avg: avg.toFixed(1), total: nums.length },
        chartData: Object.keys(ranges).map(k => ({ label: k, value: ranges[k] }))
      };
    }

    if (question.tipo === 'texto') {
      const words = responses.join(' ').toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const wordFreq = {};
      words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return { responses, topWords };
    }

    return null;
  }, [question, responses]);

  // --- FUNCIÓN DE EXPORTACIÓN A PDF ---

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.setFontSize(16);
    pdf.text("Reporte de Resultados - SocialData", 10, 15);
    pdf.setFontSize(10);
    pdf.text(`Pregunta: ${question.titulo}`, 10, 22);
    pdf.text(`Fecha: ${new Date().toLocaleString()}`, 10, 27);
    pdf.addImage(imgData, 'PNG', 10, 35, pdfWidth - 20, pdfHeight - 20);
    pdf.save(`Resultado_${question.titulo.substring(0, 15)}.pdf`);
  };

  // --- RENDERIZADO CONDICIONAL POR TAB ---

  const renderContent = () => {
    if (!processedData) return <Typography>No hay datos suficientes.</Typography>;

    switch (question.tipo) {
      case 'categorica':
        return (
          <Box ref={printRef} sx={{ mt: 2, height: 400 }}>
            {tabIndex === 0 ? (
              <BarChart
                xAxis={[{ scaleType: 'band', data: processedData.map(d => d.label) }]}
                series={[{ data: processedData.map(d => d.value), color: '#1976d2', label: 'Respuestas' }]}
                height={350}
                margin={{ top: 20, bottom: 60, left: 40 }}
              />
            ) : (
              <PieChart
                series={[{
                  data: processedData.map((d, i) => ({ id: i, value: d.value, label: d.label })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                }]}
                height={350}
              />
            )}
          </Box>
        );

      case 'numerica':
        return (
          <Box ref={printRef} sx={{ mt: 2 }}>
            <GridStats stats={processedData.stats} />
            <BarChart
              xAxis={[{ scaleType: 'band', data: processedData.chartData.map(d => d.label) }]}
              series={[{ data: processedData.chartData.map(d => d.value), color: '#2e7d32', label: 'Frecuencia' }]}
              height={300}
            />
          </Box>
        );

      case 'texto':
        return (
          <Box ref={printRef} sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>Palabras clave detectadas:</Typography>
              {processedData.topWords.map(([word, count], i) => (
                <Chip key={i} label={`${word} (${count})`} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 2 }}>
              {processedData.responses.map((resp, i) => (
                <ListItem key={i} divider={i !== responses.length - 1}>
                  <ListItemText primary={resp} />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">{question.titulo}</Typography>
          <Chip label={question.tipo.toUpperCase()} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }} />
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 4, minHeight: 450 }}>
        {question.tipo === 'categorica' && (
          <Tabs 
            value={tabIndex} 
            onChange={(e, v) => setTabIndex(v)} 
            centered 
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab icon={<BarChartIcon />} label="Gráfico de Barras" />
            <Tab icon={<PieChartIcon />} label="Gráfico de Torta" />
          </Tabs>
        )}
        
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Button 
          startIcon={<PictureAsPdfIcon />} 
          variant="contained" 
          color="secondary" 
          onClick={handleDownloadPDF}
          sx={{ fontWeight: 'bold' }}
        >
          Descargar PDF
        </Button>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// --- SUB-COMPONENTES AUXILIARES ---

const GridStats = ({ stats }) => (
  <Stack direction="row" spacing={2} sx={{ mb: 3 }} justifyContent="center">
    <StatCard label="Mínimo" value={stats.min} icon={<FunctionsIcon fontSize="small" />} color="#d32f2f" />
    <StatCard label="Máximo" value={stats.max} icon={<FunctionsIcon fontSize="small" />} color="#1976d2" />
    <StatCard label="Promedio" value={stats.avg} icon={<FunctionsIcon fontSize="small" />} color="#ed6c02" />
    <StatCard label="Total" value={stats.total} icon={<ListAltIcon fontSize="small" />} color="#2e7d32" />
  </Stack>
);

const StatCard = ({ label, value, icon, color }) => (
  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', minWidth: 100, borderTop: `4px solid ${color}` }}>
    <Box sx={{ color: color, mb: 0.5 }}>{icon}</Box>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" fontWeight="bold">{value}</Typography>
  </Paper>
);

export default SurveyResultsModal;
