'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TwitterFormatPage() {
  const [inputText, setInputText] = useState('```markdown\n🚀 Exciting News! 🚀\n\nI\'m thrilled to share that I\'ve just completed a fascinating project where I used the power of AI to generate engaging LinkedIn posts! 🤖✨\n\nIn this project, I leveraged the capabilities of the `gpt-3.5-turbo` model to create compelling content that resonates with my professional network. Here\'s a glimpse into the process:\n\n1. **Understanding the Prompt**: I started by crafting a clear and concise prompt that outlined the task. The prompt was designed to guide the AI in generating a LinkedIn post that is both engaging and professional.\n\n2. **Generating the Post**: Using the `gpt-3.5-turbo` model, I generated a LinkedIn post that not only met the requirements but also added a touch of creativity and personality.\n\n3. **Reviewing the Output**: The generated post was reviewed to ensure it aligned with my professional tone and style. Minor adjustments were made to perfect the final output.\n\n4. **Sharing the Results**: The final post was shared on LinkedIn, and the response was overwhelmingly positive! The AI-generated content was well-received by my network, sparking meaningful conversations and connections.\n\nThis project was a fantastic learning experience, and it highlighted the incredible potential of AI in content creation. I\'m excited to explore more ways to integrate AI into my professional endeavors.\n\nIf you\'re curious about how AI can enhance your LinkedIn presence or have any questions about the process```');
  const [formattedText, setFormattedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFormatText = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to format');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/twitter/format-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFormattedText(data.formatted);
      } else {
        setError(data.error || 'Failed to format text');
      }
    } catch (err) {
      setError('An error occurred while formatting the text');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyFormatted = () => {
    if (!formattedText) return;
    
    navigator.clipboard.writeText(formattedText)
      .then(() => alert('Formatted text copied to clipboard'))
      .catch(err => console.error('Failed to copy text:', err));
  };
  
  const handleTweetFormatted = () => {
    if (!formattedText) return;
    
    // Test tweets usually work, so we'll use the same format
    fetch('/api/twitter/tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: formattedText })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`Successfully tweeted as @${data.accountUsername}!`);
      } else {
        alert(`Error: ${data.error || data.details || 'Failed to tweet'}`);
      }
    })
    .catch(err => {
      alert(`Error: ${err.message}`);
    });
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Twitter Text Formatter</h1>
      
      <div className="mb-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Input Text (with Markdown)</h2>
          <textarea
            className="w-full h-64 p-3 border rounded"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
          <div>
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-70"
              onClick={handleFormatText}
              disabled={loading}
            >
              {loading ? 'Formatting...' : 'Format for Twitter'}
            </button>
          </div>
          {error && (
            <div className="text-red-600">{error}</div>
          )}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Formatted Text (for Twitter)</h2>
          <textarea
            className="w-full h-64 p-3 border rounded bg-gray-50"
            value={formattedText}
            readOnly
          ></textarea>
          
          {formattedText && (
            <div className="flex space-x-2">
              <button 
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={handleCopyFormatted}
              >
                Copy
              </button>
              <button 
                className="bg-[#1da1f2] text-white px-4 py-2 rounded hover:bg-[#0c85d0]"
                onClick={handleTweetFormatted}
              >
                Tweet This
              </button>
            </div>
          )}
          
          {formattedText && (
            <div className="text-sm text-gray-600">
              Character count: {formattedText.length}/280
              {formattedText.length > 280 && (
                <span className="text-red-600"> (Too long for Twitter)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 