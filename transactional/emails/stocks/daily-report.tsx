import {type TStockPositionWithQuote} from '@budgetbuddyde/types';
import {Column, Head, Html, Preview, Row, Section, Text} from '@react-email/components';
import {format} from 'date-fns';
import React from 'react';

import {type TMetalQuote} from '../../../src/services';
import {ButtonContainer, Layout, NumBox, StyledBody, StyledButton} from '../../components';
import {Formatter} from '../../utils';

export type DailyReportProps = {
  name: string;
  company: string;
  day?: Date;
  assets: TStockPositionWithQuote[];
  metals: TMetalQuote[];
  viewMoreLink?: string;
};

export const DailyReport: React.FC<DailyReportProps> = ({
  name = 'Buddy',
  company = 'Budget-Buddy',
  day = new Date(),
  assets = [],
  metals = [],
  viewMoreLink = 'https://app.budget-buddy.de/dashboard/stocks',
}) => {
  const formattedToday = format(day, 'dd MMMM yy');
  const depotValue: number = assets.reduce((acc, position) => {
    return acc + position.quote.price * position.quantity;
  }, 0);
  const totalProfit: number = assets.reduce((acc, position) => {
    return acc + (position.quote.price - position.buy_in) * position.quantity;
  }, 0);
  return (
    <Html>
      <Head />
      <Preview>Portfolio Report {formattedToday}</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, here is your daily portfolio report for <b>{formattedToday}</b>.
            </Text>

            <Section style={{marginBottom: '1rem'}}>
              <Row style={{columnGap: '1rem', gap: '1rem'}}>
                <Column>
                  <NumBox label="Depot Value" value={depotValue} style={{marginLeft: '0'}} />
                </Column>
                <Column>
                  <NumBox label="Unrealised Profit" value={totalProfit} style={{marginRight: '0'}} />
                </Column>
              </Row>
            </Section>

            <Section style={{marginBottom: '1rem'}}>
              <Row>
                <Column style={{width: '60%'}}>
                  <Text style={label}>Position</Text>
                </Column>
                <Column style={{width: '20%'}}>
                  <Text style={{...label, textAlign: 'right'}}>Value</Text>
                </Column>
                <Column style={{width: '20%'}}>
                  <Text style={{...label, textAlign: 'right'}}>+/-</Text>
                </Column>
              </Row>

              {assets
                .sort((a, b) => b.volume - a.volume)
                .map((position, idx) => {
                  const currency = position.quote.currency;
                  const currentPrice = position.quote.price;

                  const profit = position.quantity * currentPrice - position.quantity * position.buy_in;
                  const profitPercentage = (profit / (position.quantity * position.buy_in)) * 100;
                  return (
                    <Row
                      key={name.toLowerCase()}
                      style={{
                        borderColor: '#dadce0',
                        borderStyle: 'solid',
                        borderTopWidth: `${idx === 0 ? 0 : 1}px`,
                      }}>
                      <Column style={{width: '60%'}}>
                        <Text style={{...text, fontSize: '90%'}}>{position.isin}</Text>
                        <Text style={text}>{position.quantity.toFixed(2)} x {position.name}</Text>
                      </Column>
                      <Column style={{width: '20%'}}>
                        <Text style={{...text, fontWeight: 'bolder', textAlign: 'right'}}>
                          {Formatter.currency(currentPrice * position.quantity, currency)}
                        </Text>
                        <Text style={{...text, fontSize: '90%', textAlign: 'right'}}>
                          {Formatter.currency(currentPrice, currency)}
                        </Text>
                      </Column>
                      <Column style={{width: '20%'}}>
                        <Text style={{...text, fontWeight: 'bolder', textAlign: 'right'}}>
                          {Formatter.currency(profit, currency)}
                        </Text>
                        <Text style={{...text, fontSize: '90%', textAlign: 'right'}}>
                          {profitPercentage.toFixed(2)} %
                        </Text>
                      </Column>
                    </Row>
                  );
                })}
            </Section>

            <Section style={{marginBottom: '1rem'}}>
              <Row style={{columnGap: '1rem', gap: '1rem'}}>
                {metals.map(metal => (
                  <Column key={metal.name.toLowerCase()}>
                    <NumBox label={metal.name} value={metal.quote.EUR} style={{marginLeft: '0'}} />
                  </Column>
                ))}
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
