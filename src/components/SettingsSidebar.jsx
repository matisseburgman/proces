import { IoClose, IoSettingsOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";

function SettingsSidebar({ 
  isOpen, 
  onClose, 
  supabase,
  confettiEnabled,
  soundEnabled,
  onToggleConfetti,
  onToggleSound
}) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-120 bg-background border-l border-border z-50",
          "flex flex-col transition-transform duration-250 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close settings"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          
        </div>

        {/* Footer met Log out button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full px-4 py-2 text-red-500/80 rounded-md hover:bg-red-500/10 transition-colors font-medium"
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

export default SettingsSidebar;