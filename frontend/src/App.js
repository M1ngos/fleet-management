import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, CssBaseline, Alert, Box, IconButton } from '@mui/material';
import { Provider } from 'react-redux';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './store';
import { useSelector } from 'react-redux';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import DriverManagement from './pages/DriverManagement';
import OvertimeReport from './pages/OvertimeReport';
import AttendanceHistory from './pages/AttendanceHistory';
import Tasks from './pages/Tasks';

// Auth
import PrivateRoute from './components/PrivateRoute';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const user = useSelector(state => state.auth.user);
  
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return typeof children === 'function' ? children({ user }) : children;
};

const ALERT_HEIGHT = 48;

const AppContent = () => {
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(true);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {/* Alert bar absolutely at the top, above everything */}
      {showAlert && (
        <Alert
          severity="warning"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2000,
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            height: `${ALERT_HEIGHT}px`,
            '& .MuiAlert-icon': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          icon={<CodeIcon sx={{ mr: 0.5 }} />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Box sx={{ flex: 1 }}>
            <strong>Aviso:</strong> Este aplicativo ainda está em desenvolvimento. Alguns recursos podem não estar totalmente funcionais.
          </Box>
        </Alert>
      )}
      {/* Main app content, pushed down if alert is visible */}
      <Box sx={{ mt: showAlert ? `${ALERT_HEIGHT}px` : 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={
                <RoleBasedRoute allowedRoles={['admin', 'driver']}>
                  {({ user }) => (
                    user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/driver-dashboard" replace />
                  )}
                </RoleBasedRoute>
              } />
              <Route path="driver-dashboard" element={
                <RoleBasedRoute allowedRoles={['driver']}>
                  <DriverDashboard />
                </RoleBasedRoute>
              } />
              <Route path="drivers" element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <DriverManagement />
                </RoleBasedRoute>
              } />
              <Route path="overtime" element={
                <RoleBasedRoute allowedRoles={['admin']}>
                  <OvertimeReport />
                </RoleBasedRoute>
              } />
              <Route path="attendance" element={<AttendanceHistory />} />
              <Route path="tasks" element={<Tasks />} />
            </Route>
          </Routes>
        </Router>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme.palette.mode}
        />
      </Box>
    </MUIThemeProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
