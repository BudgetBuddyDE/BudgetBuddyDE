import { Wrapper } from '@/components/wrapper';
import { CheckCircle2, Circle } from 'lucide-react';
import TaskCard, { type Task } from './task-card';
import React from 'react';

export type BoardColumnProps = { id: string; title: string; icon: React.ReactNode; tasks: Task[] };

export default function KanbanBoard() {
  // Sample data for the Kanban board
  const columns: BoardColumnProps[] = [
    {
      id: 'backlog',
      title: 'Backlog',
      icon: <Circle className="h-4 w-4 text-gray-500" />,
      tasks: [
        {
          id: 1,
          title: 'Design system update',
          description: 'Enhance design system for consistency and usability',
          tags: [
            { id: 1, name: 'Design', color: 'bg-cyan-100 text-cyan-700' },
            { id: 2, name: 'New releases', color: 'bg-orange-100 text-orange-700' },
          ],
          dueDate: 'Jan 25',
          comments: 4,
          progress: { completed: 1, total: 4 },
          priority: 'high',
          assignees: ['/placeholder.svg?height=32&width=32', '/placeholder.svg?height=32&width=32'],
        },
        {
          id: 2,
          title: 'Retention rate by 23%',
          description: 'Improve retention through campaigns and feature updates',
          tags: [
            { id: 3, name: 'Marketing', color: 'bg-cyan-100 text-cyan-700' },
            { id: 4, name: 'Product', color: 'bg-pink-100 text-pink-700' },
          ],
          dueDate: 'Jan 25',
          comments: 4,
          attachments: 33,
          links: 12,
          priority: 'high',
          assignees: ['/placeholder.svg?height=32&width=32', '/placeholder.svg?height=32&width=32'],
        },
        {
          id: 3,
          title: 'KYC Flow',
          description: 'Simplify KYC process for seamless user verification',
          tags: [
            { id: 5, name: 'Product', color: 'bg-pink-100 text-pink-700' },
            { id: 6, name: 'Design', color: 'bg-cyan-100 text-cyan-700' },
          ],
          dueDate: 'Jan 25',
          attachments: 33,
          links: 12,
          progress: { completed: 2, total: 4 },
          priority: 'medium',
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
      ],
    },
    {
      id: 'ready',
      title: 'Ready',
      icon: <CheckCircle2 className="h-4 w-4 text-gray-500" />,
      tasks: [
        {
          id: 4,
          title: 'Icon system',
          description: 'Develop scalable icons for cohesive platform visuals',
          tags: [{ id: 7, name: 'Design', color: 'bg-cyan-100 text-cyan-700' }],
          dueDate: 'Jan 25',
          comments: 4,
          progress: { completed: 1, total: 4 },
          priority: 'high',
          assignees: ['/placeholder.svg?height=32&width=32', '/placeholder.svg?height=32&width=32'],
        },
        {
          id: 15,
          title: 'Improve Collaboration by 50%',
          description: 'Streamline workflows to boost team collaboration significantly',
          tags: [],
          dueDate: 'Jan 25',
          links: 12,
          priority: 'medium',
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
        {
          id: 16,
          priority: 'low',
          title: 'Search features',
          description: 'Upgrade search for faster, accurate user results',
          tags: [{ id: 8, name: 'Product', color: 'bg-pink-100 text-pink-700' }],
          dueDate: 'Jan 25',
          links: 12,
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
        {
          id: 17,
          priority: 'low',
          title: 'Checkout flow design',
          description: 'Optimize checkout process to improve conversion rates',
          tags: [{ id: 9, name: 'Design', color: 'bg-cyan-100 text-cyan-700' }],
          dueDate: 'Jan 25',
          links: 12,
          progress: { completed: 2, total: 4 },
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
        {
          id: 5,
          title: 'Improve Collaboration by 50%',
          description: 'Streamline workflows to boost team collaboration significantly',
          tags: [],
          dueDate: 'Jan 25',
          links: 12,
          priority: 'medium',
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
        {
          id: 19,
          priority: 'low',
          title: 'Search features',
          description: 'Upgrade search for faster, accurate user results',
          tags: [{ id: 8, name: 'Product', color: 'bg-pink-100 text-pink-700' }],
          dueDate: 'Jan 25',
          links: 12,
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
        {
          id: 6,
          priority: 'low',
          title: 'Search features',
          description: 'Upgrade search for faster, accurate user results',
          tags: [{ id: 8, name: 'Product', color: 'bg-pink-100 text-pink-700' }],
          dueDate: 'Jan 25',
          links: 12,
          assignees: ['/placeholder.svg?height=32&width=32'],
          iteration: { start: new Date(), end: new Date() },
        },
        {
          id: 7,
          priority: 'low',
          title: 'Checkout flow design',
          description: 'Optimize checkout process to improve conversion rates',
          tags: [{ id: 9, name: 'Design', color: 'bg-cyan-100 text-cyan-700' }],
          dueDate: 'Jan 25',
          links: 12,
          progress: { completed: 2, total: 4 },
          assignees: ['/placeholder.svg?height=32&width=32'],
        },
      ],
    },
    {
      id: 'in_progress',
      title: 'In progress',
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      tasks: [],
    },
    {
      id: 'on_hold',
      title: 'On hold',
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      tasks: [],
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      tasks: [],
    },
  ];

  return (
    <div className="flex flex-col">
      <Wrapper>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full">
            {columns.map((props) => (
              <BoardColumn key={props.id} {...props} />
            ))}
          </div>
        </div>
      </Wrapper>
    </div>
  );
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ icon, title, tasks }) => {
  return (
    <div className="flex-shrink-0 w-[350px]">
      <div className="rounded-lg border h-full max-h-[800px] sm:max-h-[600px] xs:max-h-[400px]  flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
};
