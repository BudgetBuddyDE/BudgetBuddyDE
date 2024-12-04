import {Head, Html, Preview, Section, Text} from '@react-email/components';
import React from 'react';

import {ButtonContainer, Layout, StyledBody, StyledButton} from '../../components';

export type OptInProps = {
  name: string;
  company: string;
  newsletter: string;
  newsletterId: string;
  userId: string;
  endpointHost: string;
};

export const OptIn: React.FC<OptInProps> = ({name, company, newsletter, newsletterId, userId, endpointHost}) => {
  const query = new URLSearchParams({
    userId: userId,
    newsletterId: newsletterId,
  });
  const redirectUrl = `${endpointHost}/opt-in/verify?${query.toString()}`;

  return (
    <Html>
      <Head />
      <Preview>Subscribe the {newsletter} newsletter!</Preview>
      <StyledBody>
        <Layout>
          <Section style={{padding: '1rem'}}>
            <Text style={paragraph}>
              Hi {name}, <br /> you have subscribed to the {newsletter} newsletter. To receive the emails in the future,
              please confirm that it was you who subscribed. If this is not the case, simply ignore this email.
            </Text>

            <ButtonContainer>
              <StyledButton href={redirectUrl}>Verify subscription</StyledButton>
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

export default OptIn;

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
