// tag.jsx
import { cn } from "@/lib/utils";

function Tag({ name, color, className, variant = "default" }) { // ← Voeg variant toe
  const getLightColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  const getMediumColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.4)`;
  };

  // ✨ Styling op basis van variant
  const isCompleted = variant === "completed";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
        isCompleted ? "" : "border", // ← Geen border bij completed
        "transition-colors",
        "max-w-full",
        className
      )}
      style={{
        backgroundColor: getLightColor(color),
        borderColor: isCompleted ? "transparent" : getMediumColor(color), // ← Transparante border bij completed
        color: color,
      }}
      title={name}
    >
      <span className="truncate">{name}</span>
    </span>
  );
}

export default Tag;