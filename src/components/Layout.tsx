import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Home,
  Wallet,
  LayoutDashboard,
  TrendingUp,
  Camera,
  Menu,
  X,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";

// --- Components ---

const FabInteraction: React.FC = () => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/expenses')}
      className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 bg-primary text-primary-foreground p-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
    >
      <Camera className="h-6 w-6" />
      <span className="font-medium hidden sm:inline-block">Scan Receipt</span>
    </motion.button>
  );
};

const NavbarItem = ({
  to,
  icon: Icon,
  label,
  hideLabel = false,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  hideLabel?: boolean;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors hover:bg-secondary/50 w-full group",
        isActive && "bg-primary/10"
      )
    }
  >
    {({ isActive }) => (
      <>
        <div className={cn("p-2 rounded-full transition-colors", isActive && "bg-primary/20")}>
          <Icon className={cn("h-6 w-6 stroke-[2.5]", isActive ? "text-primary dark:text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        </div>
        {!hideLabel && (
          <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground")}>
            {label}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const DesktopNavRail: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-24 h-screen fixed left-0 top-0 bg-surface border-r border-border z-50 py-6 items-center justify-between">
      {/* Top: Logo */}
      <div className="flex flex-col items-center gap-4 w-full">
        <NavLink to="/home" className="flex flex-col items-center gap-2 mb-6 group">
          <div className="bg-primary/10 p-2 rounded-xl transition-transform group-hover:rotate-12">
            <img src="/financemate-icon.png" alt="App Logo" className="w-8 h-8 rounded-md" />
          </div>
          <span className="font-display font-bold text-[10px] tracking-wider text-center hidden group-hover:block transition-all text-primary">FinanceMate</span>
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          <NavbarItem
            to="/home"
            icon={Home}
            label="Home"
          />
          <NavbarItem
            to="/expenses"
            icon={Wallet}
            label="Expenses"
          />
          <NavbarItem
            to="/reports"
            icon={TrendingUp}
            label="Reports"
          />

          {(user?.role === "admin" || user?.role === "super_admin") && (
            <NavbarItem
              to="/admin"
              icon={LayoutDashboard}
              label="Admin"
            />
          )}
        </nav>
      </div>

      {/* Bottom: User & Settings */}
      <div className="flex flex-col items-center gap-4 w-full px-2">
        <NotificationBell />
        <ThemeToggle className="hover:bg-secondary/50 p-2 rounded-xl w-10 h-10 flex items-center justify-center transition-colors relative" />
        <NavbarItem
          to="/settings"
          icon={Settings}
          label="Settings"
          hideLabel={true}
        />
        <div className="mt-2">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
};

const MobileTopBar: React.FC = () => {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-16 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/financemate-icon.png" alt="Logo" className="w-8 h-8 rounded-lg" />
        <span className="font-display font-bold text-lg">FinanceMate</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle className="hover:bg-secondary/50 p-2 rounded-xl transition-colors" />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const activeClass = "text-primary bg-primary/10";
  const inactiveClass = "text-muted-foreground";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-border h-20 z-40 px-4 pb-4 pt-2 flex items-center justify-around safe-area-inset-bottom shadow-lg rounded-t-3xl">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl w-16 transition-all",
            isActive ? activeClass : inactiveClass
          )
        }
      >
        <div className={cn("p-1 rounded-full", location.pathname === "/home" && "bg-primary/20")}>
          <Home className="h-6 w-6" />
        </div>
        <span className="text-xs font-medium">Home</span>
      </NavLink>

      <NavLink
        to="/expenses"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl w-16 transition-all",
            isActive ? activeClass : inactiveClass
          )
        }
      >
        <div className={cn("p-1 rounded-full", location.pathname === "/expenses" && "bg-primary/20")}>
          <Wallet className="h-6 w-6" />
        </div>
        <span className="text-xs font-medium">Expenses</span>
      </NavLink>

      {/* Spacer for FAB if needed, but FAB is floating above */}

      <NavLink
        to="/reports"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl w-16 transition-all",
            isActive ? activeClass : inactiveClass
          )
        }
      >
        <div className={cn("p-1 rounded-full", location.pathname === "/reports" && "bg-primary/20")}>
          <TrendingUp className="h-6 w-6" />
        </div>
        <span className="text-xs font-medium">Reports</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl w-16 transition-all",
            isActive ? activeClass : inactiveClass
          )
        }
      >
        <div className={cn("p-1 rounded-full", location.pathname === "/settings" && "bg-primary/20")}>
          <Settings className="h-6 w-6" />
        </div>
        <span className="text-xs font-medium">Settings</span>
      </NavLink>
    </nav>
  );
};

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans transition-colors duration-300">
      {/* Desktop Navigation Rail */}
      <DesktopNavRail />

      {/* Mobile Header */}
      <MobileTopBar />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col md:pl-24 w-full max-w-[1600px] mx-auto min-h-screen relative">
        {/* Page Content */}
        <div className="flex-grow w-full pb-24 md:pb-8 px-0 sm:px-4 md:px-8 py-4 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button */}
      <FabInteraction />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
