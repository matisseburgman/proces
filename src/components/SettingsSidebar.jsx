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
          "fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50",
          "flex flex-col transition-transform duration-300 ease-in-out",
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
          {/* Confetti Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Confetti</h3>
              <p className="text-sm text-muted-foreground">
                Show confetti when completing tasks
              </p>
            </div>
            <button
              onClick={onToggleConfetti}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                confettiEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                  confettiEnabled && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Sound</h3>
              <p className="text-sm text-muted-foreground">
                Play sound when completing tasks
              </p>
            </div>
            <button
              onClick={onToggleSound}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                soundEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                  soundEnabled && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer met Log out button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full px-4 py-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors font-medium"
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

export default SettingsSidebar;