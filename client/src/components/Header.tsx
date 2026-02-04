import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Chip,
    Button,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Google as GoogleIcon,
    Logout as LogoutIcon,
    Person as UserIcon,
} from '@mui/icons-material';
import type { User } from 'firebase/auth';

interface HeaderProps {
    user: User | null | undefined;
    handleLogin: () => void;
    handleLogout: () => void;
    currentTheme: string;
    setCurrentTheme: (theme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
    user,
    handleLogin,
    handleLogout,
    currentTheme,
    setCurrentTheme,
}) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            {user ? (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip icon={<UserIcon />} label={user.displayName || user.email} variant="outlined" sx={{ borderRadius: 'var(--border-radius)', px: 1.5, background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                    <Button variant="text" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ color: 'var(--text-muted)' }}>Logout</Button>
                </Stack>
            ) : (
                <Button variant="contained" startIcon={<GoogleIcon />} onClick={handleLogin} sx={{ borderRadius: 'var(--border-radius)' }}>Login with Google</Button>
            )}
            <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>THEME</Typography>
                <Select value={currentTheme} onChange={(e) => setCurrentTheme(e.target.value)} size="small" sx={{ width: 120, height: 32 }}>
                    <MenuItem value="default">Slate</MenuItem>
                    <MenuItem value="midnight">Midnight</MenuItem>
                    <MenuItem value="emerald">Emerald</MenuItem>
                    <MenuItem value="rose">Rose</MenuItem>
                </Select>
            </Stack>
        </Box>
    );
};
