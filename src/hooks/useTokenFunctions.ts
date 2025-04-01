import { useCallback, useEffect, useState } from 'react';
import { AccountId, AccountBalanceQuery, Client } from '@hashgraph/sdk';
import { HederaToken } from '../utils/tokens';

export function useTokenFunctions(token: HederaToken | undefined) {
  const [balance, setBalance] = useState<string>('0');
  const [allowance, setAllowance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const getBalances = useCallback(async (accountId: string) => {
    if (!token) return '0';

    try {
      // Create Hedera client
      const client = Client.forMainnet(); // or forTestnet() based on your network

      // Create the balance query using the account ID directly (already in 0.0.XXXX format)
      const query = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));

      // Execute the query
      const tokenBalance = await query.execute(client);
      
      // Get the balance for the specific token using the token address directly (already in 0.0.XXXX format)
      if (tokenBalance.tokens) {
        const balance = tokenBalance.tokens.get(token.address);
        
        if (balance) {
          return balance.toString();
        }
      }
      
      return '0';
    } catch (error) {
      console.error('Failed to get balance for token:', error);
      return '0';
    }
  }, [token]);

  const getAllowances = useCallback(async (owner: string, spender: string) => {
    if (!token) return '0';

    try {
      // Use API endpoint to fetch allowances instead of direct SDK call
      const response = await fetch(`/api/token/allowance?owner=${owner}&spender=${spender}&token=${token.address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch allowance');
      }
      
      const data = await response.json();
      return data.allowance || '0';
    } catch (error) {
      console.error('Failed to get allowance:', error);
      return '0';
    }
  }, [token]);

  const approveToken = useCallback(async (spender: string, amount: string) => {
    if (!token) return false;

    try {
      // Use API endpoint to approve token instead of direct SDK call
      const response = await fetch('/api/token/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.address,
          spender,
          amount,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve token');
      }
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Failed to approve token:', error);
      return false;
    }
  }, [token]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const balance = await getBalances(token.address);
        setBalance(balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [token, getBalances]);

  return {
    balance,
    allowance,
    loading,
    getBalances,
    getAllowances,
    approveToken,
  };
}
