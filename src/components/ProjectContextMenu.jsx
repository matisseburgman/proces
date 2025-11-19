import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoTrashOutline } from "react-icons/io5";

export default function ProjectContextMenu({
  project,
  isOpen,
  onClose,
  position,
  onDelete,
  onColorChange,
}) {
  const menuRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(project.color);

  const colors = [
    { name: "Gray", value: "#6B7280" },
    { name: "Brown", value: "#92400E" },
    { name: "Orange", value: "#EA580C" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Green", value: "#16A34A" },
    { name: "Teal", value: "#0D9488" },
    { name: "Blue", value: "#2563EB" },
    { name: "Purple", value: "#9333EA" },
    { name: "Pink", value: "#DB2777" },
    { name: "Red", value: "#DC2626" },
  ];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

    // Herbereken positie bij resize/scroll
    useEffect(() => {
      function handleResize() {
        if (isOpen && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
          });
        }
      }

      if (isOpen) {
        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleResize);
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize);
      };
    }, [isOpen]);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onColorChange(project.id, color);
  };
  

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      data-context-menu="true" 
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="bg-background border border-border rounded-lg shadow-xl z-[1020] w-[200px] py-1.5 overflow-hidden"
    >
      {/* Colors Section */}
      <div className="px-2 py-2">
        <div className="grid grid-cols-5 gap-1.5">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className="w-7 h-7 rounded-md transition-all relative hover:ring-2 hover:ring-border hover:ring-offset-1"
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {selectedColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white drop-shadow"
                    fill="none"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-1"></div>

      {/* Delete */}
      <button
        onClick={() => {
          if (confirm(`Delete "${project.name}"?`)) {
            onDelete(project.id);
            onClose();
          }
        }}
        className="w-full px-3 py-1.5 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
      >
        <IoTrashOutline className="w-4 h-4" />
        Delete
      </button>
    </div>,
    document.body
  );
}