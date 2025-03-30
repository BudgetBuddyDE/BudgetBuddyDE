import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/cn';

export enum TicketStatus {
  BACKLOG = 'b',
  WIP = 'wip',
  PAUSED = 'p',
  DONE = 'done',
}

export type KanbanCardProps = {
  title: string;
  status: TicketStatus;
  developer: { avatarUrl: string; username: string };
  startedAt: Date;
  endedAt: Date;
  estimate: number;
};

export const Card: React.FC<KanbanCardProps> = ({
  title,
  status,
  developer,
  startedAt,
  endedAt,
  estimate,
}) => {
  const DATE_FORMAT = 'MMM dd, yyyy';
  return (
    <div className="p-2 rounded shadow-sm border-gray-100 border-2">
      <h3 className="text-sm mb-3 text-gray-700">{title}</h3>
      <p className="bg-yellow-100 text-xs w-max p-1 rounded mr-2 text-gray-700">{status}</p>
      <div className="flex flex-row items-center mt-2">
        <div className="bg-gray-300 rounded-full w-4 h-4 mr-3"></div>
        <a href="#" className="text-xs text-gray-500">
          {developer.username}
        </a>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {format(startedAt, DATE_FORMAT)} &#10141; {format(endedAt, DATE_FORMAT)}
      </p>
      <p className="text-xs text-gray-500 mt-2">{estimate}</p>
    </div>
  );
};

export const KanbanWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-1 bg-red-800">
      {/* grid lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-2 gap-5 */}
      <div className="w-full grid lg:grid-cols-4 md:grid-cols-4 sm:grid-cols-1 gap-5">
        {children}
      </div>
    </div>
  );
};

export const KanbanColumn: React.FC<{ title: string; color: string; items: KanbanCardProps[] }> = ({
  title,
  color,
  items,
}) => {
  return (
    <div className="bg-orange-100 overflow-y-scroll rounded px-2 py-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-center mb-2 mx-1">
        <div className="flex items-center">
          <h2 className={cn('text-sm w-max px-1 rounded mr-2 text-gray-700', color)}>{title}</h2>
          <p className="text-gray-400 text-sm">{items.length}</p>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-rows-2 gap-2">
        {items.map((props) => (
          <Card key={title + props.title.replaceAll(' ', '_').toLowerCase()} {...props} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-row items-center text-gray-300 mt-2 px-1">
        <p className="rounded mr-2 text-2xl">+</p>
        <p className="pt-1 rounded text-sm">New</p>
      </div>
    </div>
  );
};

export default function KanbanPage() {
  return (
    <div className="flex w-2/3 flex-1 mx-auto px-5 bg-gray-100">
      <KanbanWrapper>
        {/* Backlog */}
        <KanbanColumn
          title="Backlog"
          color="bg-red-100"
          items={[
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Review survey results DDD',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Research video marketing',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 3,
            },
          ]}
        />

        <KanbanColumn
          title="In Progress"
          color="bg-orange-100"
          items={[
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Review survey results DDD',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Research video marketing',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 3,
            },
          ]}
        />

        <KanbanColumn
          title="Done"
          color="bg-green-100"
          items={[
            {
              title: 'Social media',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 2,
            },
            {
              title: 'Research video marketing',
              status: TicketStatus.BACKLOG,
              developer: { avatarUrl: '', username: 'Sophie Worso' },
              startedAt: new Date(),
              endedAt: new Date(),
              estimate: 3,
            },
          ]}
        />
      </KanbanWrapper>
    </div>
  );
}
