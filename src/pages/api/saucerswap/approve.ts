import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId, tokenAddress, spender, amount } = req.body;
    
    // Validate input
    if (!accountId || !tokenAddress || !spender || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: accountId, tokenAddress, spender, amount' 
      });
    }

    // In a real implementation, you would create and execute the approval transaction
    // using the Hedera SDK. For this mock, we'll just return a success response.
    
    // For demo purposes, simulate a transaction
    const mockTransactionId = `0.0.${accountId.split('.')[2]}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Return a mock response
    return res.status(200).json({
      success: true,
      transactionHash: mockTransactionId,
      tokenAddress: tokenAddress,
      spender: spender,
      amount: amount,
      approved: true
    });
  } catch (error: any) {
    console.error('Error approving token:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to approve token',
      message: error.message 
    });
  }
} 