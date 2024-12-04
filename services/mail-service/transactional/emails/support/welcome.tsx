import {Head, Html, Preview, Section, Text} from '@react-email/components';
import React from 'react';

import {ButtonContainer, Layout, StyledBody, StyledButton} from '../../components';

export type WelcomeProps = {
  name: string;
  company: string;
  redirectUrl: string;
};

export const Welcome: React.FC<WelcomeProps> = ({name, company, redirectUrl}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome {name}!</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, <br /> we're thrilled to welcome you to {company}! Before getting started on your journey
              towards smarter budgeting, we need to confirm your email address.
            </Text>

            <ButtonContainer>
              <StyledButton href={redirectUrl}>Verify</StyledButton>
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

export default Welcome;

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
