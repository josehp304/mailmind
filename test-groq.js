#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
const API_KEY = process.env.GROQ_API_KEY;

console.log('Testing GROQ API connection...');
console.log('API Key exists:', !!API_KEY);
console.log('API Key starts with:', API_KEY?.substring(0, 10) + '...');

async function testGroqAPI() {
  try {
    const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: "Say hello in a professional manner"
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GROQ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', data.choices[0]?.message?.content);
  } catch (error) {
    console.error('Error testing GROQ API:', error.message);
  }
}

testGroqAPI();