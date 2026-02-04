import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Select,
    MenuItem,
    Menu,
    IconButton,
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Person as UserIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import type { User } from 'firebase/auth';

interface HeaderProps {
    user: User | null | undefined;
    handleLogin: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
        </Box>
    );
};

interface SettingsMenuProps {
    user: User | null | undefined;
    handleLogout: () => void;
    currentTheme: string;
    setCurrentTheme: (theme: string) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
    user,
    handleLogout,
    currentTheme,
    setCurrentTheme,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    if (!user) return null;

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{
                    color: 'var(--text-muted)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    borderRadius: 'var(--border-radius)',
                    width: 32,
                    height: 32
                }}
            >
                <SettingsIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius)',
                        minWidth: 220,
                        mt: 1,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        '& .MuiList-root': { p: 0 }
                    }
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, bgcolor: 'rgba(37, 99, 235, 0.1)', borderRadius: 'var(--border-radius)', display: 'flex' }}>
                            <UserIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.displayName || 'User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.email}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 700, mb: 1, display: 'block' }}>APPEARANCE</Typography>
                    <Select
                        value={currentTheme}
                        onChange={(e) => { setCurrentTheme(e.target.value); handleClose(); }}
                        size="small"
                        fullWidth
                        sx={{ height: 32, fontSize: '13px', bgcolor: 'rgba(0,0,0,0.1)' }}
                    >
                        <MenuItem value="default">Slate</MenuItem>
                        <MenuItem value="midnight">Midnight</MenuItem>
                        <MenuItem value="emerald">Emerald</MenuItem>
                        <MenuItem value="rose">Rose</MenuItem>
                    </Select>
                </Box>

                <Box sx={{ borderTop: '1px solid var(--border-color)' }}>
                    <MenuItem onClick={() => { handleLogout(); handleClose(); }} sx={{ py: 1.5, color: '#ef4444' }}>
                        <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Logout</Typography>
                    </MenuItem>
                </Box>
            </Menu>
        </>
    );
};
