import {type LogClient} from '@budgetbuddyde/utils';
import cron, {ScheduledTask} from 'node-cron';

import {logger} from '../../core/logger';

type JobStatus = 'scheduled' | 'running' | 'stopped' | 'finished' | 'failed';

export interface JobPlannerContext {
  logger: LogClient;
  jobName: string;
  jobId: string;
  [key: string]: any;
}

interface JobDefinition {
  id: string;
  name: string;
  cronTime: string;
  status: JobStatus;
  task: ScheduledTask;
  handler: (ctx: JobPlannerContext) => Promise<void> | void;
  context: JobPlannerContext;
}

export class JobPlanner {
  private jobs: Map<string, JobDefinition> = new Map();
  private logger: LogClient;
  private timezone: string;

  constructor(timezone: string, logClient?: LogClient) {
    this.timezone = timezone;
    this.logger = logClient || logger.child({scope: JobPlanner.name});
  }

  addJob(name: string, cronTime: string, handler: (ctx: JobPlannerContext) => Promise<void> | void): string {
    if (this.jobs.has(name)) {
      throw new Error(`Job with name '${name}' already exists.`);
    }

    if (!cron.validate(cronTime)) {
      throw new Error(`Invalid cron time format: '${cronTime}'`);
    }
    const id = `${name}-${Date.now()}`;
    const context: JobPlannerContext = {
      logger: this.logger,
      jobName: name,
      jobId: id,
    };

    const task: ScheduledTask = cron.schedule(
      cronTime,
      async () => {
        job.status = 'running';
        this.logger.info('Job "%s" started.', name);
        try {
          await handler(context);
          job.status = 'finished';
          this.logger.info('Job "%s" finished.', name);
        } catch (e: any) {
          job.status = 'failed';
          this.logger.error('Job "%s" failed: %s', name, e.message);
        }
      },
      {name: name, timezone: this.timezone},
    );

    task.on('task:started', () => {
      this.logger.debug('Task "%s" has started.', name);
    });

    task.on('task:stopped', () => {
      this.logger.debug('Task "%s" has stopped.', name);
    });

    task.on('task:destroyed', () => {
      this.logger.debug('Task "%s" has been destroyed.', name);
    });

    const job: JobDefinition = {
      id,
      name,
      cronTime,
      status: 'scheduled',
      handler,
      context,
      task: task,
    };
    this.jobs.set(name, job);
    this.logger.info('Job "%s" with ID "%s" scheduled with cron time "%s".', name, id, cronTime);
    return id;
  }

  getAllJobs(): JobDefinition[] {
    return Array.from(this.jobs.values());
  }

  getJob(name: string): JobDefinition | undefined {
    let job: JobDefinition | undefined = this.jobs.get(name);
    if (!job) {
      job = Array.from(this.jobs.values()).find(j => j.id === name);
    }
    return job;
  }

  async runJob(identifier: string): Promise<void> {
    let job: JobDefinition | undefined = this.jobs.get(identifier);
    if (!job) {
      job = Array.from(this.jobs.values()).find(j => j.id === identifier);
    }
    if (!job) throw new Error(`No job found for "${identifier}"`);

    job.status = 'running';
    this.logger.info('Job "%s" triggered manually.', job.name);
    try {
      await job.handler(job.context);
      job.status = 'finished';
      this.logger.info('Job "%s" finished.', job.name);
    } catch (e: any) {
      job.status = 'failed';
      this.logger.error('Job "%s" failed: %s', job.name, e.message);
    }
  }

  getJobStatus(): Record<string, JobStatus> {
    const result: Record<string, JobStatus> = {};
    for (const [name, job] of this.jobs.entries()) {
      result[name] = job.status;
    }
    return result;
  }

  removeJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (!job) return false;
    job.task.stop();
    this.jobs.delete(name);
    this.logger.info('Job "%s" removed.', name);
    return true;
  }
}
