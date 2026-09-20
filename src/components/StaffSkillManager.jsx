import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function StaffSkillManager() {
  const [staffName, setStaffName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [skills, setSkills] = useState([{ skillName: '', skillImage: null }]);
  const [loading, setLoading] = useState(false);

  // Handle profile image selection and live preview
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkillField = () => {
    setSkills([...skills, { skillName: '', skillImage: null }]);
  };

  const handleSkillChange = (index, field, value) => {
    const updatedSkills = [...skills];
    updatedSkills[index][field] = value;
    setSkills(updatedSkills);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profileImageUrl = '';

      // 1. Upload barber's profile picture to Supabase Storage
      if (profileImageFile) {
        const fileName = `barber-${Date.now()}-${profileImageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('app-uploads')
          .upload(fileName, profileImageFile);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('app-uploads')
          .getPublicUrl(fileName);
        
        profileImageUrl = publicURLData.publicUrl;
      }

      // 2. Process skill reference images
      const processedSkills = [];
      for (const skill of skills) {
        let skillImageUrl = '';
        if (skill.skillImage) {
          const skillFileName = `skill-${Date.now()}-${skill.skillImage.name}`;
          const { error: skillUploadError } = await supabase.storage
            .from('app-uploads')
            .upload(skillFileName, skill.skillImage);

          if (!skillUploadError) {
            const { data: skillURLData } = supabase.storage
              .from('app-uploads')
              .getPublicUrl(skillFileName);
            skillImageUrl = skillURLData.publicUrl;
          }
        }
        processedSkills.push({
          skillName: skill.skillName,
          skillImageUrl: skillImageUrl
        });
      }

      // 3. Save to database table
      const { error: dbError } = await supabase.from('staff_members').insert([
        {
          name: staffName,
          profile_image_url: profileImageUrl,
          skills: processedSkills
        }
      ]);

      if (dbError) throw dbError;

      alert('Barber profile published successfully!');
      setStaffName('');
      setSpecialty('');
      setBio('');
      setProfileImageFile(null);
      setImagePreview(null);
      setSkills([{ skillName: '', skillImage: null }]);
    } catch (err) {
      console.error(err);
      alert('Error saving barber: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl max-w-xl mx-auto my-6 text-white">
      <h2 className="text-xl font-bold mb-2">✂️ Add Barber & Profile Photo</h2>
      <p className="text-xs text-zinc-400 mb-6">Upload the barber's photo during setup. It will automatically be wrapped in your app's signature perimeter halo border color.</p>

      <form onSubmit={handleSaveStaff} className="space-y-4">
        {/* Barber Name & Photo Upload Section */}
        <div className="flex items-center space-x-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          {/* Signature Halo Border Ring Avatar Preview */}
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shrink-0 shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-500 font-bold">PHOTO</span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Barber Name</label>
              <input 
                type="text" 
                placeholder="e.g., Eric Mullen" 
                value={staffName} 
                onChange={(e) => setStaffName(e.target.value)} 
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-white" 
                required 
              />
            </div>
          </div>
        </div>

        {/* Profile Picture File Input */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Upload Barber Profile Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageSelect} 
            className="text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Specialty / Title</label>
          <input 
            type="text" 
            placeholder="e.g., Master barber / Texture & beard" 
            value={specialty} 
            onChange={(e) => setSpecialty(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-white" 
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Bio / Details</label>
          <textarea 
            placeholder="Skin fades and quiet chairs..." 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-white" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-zinc-200 text-black font-semibold p-3 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Publishing Barber...' : 'Save Barber & Halo Photo'}
        </button>
      </form>
    </div>
  );
}
