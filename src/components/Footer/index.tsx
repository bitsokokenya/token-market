import React from 'react';
import { EXTERNAL_LINKS } from '../../common/constants';

import Discord from '../icons/Discord';
import Github from '../icons/Github';
import Twitter from '../icons/Twitter';

function Footer() {
  return (
    <footer className="my-2 flex justify-between items-start w-full text-0.875 text-high">
      <div>
        <div className="flex font-medium">
          <div>
            <a href={EXTERNAL_LINKS.GITCOIN} target="_blank" rel="noreferrer">
              Donate
            </a>
          </div>
          <div className="pl-8">
            <a href={EXTERNAL_LINKS.FEEDBACK} target="_blank" rel="noreferrer">
              Feedback
            </a>
          </div>
        </div>
        <div className="text-0.6875 text-medium">
          Made in Nairobi. <span>Copyright 2025.</span>
        </div>
      </div>
      <div className="flex">
        <a href={EXTERNAL_LINKS.DISCORD} target="_blank" rel="noreferrer">
          <Discord />
        </a>
        <a href={EXTERNAL_LINKS.TWITTER} className="ml-2" target="_blank" rel="noreferrer">
          <Twitter />
        </a>
        <a href={EXTERNAL_LINKS.GITHUB} className="ml-2" target="_blank" rel="noreferrer">
          <Github />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
