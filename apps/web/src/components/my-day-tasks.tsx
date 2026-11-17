import type { Task } from "@repo/db/shared";
import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";

interface MyDayTasksProps {
  tasks: readonly Task[];
  /** The viewer's local date, YYYY-MM-DD. Tasks due before it are overdue. */
  today: string;
}

export default function MyDayTasks({ tasks, today }: MyDayTasksProps) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No tasks due.</p>;
  }
  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {tasks.map((task) => (
        <li className="border-border border-t pt-4" key={task.id}>
          <Link className="block no-underline" to="/tasks">
            <p className="m-0 flex items-center gap-2 text-foreground">
              {task.title}
              {task.dueOn !== null && task.dueOn < today ? (
                <Badge variant="destructive">Overdue</Badge>
              ) : null}
            </p>
            <p className="m-0 text-muted-foreground text-xs">
              Due {task.dueOn}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
