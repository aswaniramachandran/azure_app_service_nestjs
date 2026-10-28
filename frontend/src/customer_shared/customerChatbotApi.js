import { apiRequest } from '../apiClient.js';

export async function sendCustomerChatbotMessage(message) {
  const response = await apiRequest('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  if (typeof response?.answer !== 'string' || !response.answer.trim()) {
    throw new Error('The chatbot returned an invalid response.');
  }

  return response.answer.trim();
}
