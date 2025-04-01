import { NextApiRequest, NextApiResponse } from 'next';
import { AccountId, Client } from '@hashgraph/sdk';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { owner, spender, token } = req.query;
    
    // Validate input
    if (!owner || !spender || !token) {
      return res.status(400).json({ 
        error: 'Missing required parameters: owner, spender, token' 
      });
    }
    
    // In production, you would use Hedera SDK to fetch the actual allowance
    // This is a mock implementation for development purposes
    
    // Return a mock allowance value
    // In production implementation, use SDK to get actual allowance
    const mockAllowance = '1000000000000000000'; // Large allowance
    
    return res.status(200).json({ 
      allowance: mockAllowance,
      token: token,
      owner: owner,
      spender: spender
    });
  } catch (error: any) {
    console.error('Error getting token allowance:', error);
    return res.status(500).json({ error: 'Failed to get token allowance' });
  }
} 