import {Column, Head, Html, Preview, Row, Section, Text} from '@react-email/components';
import {format} from 'date-fns';
import React from 'react';

import {ButtonContainer, Layout, StyledBody, StyledButton} from '../../components';
import {Formatter} from '../../utils';

export type DailyReport = {
  name: string;
  company: string;
};

export const DailyReport: React.FC<DailyReport> = ({name = 'John', company = 'Budget-Buddy'}) => {
  const today = new Date();
  const formattedToday = format(today, 'dd-MM-yyyy');
  return (
    <Html>
      <Head />
      <Preview>Portfolio report {formattedToday}</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, here is your daily portfolio report for <b>{formattedToday}</b>.
            </Text>

            <Section style={{marginBottom: '1rem'}}>
              <Row>
                <Column style={{width: '30%'}}>
                  <Text style={label}>Position</Text>
                </Column>
                <Column style={{width: '17.5%'}}>
                  <Text style={{...label, textAlign: 'right'}}>Open</Text>
                </Column>
                <Column style={{width: '17.5%'}}>
                  <Text style={{...label, textAlign: 'right'}}>Close</Text>
                </Column>
                <Column style={{width: '17.5%'}}>
                  <Text style={{...label, textAlign: 'right'}}>+/-</Text>
                </Column>
                <Column style={{width: '17.5%'}}>
                  <Text style={{...label, textAlign: 'right'}}>Total</Text>
                </Column>
              </Row>

              {[
                {amount: 100, name: 'VOW3', open: 100.45, close: 108.34},
                {amount: 100, name: 'RHM', open: 100, close: 110},
              ].map(({amount, name, open, close}) => {
                const change = close - open;
                const changePerc = (change / open) * 100;
                const totalVolume = amount * close;
                return (
                  <Row key={name.toLowerCase()}>
                    <Column style={{width: '30%'}}>
                      <Text style={text}>
                        {amount}x {name}
                      </Text>
                    </Column>
                    <Column style={{width: '17.5%'}}>
                      <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(open)}</Text>
                    </Column>
                    <Column style={{width: '17.5%'}}>
                      <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(close)}</Text>
                    </Column>
                    <Column style={{width: '17.5%'}}>
                      <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(change)}</Text>
                      <Text style={{...text, textAlign: 'right'}}>{changePerc.toFixed(2)}%</Text>
                    </Column>
                    <Column style={{width: '17.5%'}}>
                      <Text style={{...text, textAlign: 'right'}}>{Formatter.currency(totalVolume)}</Text>
                    </Column>
                  </Row>
                );
              })}
            </Section>

            <ButtonContainer>
              <StyledButton href={'https://app.budget-buddy.de/dashboard/stocks'}>View more</StyledButton>
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

export default DailyReport;

const text = {
  margin: 0,
  fontWeight: '500',
};

const label = {
  ...text,
  fontWeight: 'bolder',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
