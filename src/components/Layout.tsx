import React, { useState, useRef, useCallback } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Home,
  Wallet,
  LayoutDashboard,
  TrendingUp,
  Camera,
  Lightbulb,
  X,
  Loader
} from "lucide-react";
import Webcam from "react-webcam";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { useExpenseCreation } from "@/hooks/useExpenseCreation";
import { AddExpenseMenu } from "./AddExpenseMenu";
import { ReviewExpenseDialog } from "./ReviewExpenseDialog";
import { ReceiptReviewDialog } from "./ReceiptReviewDialog";
import { ExpenseData } from "@/lib/expense-service";
import { Toaster, toast } from "sonner"; // Ensure Toaster is present if not already in App

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment",
};

// --- Components ---

interface FabInteractionProps {
  onScan: () => void;
  onUploadImage: (file: File) => void;
  onAudioComplete: (blob: Blob) => void;
  onManualEntry: () => void;
  isProcessing: boolean;
}

const FabInteraction: React.FC<FabInteractionProps> = ({
  onScan,
  onUploadImage,
  onAudioComplete,
  onManualEntry,
  isProcessing
}) => {
  return (
    <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50">
      <AddExpenseMenu
        onScan={onScan}
        onUploadImage={onUploadImage}
        onAudioComplete={onAudioComplete}
        onManualEntry={onManualEntry}
        isProcessing={isProcessing}
        trigger={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            <Camera className="h-6 w-6" />
            <span className="font-medium hidden sm:inline-block">Scan Receipt</span>
          </motion.button>
        }
      />
    </div>
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create expense state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [audioReceipts, setAudioReceipts] = useState<ExpenseData[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const {
    isProcessing,
    isSaving,
    extractedData,
    setExtractedData,
    originalData,
    setError,
    handleImageProcessing,
    handleAudioProcessing,
    handleManualEntry,
    handleSave,
  } = useExpenseCreation();

  const onSaveSuccess = async () => {
    const success = await handleSave();
    if (success) {
      if (window.location.pathname !== "/expenses") {
        navigate("/expenses", { state: { refresh: Date.now() } });
      } else {
        // Force refresh by passing new state
        navigate("/expenses", { state: { refresh: Date.now() } });
      }
    }
  };

  const handleAudioComplete = async (blob: Blob) => {
    const results = await handleAudioProcessing(blob);
    if (results && results.length > 0) {
      setAudioReceipts(results);
      setIsReviewDialogOpen(true);
    }
  };

  const handleReviewSaveComplete = () => {
    navigate("/expenses", { state: { refresh: Date.now() } });
  };

  const capture = useCallback(async () => {
    if (webcamRef.current && !isProcessing) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsCameraOpen(false);
        handleImageProcessing(imageSrc);
      }
    }
  }, [webcamRef, isProcessing, handleImageProcessing]);

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      if (base64Image) {
        handleImageProcessing(base64Image);
      }
    };
    reader.onerror = () => {
      toast.error("Upload Error", {
        description: "Failed to read the image file.",
      });
    };
    reader.readAsDataURL(file);
  }

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
      <FabInteraction
        onScan={() => {
          if (isMobile) {
            // For mobile, we might want to trigger a file input with capture="environment"
            // But existing behavior in HomePage maps 'Scan' to setIsCameraOpen for desktop, 
            // and for mobile HomePage used file input. AddExpenseMenu handles this?
            // AddExpenseMenu calls `onScan`.
            // If we want consistent behavior:
            if (isMobile) {
              fileInputRef.current?.click();
            } else {
              setIsCameraOpen(true);
            }
          } else {
            setIsCameraOpen(true);
          }
        }}
        onUploadImage={handleUploadImage}
        onAudioComplete={handleAudioComplete}
        onManualEntry={handleManualEntry}
        isProcessing={isProcessing}
      />

      {/* Hidden input for mobile camera capture if needed, mirroring HomePage logic */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadImage(file);
          e.target.value = "";
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Dialogs/Modals for Expense Creation */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-4xl">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="rounded-lg shadow-2xl w-full"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg text-sm flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                <span>
                  For best results: ensure good lighting and place the receipt
                  on a flat, contrasting surface.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Button
                onClick={capture}
                disabled={isProcessing}
                className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 ring-4 ring-white ring-offset-4 ring-offset-black/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader className="h-10 w-10 text-black animate-spin" />
                ) : (
                  <Camera className="h-10 w-10 text-black" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => !isProcessing && setIsCameraOpen(false)}
                disabled={isProcessing}
                className="absolute top-6 right-6 text-white hover:bg-white/20 w-12 h-12 rounded-full disabled:opacity-50"
              >
                <X className="h-8 w-8" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ReviewExpenseDialog
        isMobile={isMobile}
        isProcessing={isProcessing}
        isSaving={isSaving}
        extractedData={extractedData}
        setExtractedData={setExtractedData}
        handleSave={onSaveSuccess}
        originalData={originalData}
      />
      <ReceiptReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        receipts={audioReceipts}
        onSaveComplete={handleReviewSaveComplete}
      />
    </div>
  );
};
