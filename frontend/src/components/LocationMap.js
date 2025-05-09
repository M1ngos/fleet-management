import React, { useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  useTheme,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationMap = ({ location, onClose }) => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Wait for the container to be available in the DOM
    const initMap = () => {
      const mapContainer = document.getElementById('map');
      if (!mapContainer || mapRef.current) return;

      mapRef.current = L.map('map', {
        center: [location.latitude, location.longitude],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${theme.palette.primary.main};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 0 4px ${alpha(theme.palette.primary.main, 0.3)};
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      markerRef.current = L.marker([location.latitude, location.longitude], {
        icon: customIcon,
      }).addTo(mapRef.current);

      // Add accuracy circle
      L.circle([location.latitude, location.longitude], {
        color: theme.palette.primary.main,
        fillColor: theme.palette.primary.main,
        fillOpacity: 0.1,
        radius: location.accuracy,
      }).addTo(mapRef.current);
    };

    // Use requestAnimationFrame to ensure the container is in the DOM
    requestAnimationFrame(() => {
      initMap();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location, theme]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Location Map
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<MyLocationIcon />}
              label={`Accuracy: ${location.accuracy.toFixed(2)}m`}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiChip-icon': { color: theme.palette.primary.main }
              }}
            />
            <IconButton
              onClick={onClose}
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box
          id="map"
          sx={{
            height: 400,
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LocationMap; 