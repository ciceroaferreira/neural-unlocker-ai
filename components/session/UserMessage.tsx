import React from 'react';

interface UserMessageProps {
  text: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ text }) => (
  <div className="flex justify-end animate-in fade-in slide-in-from-bottom-10 duration-700">
    <div className="max-w-[80%] bg-white/[0.02] border border-white/5 px-10 py-7 rounded-[3rem] rounded-tr-none text-gray-400 font-mono text-base italic">
      "{text}"
    </div>
  </div>
);

export default UserMessage;
