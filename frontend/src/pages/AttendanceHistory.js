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
  Chip,
  IconButton,
  Stack,
  Divider,
  Tooltip,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  EventNote as EventNoteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { attendanceService, driverService } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import { toast } from 'react-toastify';
import LocationMap from '../components/LocationMap';

const AttendanceHistory = () => {
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === 'admin';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [selectedDriver, setSelectedDriver] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [summary, setSummary] = useState({
    totalDays: 0,
    averageHours: 0,
    totalOvertime: 0,
  });
  const [locationData, setLocationData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (isAdmin) {
        response = await attendanceService.getAdminRecords(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd'),
          selectedDriver || undefined
        );
      } else {
        response = await attendanceService.getHistory(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
      }
      
      if (!response.data || response.data.length === 0) {
        setError('Nenhum registro de presença encontrado para o período selecionado');
        setAttendanceData([]);
        setSummary({
          totalDays: 0,
          averageHours: 0,
          totalOvertime: 0,
        });
        return;
      }

      setAttendanceData(response.data);

      // Calculate summary statistics
      const totalDays = response.data.length;
      const totalHours = response.data.reduce((sum, record) => sum + (record.totalHours || 0), 0);
      const totalOvertime = response.data.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);

      setSummary({
        totalDays,
        averageHours: totalDays > 0 ? totalHours / totalDays : 0,
        totalOvertime,
      });
    } catch (err) {
      console.error('Erro ao buscar dados de presença:', err);
      const errorMessage = err.response?.data?.message || 'Falha ao buscar dados de presença';
      setError(errorMessage);
      toast.error(errorMessage);
      setAttendanceData([]);
      setSummary({
        totalDays: 0,
        averageHours: 0,
        totalOvertime: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDriver, isAdmin]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  useEffect(() => {
    if (isAdmin) {
      fetchDrivers();
    }
  }, [isAdmin]);

  const fetchDrivers = async () => {
    try {
      const response = await driverService.getAll();
      setDrivers(response.data);
    } catch (err) {
      toast.error('Falha ao buscar motoristas');
    }
  };

  const handleDateChange = (date, type) => {
    if (!date) return;
    
    if (type === 'start') {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      setStartDate(start);
    } else {
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      setEndDate(end);
    }
  };

  const handleDriverChange = (event) => {
    setSelectedDriver(event.target.value);
  };

  const handleReset = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    
    setStartDate(sevenDaysAgo);
    setEndDate(today);
    setSelectedDriver('');
  };

  const getStatusChip = (record) => {
    if (record.clockOut) {
      return <Chip label="Concluído" color="success" size="small" />;
    } else if (record.breakStart && !record.breakEnd) {
      return <Chip label="Em Intervalo" color="warning" size="small" />;
    } else {
      return <Chip label="Ativo" color="primary" size="small" />;
    }
  };

  // Prepare location data for the map
  const locationDataForMap = attendanceData.flatMap(record => {
    const locations = [];
    if (record.clockIn) {
      locations.push({
        _id: `${record._id}-in`,
        type: 'clock-in',
        driverName: record.driver?.name || 'Unknown Driver',
        timestamp: record.clockIn,
        latitude: record.clockInLocation?.latitude,
        longitude: record.clockInLocation?.longitude,
        address: record.clockInLocation?.address,
      });
    }
    if (record.clockOut) {
      locations.push({
        _id: `${record._id}-out`,
        type: 'clock-out',
        driverName: record.driver?.name || 'Unknown Driver',
        timestamp: record.clockOut,
        latitude: record.clockOutLocation?.latitude,
        longitude: record.clockOutLocation?.longitude,
        address: record.clockOutLocation?.address,
      });
    }
    return locations;
  }).filter(loc => loc.latitude && loc.longitude);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await attendanceService.getRecords(
        startDate.toISOString(),
        endDate.toISOString(),
        selectedDriver
      );

      if (!response.data || response.data.length === 0) {
        setError('Nenhum registro de presença encontrado para o período selecionado');
        setAttendanceData([]);
        setSummary({
          totalDays: 0,
          averageHours: 0,
          totalOvertime: 0,
        });
        return;
      }

      setAttendanceData(response.data);

      // Calculate summary
      const totalDays = response.data.length;
      const totalHours = response.data.reduce(
        (sum, record) => sum + (record.totalHours || 0),
        0
      );
      const totalOvertime = response.data.reduce(
        (sum, record) => sum + (record.overtimeHours || 0),
        0
      );

      setSummary({
        totalDays,
        averageHours: totalHours / totalDays,
        totalOvertime,
      });
    } catch (err) {
      console.error('Erro ao buscar dados de presença:', err);
      const errorMessage = err.response?.data?.message || 'Falha ao buscar dados de presença';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLocation = (location) => {
    setSelectedLocation(location);
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
          <EventNoteIcon fontSize="large" />
          Histórico de Presença
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
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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
            {isAdmin && (
              <Grid item xs={12} sm={3}>
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
            )}
            <Grid item xs={12} sm={3}>
              <Stack direction="row" spacing={2}>
                <Tooltip title="Buscar">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchAttendanceData}
                    startIcon={<FilterIcon />}
                    fullWidth
                  >
                    Buscar
                  </Button>
                </Tooltip>
                <Tooltip title="Limpar Filtros">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleReset}
                    startIcon={<ClearIcon />}
                  >
                    Limpar
                  </Button>
                </Tooltip>
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
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TimeIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Dias
                    </Typography>
                    <Typography variant="h4">
                      {summary.totalDays}
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
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TimerIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Média de Horas
                    </Typography>
                    <Typography variant="h4">
                      {summary.averageHours.toFixed(2)}h
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
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
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
      </Grid>

      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Entrada</TableCell>
                  <TableCell>Saída</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Localização</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : attendanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        Nenhum registro encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceData.map((record) => (
                    <TableRow key={record._id} hover>
                      <TableCell>
                        {record.date ? format(new Date(record.date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {record.clockIn?.time ? format(new Date(record.clockIn.time), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {record.clockOut?.time ? format(new Date(record.clockOut.time), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}
                      </TableCell>
                      <TableCell>{getStatusChip(record)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {record.clockInLocation && (
                            <Tooltip title="Local de Entrada">
                              <IconButton
                                size="small"
                                onClick={() => handleViewLocation(record.clockInLocation)}
                              >
                                <LocationIcon color="primary" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {record.clockOutLocation && (
                            <Tooltip title="Local de Saída">
                              <IconButton
                                size="small"
                                onClick={() => handleViewLocation(record.clockOutLocation)}
                              >
                                <LocationIcon color="secondary" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Location Map Dialog */}
      <Dialog
        open={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationIcon color="primary" />
            <Typography>Localização</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedLocation && (
            <LocationMap
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              height={400}
              accuracy={selectedLocation.accuracy}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLocation(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceHistory; 