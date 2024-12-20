import {ApiResponse, HTTPStatusCode} from '@budgetbuddyde/types';
import {ZTriggerMonthlyReportPayload, ZTriggerWeeklyReportPayload} from '@budgetbuddyde/types/lib/Mail.types';
import {subDays} from 'date-fns';
import 'dotenv/config';
import {Router} from 'express';

import {sendDailyStockReport} from '../core/sendDailyStockReport';
import {sendMonthlyReports} from '../core/sendMonthlyReports';
import {sendWeeklyReports} from '../core/sendWeeklyReports';
import {logger} from '../logger';
import {NEWSLETTER} from '../server';

const router = Router();

router.post('/daily-stock-report', async (req, res) => {
  const [_, error] = await sendDailyStockReport(NEWSLETTER.DAILY_STOCK_REPORT);
  if (error) {
    logger.error('Was not able to send daily stock reports!', error);
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }

  return res.json(ApiResponse.builder().withData({successfull: true}).build());
});

router.post('/weekly-report', async (req, res) => {
  const body = await req.body;
  const parsedBody = ZTriggerWeeklyReportPayload.safeParse(body);
  if (!parsedBody.success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Invalid request body').build());
  }
  const {startDate, endDate} = parsedBody.data;

  if (endDate < startDate || subDays(endDate, 7) > startDate || subDays(endDate, 7) < startDate) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage('Invalid date range provided')
          .withData({startDate, endDate})
          .build(),
      );
  }

  const [_, error] = await sendWeeklyReports(NEWSLETTER.WEEKLY_REPORT, startDate, endDate);
  if (error) {
    logger.error('Was not able to send weekly reports', error);
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }

  return res.json(ApiResponse.builder().withData({startDate, endDate}).build());
});

router.post('/monthly-report', async (req, res) => {
  const body = await req.body;
  const parsedBody = ZTriggerMonthlyReportPayload.safeParse(body);
  if (!parsedBody.success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Invalid request body').build());
  }
  const {month} = parsedBody.data;
  const now = new Date();
  const startDate = new Date(now.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), month.getMonth() + 1, 0);
  const [_, error] = await sendMonthlyReports(NEWSLETTER.MONTHLY_REPORT, month, startDate, endDate);
  if (error) {
    logger.error('Was not able to send monthly reports', error);
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }

  return res.json(ApiResponse.builder().withData({startDate, endDate}).build());
});

export default router;
