import KanbanBoard from "./kanban-board";

export default function TestPage() {
  return (
    <div className="flex flex-1 w-2/3 mx-auto">
      <main className="flex-1 overflow-auto my-4 h-min">
        <KanbanBoard />
      </main>
    </div>
  );
}
