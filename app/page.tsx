'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-black/50" />
      <video
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
        src="/background.mp4"
        autoPlay
        loop
        muted
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 animate-fade-in-down">
          Welcome to the Future of AI Interaction
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-3xl animate-fade-in-up">
          Experience the power of generative AI with our intelligent chat
          application. Engage in natural conversations, get instant answers, and
          explore the limitless possibilities of AI.
        </p>
        <Link href="/chat">
          <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 animate-bounce">
            Start Chatting
          </a>
        </Link>
      </div>
    </div>
  );
}
