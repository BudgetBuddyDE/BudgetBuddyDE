import {Grid} from '@mui/material';
import React from 'react';
import {Formatter} from '@/utils/Formatter';

export default async function InsightsView() {
  return (
    <React.Fragment>

      <Grid size={{xs: 12, md: 7}}>
        <strong>General overview of your current months income, expenses and balance grouped by category. (table view)</strong>

        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Category</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Jan. 2026</td>
              <td>Groceries</td>
              <td>{Formatter.currency.formatBalance(34.53)}</td>
              <td>{Formatter.currency.formatBalance(0)}</td>
              <td>{Formatter.currency.formatBalance(-34.53)}</td>
            </tr>
            <tr>
              <td>Jan. 2026</td>
              <td>Rent</td>
              <td>{Formatter.currency.formatBalance(34.53)}</td>
              <td>{Formatter.currency.formatBalance(0)}</td>
              <td>{Formatter.currency.formatBalance(-34.53)}</td>
            </tr>
          </tbody>
        </table>
      </Grid>

      <Grid size={{xs: 12, md: 5}}>
        <strong>Historical overview of monthly endings</strong>

        <table>
          <thead>
          <tr>
            <th>Period</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Balance</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Jan. 2026</td>
            <td>{Formatter.currency.formatBalance(5433.4)}</td>
            <td>{Formatter.currency.formatBalance(4324)}</td>
            <td>{Formatter.currency.formatBalance(432)}</td>
          </tr>
          <tr>
            <td>Dec. 2025</td>
            <td>{Formatter.currency.formatBalance(34.53)}</td>
            <td>{Formatter.currency.formatBalance(0)}</td>
            <td>{Formatter.currency.formatBalance(-34.53)}</td>
          </tr>
          <tr>
            <td>Nov. 2025</td>
            <td>{Formatter.currency.formatBalance(34.53)}</td>
            <td>{Formatter.currency.formatBalance(0)}</td>
            <td>{Formatter.currency.formatBalance(-34.53)}</td>
          </tr>
          </tbody>
        </table>
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <strong>Historical chart of income and or exenpses grouped by month</strong>
        <strong>Bars will show incom and expenses per month</strong>
        <strong>Line series will show the balance for the according month</strong>
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <strong>Historical chart of income and or exenpses grouped by month and category</strong>
        <strong>Bars will show incom and expenses per month and category</strong>
        <strong>Line series will show the balance for the according month</strong>
      </Grid>

      <Grid size={{xs: 12, md: 12}} container>
        <Grid size={{xs: 12, md: 4}}>
          <strong>Overview of expenses/income by (category and receiver receiver will not be case sensitive) (chart view)</strong>
        </Grid>

        <Grid size={{xs: 12, md: 4}} container>
          <Grid size={{xs: 6, md: 6}}>Stats card 1</Grid>
          <Grid size={{xs: 6, md: 6}}>Stats card 2</Grid>
          <Grid size={{xs: 6, md: 6}}>Stats card 3</Grid>
          <Grid size={{xs: 6, md: 6}}>Stats card 4</Grid>
        </Grid>

        <Grid size={{xs: 12, md: 4}}>
          <strong>Overview of expenses/income by payment method (chart view)</strong>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
