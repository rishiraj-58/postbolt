'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">PostBolt</h1>
        <h2 className="text-xl text-center mb-8 text-gray-800">
          Create your account
        </h2>
      </div>
      <div className="mx-auto">
        <SignUp signInUrl="/login" afterSignUpUrl="/dashboard" />
      </div>
    </main>
  );
} 