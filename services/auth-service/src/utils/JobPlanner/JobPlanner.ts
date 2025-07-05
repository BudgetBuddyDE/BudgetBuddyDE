import {type LoggerClient} from '@budgetbuddyde/utils';
import cron, {ScheduledTask} from 'node-cron';

import {logger} from '../../core/logger';

type JobStatus = 'scheduled' | 'running' | 'stopped' | 'finished' | 'failed';

export interface JobPlannerContext {
  logger: LoggerClient;
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
  private logger: LoggerClient;
  private timezone: string;

  constructor(timezone: string, logClient?: LoggerClient) {
    this.timezone = timezone;
    this.logger = logClient || logger.child({label: JobPlanner.name});
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
        this.logger.info(`Job "${name}" started.`);
        try {
          await handler(context);
          job.status = 'finished';
          this.logger.info(`Job "${name}" finished.`);
        } catch (e: any) {
          job.status = 'failed';
          this.logger.error(`Job "${name}" failed: ${e.message}`);
        }
      },
      {name: name, timezone: this.timezone},
    );

    task.on('task:started', () => {
      this.logger.debug(`Task "${name}" has started.`);
    });

    task.on('task:stopped', () => {
      this.logger.debug(`Task "${name}" has stopped.`);
    });

    task.on('task:destroyed', () => {
      this.logger.debug(`Task "${name}" has been destroyed.`);
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
    this.logger.info(`Job "${name}" scheduled with id "${id}".`);
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
    this.logger.info(`Job "${job.name}" triggered manually.`);
    try {
      await job.handler(job.context);
      job.status = 'finished';
      this.logger.info(`Job "${job.name}" finished.`);
    } catch (e: any) {
      job.status = 'failed';
      this.logger.error(`Job "${job.name}" failed: ${e.message}`);
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
    this.logger.info(`Job "${name}" removed.`);
    return true;
  }
}
