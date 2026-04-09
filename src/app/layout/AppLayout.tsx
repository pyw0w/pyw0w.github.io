import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Search', to: '/search' },
  { label: 'Favorites', to: '/favorites' },
  { label: 'History', to: '/history' },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/search')) return '/search';
    if (location.pathname.startsWith('/favorites')) return '/favorites';
    if (location.pathname.startsWith('/history')) return '/history';
    return '/';
  }, [location.pathname]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(14px)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 800, flexGrow: 1 }}
            >
              AV Player
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {navItems.map((item) => (
                <Typography
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    color: activePath === item.to ? 'primary.main' : 'text.secondary',
                    textDecoration: 'none',
                    fontWeight: activePath === item.to ? 700 : 500,
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Stack>

            <IconButton color="inherit" sx={{ display: { xs: 'inline-flex', md: 'none' } }} onClick={() => setOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }} role="presentation">
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                selected={activePath === item.to}
                onClick={() => setOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Outlet />
    </Box>
  );
}
