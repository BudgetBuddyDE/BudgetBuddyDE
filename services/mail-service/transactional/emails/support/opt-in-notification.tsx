import {Head, Html, Preview, Section, Text} from '@react-email/components';
import React from 'react';

import {Layout, StyledBody} from '../../components';

export type OptInNotificationProps = {
  name: string;
  company: string;
  newsletter: string;
};

export const OptInNotification: React.FC<OptInNotificationProps> = ({name, company, newsletter}) => {
  return (
    <Html>
      <Head />
      <Preview>Subscribed to the {newsletter} newsletter!</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, <br /> you have verified your subscription to the {newsletter} newsletter and will receive
              emails from now on!
            </Text>

            <Text style={paragraph}>
              If you have any questions, please feel free to contact us. We&amp;apos;re here to help!
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

export default OptInNotification;

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
