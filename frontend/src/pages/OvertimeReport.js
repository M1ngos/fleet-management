import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Fade,
  Zoom,
  IconButton,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  EventNote as EventNoteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { attendanceService, driverService } from '../services/api';
import { toast } from 'react-toastify';

const OvertimeReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedDriver, setSelectedDriver] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [overtimeData, setOvertimeData] = useState([]);
  const [summary, setSummary] = useState({
    totalOvertime: 0,
    averageOvertime: 0,
    driverCount: 0,
  });
  const [totalOvertime, setTotalOvertime] = useState(0);

  const fetchOvertimeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attendanceService.getOvertimeReport(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        selectedDriver || undefined
      );

      const data = response.data;
      setOvertimeData(data);

      // Calculate summary statistics
      const total = data.reduce((sum, record) => sum + record.overtimeHours, 0);
      setTotalOvertime(total);

      const driverCount = new Set(data.map(record => record.driver._id)).size;

      setSummary({
        totalOvertime: total,
        averageOvertime: driverCount > 0 ? total / driverCount : 0,
        driverCount,
      });
    } catch (err) {
      setError('Failed to fetch overtime data');
      toast.error('Failed to fetch overtime data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDriver]);

  useEffect(() => {
    fetchOvertimeData();
  }, [fetchOvertimeData]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await driverService.getAll();
      setDrivers(response.data);
    } catch (err) {
      toast.error('Failed to fetch drivers');
    }
  };

  const handleDateChange = (date, type) => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleDriverChange = (event) => {
    setSelectedDriver(event.target.value);
  };

  const handleReset = () => {
    setStartDate(subDays(new Date(), 7));
    setEndDate(new Date());
    setSelectedDriver('');
  };

  const handleRefresh = () => {
    fetchOvertimeData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true}>
        <Typography variant="h4" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: 4,
          color: 'primary.main',
          fontWeight: 'bold'
        }}>
          <TrendingUpIcon fontSize="large" />
          Relatório de Horas Extras
        </Typography>
      </Fade>

      {error && (
        <Zoom in={true}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Zoom>
      )}

      <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Data Inicial"
                  value={startDate}
                  onChange={(date) => handleDateChange(date, 'start')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      InputProps={{
                        startAdornment: <CalendarIcon color="primary" sx={{ mr: 1 }} />, 
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Data Final"
                  value={endDate}
                  onChange={(date) => handleDateChange(date, 'end')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      InputProps={{
                        startAdornment: <CalendarIcon color="primary" sx={{ mr: 1 }} />, 
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Motorista</InputLabel>
                <Select
                  value={selectedDriver}
                  onChange={handleDriverChange}
                  label="Motorista"
                  startAdornment={<PersonIcon color="primary" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">Todos os Motoristas</MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver._id} value={driver._id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ borderRadius: 3, minWidth: 120, boxShadow: 2 }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FilterIcon />}
                  onClick={fetchOvertimeData}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ borderRadius: 3, minWidth: 120, borderWidth: 2, fontWeight: 600, '&:hover': { borderWidth: 2 } }}
                  startIcon={<ClearIcon />}
                  onClick={handleReset}
                  disabled={loading}
                  fullWidth
                >
                  Limpar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Zoom in={true}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 3,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' },
              mb: { xs: 2, md: 0 }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TimeIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Horas Extras
                    </Typography>
                    <Typography variant="h4">
                      {summary.totalOvertime.toFixed(2)}h
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 3,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' },
              mb: { xs: 2, md: 0 }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TimerIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Média de Horas Extras
                    </Typography>
                    <Typography variant="h4">
                      {summary.averageOvertime.toFixed(2)}h
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 3,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' },
              mb: { xs: 2, md: 0 }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Motoristas com Horas Extras
                    </Typography>
                    <Typography variant="h4">
                      {summary.driverCount}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      <Card sx={{ boxShadow: 3, borderRadius: 2, overflowX: 'auto' }}>
        <CardContent sx={{ p: { xs: 0, sm: 2 } }}>
          <TableContainer sx={{ minWidth: 320 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Motorista</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Horas Extras</TableCell>
                  <TableCell>Total de Horas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : overtimeData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="textSecondary">
                        Nenhum registro encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  overtimeData.map((record) => (
                    <TableRow key={record._id} hover>
                      <TableCell>{record.driver.name}</TableCell>
                      <TableCell>
                        {format(new Date(record.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          color={record.overtimeHours > 0 ? 'success.main' : 'text.primary'}
                          fontWeight="medium"
                        >
                          {record.overtimeHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {record.totalHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OvertimeReport; 