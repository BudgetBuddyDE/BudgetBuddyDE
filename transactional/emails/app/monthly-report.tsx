import {Column, Head, Html, Preview, Row, Section, Text} from '@react-email/components';
import {format} from 'date-fns';
import React from 'react';

import {ButtonContainer, Layout, NumBox, StyledBody, StyledButton} from '../../components';
import {Formatter} from '../../utils';

export type MonthlyReportProps = {
  name: string;
  company: string;
  month: Date;
  income: number;
  spendings: number;
  balance: number;
  grouped: {category: string; income: number; spendings: number; balance: number}[];
};

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  name,
  company = 'Budget-Buddy',
  income,
  spendings,
  balance,
  month,
  grouped,
}) => {
  const formattedDate = format(month, 'MMMM yy');
  return (
    <Html>
      <Head />
      <Preview>Monthly report for May {formattedDate}</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, here is your monthly report for <b>{formattedDate}</b>.
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
                <Column>
                  <Text style={{...text, fontWeight: 'bolder'}}>Category</Text>
                </Column>

                <Column>
                  <Text style={{...text, fontWeight: 'bolder', textAlign: 'right'}}>Total</Text>
                </Column>
              </Row>

              {grouped.map(({category, income, spendings, balance}, idx, arr) => (
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
              <StyledButton href={'https://app.budget-buddy.de'}>View more</StyledButton>
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

export default MonthlyReport;

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
