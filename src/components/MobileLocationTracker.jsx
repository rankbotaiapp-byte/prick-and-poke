import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function MobileLocationTracker() {
  const [renderDate, setRenderDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublishLocation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('mobile_locations').insert([
        {
          render_date: renderDate,
          location_name: locationName,
          address: address,
          notes: notes
        }
      ]);

      if (error) throw error;

      alert('Daily mobile location published successfully!');
      setLocationName('');
      setAddress('');
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Error publishing location: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-xl mx-auto my-6">
      <h2 className="text-xl font-bold mb-4">📍 Mobile Route & Location Setter</h2>
      <form onSubmit={handlePublishLocation} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date for Render</label>
          <input 
            type="date" 
            value={renderDate} 
            onChange={(e) => setRenderDate(e.target.value)} 
            className="w-full border p-2 rounded-lg" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location / Spot Name</label>
          <input 
            type="text" 
            placeholder="e.g., Downtown Plaza Square" 
            value={locationName} 
            onChange={(e) => setLocationName(e.target.value)} 
            className="w-full border p-2 rounded-lg" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Street Address</label>
          <input 
            type="text" 
            placeholder="e.g., 123 Main St, City, State" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="w-full border p-2 rounded-lg" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Daily Notes / Hours (Optional)</label>
          <textarea 
            placeholder="e.g., Parked near the north entrance from 10 AM to 4 PM" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="w-full border p-2 rounded-lg" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-emerald-600 text-white p-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Publishing...' : 'Publish Today’s Location'}
        </button>
      </form>
    </div>
  );
}
