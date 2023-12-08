import { Box, Grid, Link, Typography } from '@mui/material';
import { Image } from '../components/image.component';
import React from 'react';
import { AppMockup } from '../components/AppMockup.component';
import { useScreenSize } from '../hooks/useScreenSize.hook';

export const Blog = () => {
  const screenSize = useScreenSize();
  return (
    <Grid container spacing={3} maxWidth="lg">
      <Grid item xs={12} md={9} order={{ xs: 1, md: 0 }}>
        <AppMockup
          src={screenSize === 'small' ? '/mockup.png' : '/blog/app.dashboard.desktop.png'}
          containerProps={{ sx: {} }}
          imageStyle={{
            width: '80%',
            mx: '10%',
            boxShadow: { xs: 'none', md: (theme) => theme.shadows[6] },
          }}
        />

        <Typography id="introduction" variant="h2" sx={{ mt: 2 }}>
          Introducing Budget-Buddy
        </Typography>
        <Typography variant="h6">Your Personal Finance Tracker</Typography>
        <Typography>
          by <strong>Thorben Klein</strong>
        </Typography>

        <br />

        <Typography variant="body1">
          In today's fast-paced world, managing your finances can be a daunting task. The constant
          stream of income and expenses, coupled with the temptation of impulse purchases, often
          leaves us scratching our heads at the end of the month, wondering where our hard-earned
          money went.
          <br /> Enter Budget-Buddy, a revolutionary web-based application designed to put you back
          in control of your financial journey.
        </Typography>

        <Typography id="why" variant="h5" fontWeight={'bolder'} sx={{ mt: 2 }}>
          Why Budget-Buddy?
        </Typography>
        <Block
          title="Privacy"
          text={`Budget-Buddy is not just another finance-tracking tool; it's your financial confidant. We
          understand the importance of privacy in financial matters, and that's why we stands out.
          No selling of your data, just a secure platform for you to monitor and manage your
          finances with peace of mind.`}
        />

        <Block
          title="Customization"
          text={`For tech-savvy individuals who demand more than a one-size-fits-all solution, Budget-Buddy
          is the answer. Customization is at the core of our application, allowing you to tailor the
          platform to suit your unique interests and financial goals.`}
        />

        <Block
          title="Self-Hosting"
          text={`In addition, we offer you the option to self-host the application and its associated
          services for maximum data protection. This means you have full control over your data,
          ensuring that Budget-Buddy aligns with your individual security requirements. Your
          financial information remains in your hands, guaranteeing absolute privacy.`}
        />

        <React.Fragment>
          <Typography id="features" variant="h6" fontWeight={'bolder'} sx={{ mt: 2 }}>
            Features
          </Typography>

          <Block
            title="JSON & CSV Import"
            text={`Simplify your initial setup by importing an JSON or CSV file from your old rust Excel.`}
          />
          <Block
            title="Visualizations"
            text={`Understand how you spend have spent your by money with meaningful graphics.`}
          />
        </React.Fragment>

        <React.Fragment>
          <Typography id="future-features" variant="h6" fontWeight={'bolder'} sx={{ mt: 2 }}>
            Future Features
          </Typography>

          <Block
            title="File Uploads"
            text={`Simplify your financial tracking further by uploading files directly into
          Budget-Buddy, ensuring all your financial data is in one place.`}
          />
          <Block
            title="File Analysis"
            text={`Analyse your uploaded files and extract financial information.`}
          />
          <Block
            title="Crypto & Stock tracking"
            text={`Track your crypto and stocks in one place and stay up to date on the latest market movements.`}
          />
          <Block title="Sub-Labels" text={`Add multiple labels to your transactions.`} />
        </React.Fragment>

        <Block
          id="why"
          title="Join the Budget-Buddy Community"
          text={`Ready to embark on a journey towards financial freedom? Join the Budget-Buddy community today. Whether you're a finance enthusiast looking for customization or a casual user seeking a user-friendly interface, Budget-Buddy welcomes you.
          Remember, your financial well-being is not just a goal; it's a journey. Let Budget-Buddy be your trusted companion every step of the way. `}
        />
        <Typography>
          <Link href="https://app.budget-buddy.de">Start tracking</Link>, start thriving with
          Budget-Buddy.
        </Typography>
      </Grid>

      <Grid item xs={12} md={3} order={{ xs: 0, md: 1 }}>
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '2px solid',
            borderColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: (theme) => `${theme.shape.borderRadius}px`,
            transition: '200ms',
            ':hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
            },
          }}
        >
          <Typography variant="subtitle1" sx={{ m: 2, mb: 0 }}>
            Table of Content
          </Typography>
          <ul>
            <li>
              <Link href="#introduction">Introduction</Link>
            </li>
            <li>
              <Link href="#why">Why Budget-Buddy?</Link>
            </li>
            <li>
              <Link href="#features">Features</Link>
            </li>
            <li>
              <Link href="#future-features">Future Features</Link>
            </li>
            <li>
              <Link href="#join">Join</Link>
            </li>
          </ul>
        </Box>
      </Grid>
    </Grid>
  );
};

const Title: React.FC<React.PropsWithChildren<{ id?: string }>> = ({ children, id }) => (
  <Typography id={id} variant="subtitle1" fontWeight={'bolder'} sx={{ pb: 0.5, mt: 1.5 }}>
    {children}
  </Typography>
);

const Text: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Typography fontSize={'108%'}>{children}</Typography>
);

const Block: React.FC<{ id?: string; title: string; text: string }> = ({ id, title, text }) => {
  return (
    <React.Fragment>
      <Title id={id}>{title}</Title>
      <Text>{text}</Text>
    </React.Fragment>
  );
};
