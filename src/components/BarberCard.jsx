import React from 'react';
import HaloAvatar from './HaloAvatar';

export default function BarberCard({ name = '', specialty, bio, profileImageUrl }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-start gap-4 backdrop-blur-md mb-3 shadow-lg">
      <HaloAvatar src={profileImageUrl} name={name} size={56} />
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-base">{name}</h3>
        {specialty && <p className="text-xs text-amber-400 font-medium mb-1">{specialty}</p>}
        {bio && <p className="text-xs text-zinc-400 leading-relaxed">{bio}</p>}
      </div>
    </div>
  );
}
