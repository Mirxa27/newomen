// src/components/chat/TranscriptPane.tsx
import React, { useEffect, useRef } from 'react';

type Transcript = {
  id: string;
  text: string;
  isFinal: boolean;
};

interface TranscriptPaneProps {
  transcripts: Transcript[];
}

const TranscriptPane: React.FC<TranscriptPaneProps> = ({ transcripts }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div
      className="flex-grow p-4 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow"
      aria-live="polite"
      aria-atomic="false"
    >
      {transcripts.map((transcript, index) => (
        <p
          key={transcript.id}
          className={`mb-2 ${transcript.isFinal ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
          {...(!transcript.isFinal && { 'aria-live': 'polite' })}
        >
          {transcript.text}
        </p>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export { TranscriptPane };
