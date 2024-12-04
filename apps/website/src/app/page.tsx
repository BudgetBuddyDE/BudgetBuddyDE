import React from 'react';

import {Features} from '@/components/sections/features';
import {Hero} from '@/components/sections/hero';
import {Repositories} from '@/components/sections/repositories';

export default function Home() {
  return (
    <React.Fragment>
      <Hero />
      <Features />
      {/* <Newsletter /> */}
      <Repositories />
    </React.Fragment>
  );
}
