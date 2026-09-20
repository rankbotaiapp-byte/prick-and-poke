import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PageHeroLayout({ businessSlug, children }) {
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    if (!businessSlug) return;
    supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', `${businessSlug}:hero_background`)
      .maybeSingle()
      .then(({ data }) => setBgImage(data?.setting_value || ''));
  }, [businessSlug]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-white flex flex-col justify-between"
      style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundColor: '#09090b' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85 z-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md mx-auto p-4 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
