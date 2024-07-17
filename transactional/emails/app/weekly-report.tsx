import {Column, Head, Html, Preview, Row, Section, Text} from '@react-email/components';
import {format, subDays} from 'date-fns';
import React from 'react';

import {ButtonContainer, Layout, NumBox, StyledBody, StyledButton} from '../../components';
import {Formatter} from '../../utils';

export type WeeklyReportProps = {
  name: string;
  company: string;
  startDate: Date;
  endDate: Date;
  income: number;
  spendings: number;
  balance: number;
  grouped: {category: string; income: number; spendings: number; balance: number}[];
  viewMoreLink?: string;
};

const today = new Date();

export const WeeklyReport: React.FC<WeeklyReportProps> = ({
  name = 'Buddy',
  company = 'Budget-Buddy',
  income = 0,
  spendings = 0,
  startDate = subDays(today, 7),
  endDate = today,
  grouped = [],
  viewMoreLink = 'https://app.budget-buddy.de/transactions',
}) => {
  const balance = income - spendings;
  const formattedStartDate = format(startDate, 'dd.MM');
  const formattedEndDate = format(endDate, 'dd.MM');
  return (
    <Html>
      <Head />
      <Preview>
        Weekly Report {formattedStartDate} - {formattedEndDate}
      </Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, here is your weekly report from <b>{formattedStartDate}</b> to <b>{formattedEndDate}</b>.
            </Text>

            <Section style={{marginBottom: '1rem'}}>
              <Row style={{columnGap: '1rem', gap: '1rem'}}>
                <Column>
                  <NumBox label="Income" value={income} style={{marginLeft: '0'}} />
                </Column>
                <Column>
                  <NumBox label="Expenses" value={spendings} />
                </Column>
                <Column>
                  <NumBox label="Balance" value={balance} style={{marginRight: '0'}} />
                </Column>
              </Row>
            </Section>

            <Section style={{marginBottom: '1rem'}}>
              <Row>
                <Column style={col}>
                  <Text style={{...text, fontWeight: 'bolder'}}>Category</Text>
                </Column>

                <Column style={col}>
                  <Text style={{...text, fontWeight: 'bolder', textAlign: 'right'}}>Movement</Text>
                </Column>

                <Column style={col}>
                  <Text style={{...text, fontWeight: 'bolder', textAlign: 'right'}}>Balance</Text>
                </Column>
              </Row>

              {grouped.map(({category, income, spendings, balance}, idx) => (
                <Row
                  key={category.toLowerCase()}
                  style={{
                    borderColor: '#dadce0',
                    borderStyle: 'solid',
                    borderTopWidth: `${idx === 0 ? 0 : 1}px`,
                  }}>
                  <Column style={col}>
                    <Text style={{...text}}>{category}</Text>
                  </Column>
                  <Column style={col}>
                    <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(income)}</Text>
                    <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(-spendings)}</Text>
                  </Column>
                  <Column style={col}>
                    <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(balance)}</Text>
                  </Column>
                </Row>
              ))}

              <Row>
                <Column style={twoCol}>
                  <Text style={{...text, textAlign: 'right', fontWeight: 'bolder'}}>Total</Text>
                </Column>
                <Column style={col}>
                  <Text style={{...text, textAlign: 'right', fontWeight: 'bolder'}}>{Formatter.currency(balance)}</Text>
                </Column>
              </Row>
            </Section>

            <ButtonContainer>
              <StyledButton href={viewMoreLink}>View more</StyledButton>
            </ButtonContainer>

            <Text style={paragraph}>
              If you have any questions, please feel free to contact us. We're here to help!
            </Text>
            <Text style={paragraph}>
              Best Wishes,
              <br />
              The {company} Team
            </Text>
          </Section>
        </Layout>
      </StyledBody>
    </Html>
  );
};

export default WeeklyReport;

const text = {
  margin: 0,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const col = {
  width: 'calc(100% / 3)',
};

const twoCol = {
  width: '66.66%',
};
