import React, { useState } from 'react';

type UsageInfo = {
  postsGenerated: number;
  maxPosts: number;
  isPremium: boolean;
  postsRemaining: number;
};

type PostFormProps = {
  onSubmit: (input: string) => void;
  usage?: UsageInfo;
};

const PostForm: React.FC<PostFormProps> = ({ onSubmit, usage }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  const showUsageLimit = usage && !usage.isPremium;

  return (
    <div className="w-full max-w-xl mx-auto">
      {showUsageLimit && (
        <div className="mb-4 text-sm p-3 bg-blue-50 rounded-md text-blue-800">
          <p>
            Posts generated: <span className="font-semibold">{usage.postsGenerated} / {usage.maxPosts}</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(usage.postsGenerated / usage.maxPosts) * 100}%` }}
            ></div>
          </div>
          {usage.postsRemaining <= 3 && (
            <p className="mt-2 text-red-600">
              {usage.postsRemaining === 0 
                ? 'You have reached your usage limit for the free plan.' 
                : `Only ${usage.postsRemaining} posts remaining.`}
            </p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full p-4 bg-white rounded shadow flex flex-col gap-4">
        <textarea
          className="border border-gray-300 rounded p-2 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="What do you want to post about?"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={!input.trim() || (usage?.postsRemaining === 0 && !usage?.isPremium)}
        >
          Generate Post
        </button>
      </form>
    </div>
  );
};

export default PostForm; 