import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

import Button from '../Button';
import { ROUTES } from '../../common/constants';
import { HashConnectButton } from '../HashConnectButton';

const Account = () => {
  const router = useRouter();
  const account = useAccount({
    onDisconnect() {
      router.push(ROUTES.LANDING);
    },
    onConnect() {
      if (router.pathname === ROUTES.LANDING) {
        router.push(ROUTES.HOME);
      }
    },
  });
  return (
    <div className="flex gap-2 items-center">
      <HashConnectButton />
    </div>
  );
};

export default Account;
