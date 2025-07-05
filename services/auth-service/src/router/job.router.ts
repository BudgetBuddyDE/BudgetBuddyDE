import express from 'express';

import {ApiResponse, HTTPStatusCode} from '../models';
import {jobPlanner} from '../server';

export const router = express.Router();

router.get('/', (_req, res) => {
  const jobs = jobPlanner.getAllJobs().map(job => ({
    id: job.id,
    name: job.name,
    cronTime: job.cronTime,
    status: job.status,
  }));

  ApiResponse.expressBuilder(res).withMessage('List of all scheduled jobs').withData(jobs).buildAndSend();
});

router.get('/status', (_req, res) => {
  ApiResponse.expressBuilder(res).withMessage('Status of all jobs').withData(jobPlanner.getJobStatus()).buildAndSend();
});

router.get('/:identifier', (req, res) => {
  const {identifier} = req.params;
  const job = jobPlanner.getJob(identifier);
  if (!job) {
    return ApiResponse.expressBuilder(res)
      .withMessage(`Job "${identifier}" not found`)
      .withStatus(HTTPStatusCode.NOT_FOUND)
      .buildAndSend();
  }
  ApiResponse.expressBuilder(res)
    .withData({
      id: job.id,
      name: job.name,
      cronTime: job.cronTime,
      status: job.status,
      // Provide more details when there is demand for more...
    })
    .buildAndSend();
});

router.post('/:identifier/start', async (req, res) => {
  const {identifier} = req.params;
  try {
    await jobPlanner.runJob(identifier);
    ApiResponse.expressBuilder(res).withMessage(`Job "${identifier}" started successfully`).buildAndSend();
  } catch (err: any) {
    ApiResponse.expressBuilder(res)
      .withMessage(`Error starting job "${identifier}"`)
      .withStatus(HTTPStatusCode.NOT_FOUND)
      .withData({error: err.message})
      .buildAndSend();
  }
});
