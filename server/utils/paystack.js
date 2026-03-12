const axios = require('axios');

const paystack = {
  initializeTransaction: async (email, amount) => {
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amount * 100, // Paystack expects amount in pesewas
          callback_url: `${process.env.FRONTEND_URL}/payment-callback`
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Paystack initialization error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  verifyTransaction: async (reference) => {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Paystack verification error:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

module.exports = paystack;
