import { useCallback, useEffect, useState } from 'react';
import { AccountId, AccountBalanceQuery, Client, AccountAllowanceQuery, AccountAllowanceApproveTransaction } from '@hashgraph/sdk';
import { Token } from '@uniswap/sdk-core';

export function useTokenFunctions(token: Token | undefined) {
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
      const balance = tokenBalance.tokens.get(token.address);
      
      if (balance) {
        return balance.toString();
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
      // Create Hedera client
      const client = Client.forMainnet(); // or forTestnet() based on your network

      // Create the allowance query using addresses directly (already in 0.0.XXXX format)
      const query = new AccountAllowanceQuery()
        .setOwnerAccountId(AccountId.fromString(owner))
        .setSpenderAccountId(AccountId.fromString(spender))
        .setTokenId(token.address);

      // Execute the query
      const allowance = await query.execute(client);
      
      return allowance.toString();
    } catch (error) {
      console.error('Failed to get allowance:', error);
      return '0';
    }
  }, [token]);

  const approveToken = useCallback(async (spender: string, amount: string) => {
    if (!token) return false;

    try {
      // Create Hedera client
      const client = Client.forMainnet(); // or forTestnet() based on your network

      // Create the approval transaction using addresses directly (already in 0.0.XXXX format)
      const transaction = new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(token.address, spender, amount)
        .freezeWith(client);

      // Sign and execute the transaction
      const signedTx = await transaction.sign(client.operatorKey!);
      const txResponse = await signedTx.execute(client);
      const receipt = await txResponse.getReceipt(client);

      return receipt.status === 'SUCCESS';
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
