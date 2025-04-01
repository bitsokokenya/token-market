import { NextApiRequest, NextApiResponse } from 'next';
import { AccountId, Client } from '@hashgraph/sdk';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, spender, amount } = req.body;
    
    // Validate input
    if (!token || !spender || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: token, spender, amount' 
      });
    }
    
    // In production, you would use Hedera SDK to perform the actual approval
    // This is a mock implementation for development purposes
    
    // Return a mock success response
    // In production, submit the transaction and return the transaction ID
    return res.status(200).json({ 
      success: true,
      token: token,
      spender: spender,
      amount: amount,
      transactionId: `0.0.${Date.now()}.${Math.floor(Math.random() * 1000)}` // Mock transaction ID
    });
  } catch (error: any) {
    console.error('Error approving token:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to approve token' 
    });
  }
} 