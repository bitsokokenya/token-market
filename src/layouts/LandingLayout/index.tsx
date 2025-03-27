import { useState } from 'react';
import type { NextPage } from 'next';

import Input from '../../components/Input';
import { useRouter } from 'next/router';
import { ROUTES } from '../../common/constants';

const LandingLayout: NextPage = () => {
  const router = useRouter();
  const [address, setAddress] = useState('');

  const handleInput = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = ev.target;
    setAddress(value);
  };

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (address) {
      router.push(`${ROUTES.HOME}?addr=${address}`);
    }
  };

  return (
    <div className="flex flex-col items-center py-4 mx-auto lg:container p-4 h-full">
      <div className="flex flex-col items-center justify-center md:px-4 py-4 mx-auto flex-1 w-full md:mt-8">
        <h1 className="text-center text-high text-2 sm:text-3 lg:text-4.75 font-bold leading-tight tracking-tighter">
          Capital Management   <br />
          for your SME
        </h1>
        <form
          onSubmit={handleSubmit}
          className="my-4 flex items-center justify-center w-full md:w-1/2"
        >
          <Input
            className="text-center w-full"
            size="xl"
            value={address}
            onChange={handleInput}
            placeholder="Enter Business name or Account ID (0.0.355676)"
          />
        </form>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start my-4 w-full flex-1">
        <div className="w-full lg:max-w-sm sm:mr-4 px-8 py-16 rounded-lg flex items-center text-center justify-center flex-col text-high bg-gradient-to-b from-surface-10 to-transparent">
          <h3 className="text-1.5 lg:text-2 font-semibold tracking-tighter">Insightful</h3>
          <span>Deep insights with AI powered analysis of your business investments.</span>
        </div>
        <div className="w-full lg:max-w-sm sm:mr-4 px-8 mt-6 md:mt-0 py-16 rounded-lg flex items-center text-center justify-center flex-col text-high bg-gradient-to-b from-surface-10 to-transparent">
          <h3 className="text-1.5 lg:text-2 font-semibold tracking-tighter">Secure</h3>
          <span>Permissionless investment management powered by secure always-on Hedera blockchain .</span>
        </div>
        <div className="w-full lg:max-w-sm px-8 py-16 mt-6 md:mt-0 rounded-lg flex items-center text-center justify-center flex-col text-high bg-gradient-to-b from-surface-10 to-transparent">
          <h3 className="text-1.5 lg:text-2 font-semibold tracking-tighter">Future Proof</h3>
          <span>We're developing the best in-class defi pool manager for SME's with built-in support for bitcoin lightning network.</span>
        </div>
      </div>
    </div>
  );
};

export default LandingLayout;
