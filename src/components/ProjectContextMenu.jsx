import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoTrashOutline, IoCreateOutline } from "react-icons/io5";

export default function ProjectContextMenu({
  project,
  isOpen,
  onClose,
  position,
  onRename,
  onDelete,
  onColorChange,
}) {
  const menuRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [selectedColor, setSelectedColor] = useState(project.color);

  const colors = [
    { name: "Default", value: "#6B7280" },
    { name: "Gray", value: "#9CA3AF" },
    { name: "Brown", value: "#92400E" },
    { name: "Orange", value: "#EA580C" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Green", value: "#16A34A" },
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

  const handleRename = () => {
    if (editedName.trim() && editedName !== project.name) {
      onRename(project.id, editedName.trim());
    }
    setIsEditingName(false);
    onClose();
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onColorChange(project.id, color);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="bg-background border border-border rounded-md shadow-lg z-[1020] w-[240px] py-2"
    >
      {/* Rename */}
      {isEditingName ? (
        <div className="px-3 py-2">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setIsEditingName(false);
                setEditedName(project.name);
              }
            }}
            onBlur={handleRename}
            autoFocus
            className="w-full bg-transparent border border-border rounded-sm px-2 py-1 text-sm outline-none"
          />
        </div>
      ) : (
        <button
          onClick={() => setIsEditingName(true)}
          className="w-full px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-sm"
        >
          <IoCreateOutline className="w-4 h-4" />
          Rename
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => {
          if (confirm(`Delete "${project.name}" project?`)) {
            onDelete(project.id);
            onClose();
          }
        }}
        className="w-full px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-sm text-red-500"
      >
        <IoTrashOutline className="w-4 h-4" />
        Delete
      </button>

      {/* Divider */}
      <div className="border-t border-border my-2"></div>

      {/* Colors Section */}
      <div className="px-3 py-1">
        <p className="text-xs text-muted-foreground mb-2">Colors</p>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className="w-8 h-8 rounded-md hover:scale-110 transition-transform relative"
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {selectedColor === color.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}