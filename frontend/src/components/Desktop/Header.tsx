import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSessionSnapshot, subscribeToSession } from '../../services';
import { FavoritesNavIcon, FriendsNavIcon, HeaderUserIcon, ProfileNavIcon, SearchNavIcon } from '../Icons/HeaderIcons';

const navPalette = {
    activeText: 'var(--color-brand)',
    inactiveText: 'var(--color-brand-fade)',
    activeSurface: 'var(--color-brand-surface)',
    idleSurface: 'var(--color-surface-base)',
};

type HeaderNavItemProps = {
    to: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconClassName: string;
    isActive: boolean;
};

function HeaderNavItem({ to, label, icon: Icon, iconClassName, isActive }: HeaderNavItemProps) {
    const iconColorClass = isActive ? 'text-brand' : 'text-brand/30';

    return (
        <Link
            to={to}
            className="mt-[24px] flex flex-col items-center gap-[8px] text-[12px] font-[400] transition-colors duration-300"
        >
            <motion.div
                className="flex h-[70px] w-[75.6px] flex-col items-center justify-center gap-[8px] rounded-[12px]"
                animate={{ backgroundColor: isActive ? navPalette.activeSurface : navPalette.idleSurface }}
            >
                <motion.div
                    key={`${to}-${isActive ? 'active' : 'inactive'}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex items-center justify-center"
                >
                    <Icon className={`${iconClassName} shrink-0 ${iconColorClass}`} />
                </motion.div>
                <motion.span
                    animate={{ color: isActive ? navPalette.activeText : navPalette.inactiveText }}
                    transition={{ duration: 0.3 }}
                    className="w-full truncate text-center text-[12px] font-[400]"
                    title={label}
                >
                    {label}
                </motion.span>
            </motion.div>
        </Link>
    );
}

const Header: React.FC = () => {
    const location = useLocation();
    const [authenticated, setAuthenticated] = React.useState<boolean>(false);
    const [username, setUsername] = React.useState<string>('');

    React.useEffect(() => {
        const syncUserState = () => {
            const { isAuthenticated, user } = getSessionSnapshot();

            if (!isAuthenticated || !user) {
                setUsername('');
                setAuthenticated(false);
                return;
            }

            setUsername(user.username || '');
            setAuthenticated(true);
        };

        syncUserState();
        return subscribeToSession(() => syncUserState());
    }, []);

    return (
        <header className="z-40 flex h-full w-[95px] shrink-0 flex-col items-center justify-between bg-surface-page px-[4px] py-[20px] shadow-app-sm">
            <div className="flex flex-col items-center">
                <Link to="/" aria-label="Home">
                    <div className="flex flex-col items-center gap-[4px]">
                        <img src="/Subtract.svg" alt="" width={40} height={49} className="h-[49px] w-[40px]" />
                        <img src="/mapa.svg" alt="" width={54} height={19} className="h-[19px] w-[54px]" />
                    </div>
                </Link>

                <HeaderNavItem
                    to="/"
                    label="Search"
                    icon={SearchNavIcon}
                    iconClassName="h-[32px] w-[33px]"
                    isActive={location.pathname === '/'}
                />
                <HeaderNavItem
                    to="/friends"
                    label="Friends"
                    icon={FriendsNavIcon}
                    iconClassName="h-[34px] w-[39px]"
                    isActive={location.pathname === '/friends'}
                />
                <HeaderNavItem
                    to="/favorites"
                    label="Favorites"
                    icon={FavoritesNavIcon}
                    iconClassName="h-[32px] w-[32px]"
                    isActive={location.pathname === '/favorites'}
                />
            </div>

            {!authenticated ? (
                <Link to="/login" className="flex flex-col items-center gap-[4px] text-[12px] font-[400] text-brand underline">
                    <HeaderUserIcon className="h-[37px] w-[37px] text-brand-soft" />
                    <span>Log in</span>
                </Link>
            ) : (
                <HeaderNavItem
                    to="/profile"
                    label={username || 'Profile'}
                    icon={ProfileNavIcon}
                    iconClassName="h-[33px] w-[32px]"
                    isActive={location.pathname === '/profile'}
                />
            )}
        </header>
    );
};

export default Header;
