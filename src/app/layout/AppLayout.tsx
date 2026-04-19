import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Chip,
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
import { useQuery } from '@tanstack/react-query';
import { getChangelogSnapshot } from '../../shared/api/changelog';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Search', to: '/search' },
  { label: 'Favorites', to: '/favorites' },
  { label: 'History', to: '/history' },
  { label: 'Changelog', to: '/changelog' },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const changelogQuery = useQuery({ queryKey: ['changelogSnapshot'], queryFn: getChangelogSnapshot });

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/search')) return '/search';
    if (location.pathname.startsWith('/favorites')) return '/favorites';
    if (location.pathname.startsWith('/history')) return '/history';
    if (location.pathname.startsWith('/changelog')) return '/changelog';
    return '/';
  }, [location.pathname]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(14px)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
              <Typography
                component={RouterLink}
                to="/"
                variant="h6"
                sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 800 }}
              >
                AV Player
              </Typography>
              {changelogQuery.data ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <Chip component={RouterLink} clickable to="/changelog" label={`v${changelogQuery.data.version}`} size="small" color="primary" sx={{ textDecoration: 'none' }} />
                  <Typography variant="caption" color="text.secondary">
                    {changelogQuery.data.shortCommit} · {new Date(changelogQuery.data.generatedAt).toLocaleDateString('ru-RU')}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>

            <Stack
              component="nav"
              aria-label="Основная навигация"
              direction="row"
              spacing={1.5}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {navItems.map((item) => {
                const isActive = activePath === item.to;
                return (
                  <Typography
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      textDecoration: 'none',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                );
              })}
            </Stack>

            <IconButton
              color="inherit"
              aria-label="Открыть меню"
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }} role="presentation">
          <List component="nav" aria-label="Мобильное меню">
            {navItems.map((item) => {
              const isActive = activePath === item.to;
              return (
                <ListItemButton
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Outlet />
    </Box>
  );
}
