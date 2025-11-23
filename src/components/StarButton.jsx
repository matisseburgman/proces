import { useState } from "react";
import { IoStarOutline, IoStar } from "react-icons/io5";

export default function StarButton({ task, onToggleStar }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    onToggleStar(task.id, !task.is_starred);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute -right-10 top-1/2 -translate-y-1/2 p-1 z-10"
      aria-label={task.is_starred ? "Unstar task" : "Star task"}
    >
      {task.is_starred ? (
        <IoStar className="w-5 h-5 text-cosmic-orange hover:drop-shadow-lg"  />
      ) : (
        <IoStarOutline 
          className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-cosmic-orange"
        />
      )}
    </button>
  );
}