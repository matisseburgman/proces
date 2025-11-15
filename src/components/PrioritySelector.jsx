import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import Tag from "@/components/ui/tag";

import {
  IoTrashOutline,
  IoCreateOutline
} from "react-icons/io5";

const PrioritySelector = forwardRef(
  ({ task, priorityId, priorities, onUpdate, disabled, onComplete }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Gebruik task.priority_id als die er is, anders priorityId
    const selectedPriorityId = task?.priority_id ?? priorityId;
    const currentPriority = priorities.find((p) => p.id === selectedPriorityId);

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        triggerRef.current?.click();
      }
    }));

    // Herbereken positie bij window resize
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

    // Sluit dropdown bij click buiten het component
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(event.target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const handleOpen = () => {
      if (disabled) return;
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
        setIsOpen(true);
      }
    };
    
const handleSelect = (newPriorityId) => {
  onUpdate(task?.id ?? null, newPriorityId);
  setIsOpen(false);
  
  if (onComplete) {
    onComplete(newPriorityId); // ← Geef de ID mee!
  }
};

    return (
      <>
        {/* Trigger */}
        <div
          ref={triggerRef}
          onClick={handleOpen}
          className="cursor-pointer block min-w-0 w-full py-1"
        >
          {currentPriority ? (
            <Tag name={currentPriority.name} color={currentPriority.color} />
          ) : (
            <span className="text-muted-foreground text-sm truncate">
              &nbsp;
            </span>
          )}
        </div>

        {/* Dropdown menu - rendered as Portal */}
        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
              className="bg-background border border-border rounded-md shadow-lg z-[1010] min-w-[120px] py-1"
            >
              {/* Priorities EERST */}
              {priorities.map((priority) => (
                <div
                  key={priority.id}
                  onClick={() => handleSelect(priority.id)}
                  className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Tag name={priority.name} color={priority.color} />
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-border my-1"></div>

              {/* No priority optie ONDERAAN */}
              <div
                onClick={() => handleSelect(null)}
                className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors text-sm text-muted-foreground"
              >
                No priority
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

PrioritySelector.displayName = "PrioritySelector";

export default PrioritySelector;