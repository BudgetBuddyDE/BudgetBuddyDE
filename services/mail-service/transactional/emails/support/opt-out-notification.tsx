import {Head, Html, Preview, Section, Text} from '@react-email/components';
import React from 'react';

import {Layout, StyledBody} from '../../components';

export type OptOutNotificationProps = {
  name: string;
  company: string;
  newsletter: string;
};

export const OptOutNotification: React.FC<OptOutNotificationProps> = ({name, company, newsletter}) => {
  return (
    <Html>
      <Head />
      <Preview>Unsubscribed from the {newsletter} newsletter!</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, <br /> you have unsubscribed from the {newsletter} newsletter and will no longer receive emails
              about it!
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

export default OptOutNotification;

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
