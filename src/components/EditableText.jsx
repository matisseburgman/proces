import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

function EditableText({ value, onSave, placeholder = "", disabled = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  const handleSave = useCallback(() => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    // Als editValue leeg is, herstel oude value
    if (!editValue.trim()) {
      setEditValue(value || "");
      setIsEditing(false);
      return;
    }

    // Alleen saven als er een verschil is
    if (editValue !== value) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setEditValue(value || "");
        setIsEditing(false);
      }
      // Tab key saves and allows natural tab navigation
      if (e.key === "Tab" && !e.shiftKey) {
        handleSave();
      }
    },
    [handleSave, value]
  );

  // Update editValue wanneer value van buitenaf verandert
  // Alleen updaten als we niet aan het editten zijn en value is veranderd
  useEffect(() => {
    if (!isEditing && editValue !== value) {
      setEditValue(value || "");
    }
  }, [value, isEditing, editValue]);

  // Focus input wanneer editing start
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Zet cursor aan het einde van de tekst
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleBlur = useCallback(() => {
    // Use setTimeout to allow other events (like button clicks) to process first
    blurTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 150);
  }, [handleSave]);

  const handleFocus = useCallback(() => {
    // Clear blur timeout if user refocuses quickly
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const handleStartEditing = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
    }
  }, [disabled]);

  const handleDisplayKeyDown = useCallback(
    (e) => {
      if (!disabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setIsEditing(true);
      }
    },
    [disabled]
  );

  // Sluit bij click buiten
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        // Check if clicking on a button or interactive element
        const target = event.target;
        const isInteractiveElement =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest("[role='button']");

        // Delay save slightly to allow button clicks to process first
        if (isInteractiveElement) {
          blurTimeoutRef.current = setTimeout(() => {
            handleSave();
          }, 100);
        } else {
          handleSave();
        }
      }
    }
    if (isEditing) {
      // Use a slight delay to allow other events to process
      document.addEventListener("mousedown", handleClickOutside, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [isEditing, handleSave]);

  if (isEditing && !disabled) {
    return (
      <div ref={containerRef} className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          aria-label={placeholder || "Editable text"}
          className={cn(
            "w-full bg-transparent border-none outline-none",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-0",
            "p-0 m-0"
          )}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleStartEditing}
      onDoubleClick={handleStartEditing}
      className={cn(
        "truncate  transition-opacity",
        disabled ? "cursor-default" : "cursor-text"
      )}
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      aria-label={disabled ? undefined : "Click or double-click to edit"}
      onKeyDown={handleDisplayKeyDown}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </div>
  );
}

export default EditableText;
