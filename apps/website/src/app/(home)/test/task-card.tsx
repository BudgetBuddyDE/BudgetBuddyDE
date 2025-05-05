import { format } from "date-fns";
import { Badge } from "./badge";
import { Calendar, Circle, Flag, Sparkles } from "lucide-react";

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  tags: Tag[];
  dueDate: string;
  comments?: number;
  attachments?: number;
  links?: number;
  progress?: { completed: number; total: number };
  priority: "low" | "medium" | "high";
  assignees: string[];
  iteration?: { start: Date; end: Date };
}

export interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-cyan-500";
      case "low":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const DATE_FORMAT = "MMM dd, yyyy";

  return (
    <div className="border rounded-lg p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <p className="font-medium text-sm mt-0 mb-0">{task.title}</p>
        </div>
        <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
      </div>

      <p className="text-xs text-gray-600 mb-2">{task.description}</p>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className={`${tag.color} border-transparent text-xs font-normal`}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
        <div className="flex items-center gap-2">
          {task.iteration && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(task.iteration.start, DATE_FORMAT)} &#10141;{" "}
                {format(task.iteration.end, DATE_FORMAT)}
              </span>
            </div>
          )}
          {task.progress && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>
                {task.progress.completed}/{task.progress.total}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
