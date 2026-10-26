import { useState } from 'react';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


export function EditProfile() {
  const [formData, setFormData] = useState({
    username: 'Shannon Martinez',
    email: 'shannon@example.com',
    bio: 'Minimalist style enthusiast · Sustainable fashion advocate',
    location: 'Nairobi, Kenya',
    website: 'shannonmartinez.com',
  });

  const [stylePreferences, setStylePreferences] = useState<string[]>([
    'Minimalist',
    'Sustainable',
    'Vintage',
  ]);

  const allStyles = [
    'Minimalist',
    'Vintage',
    'Bohemian',
    'Streetwear',
    'Elegant',
    'Casual',
    'Sustainable',
    'Formal',
    'Athleisure',
  ];

  const toggleStyle = (style: string) => {
    setStylePreferences((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    // Handle save logic
    console.log('Saving profile...', formData, stylePreferences);
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/me">
            <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </Link>
          <div>
            <h1 className="text-white text-3xl font-black tracking-tight">EDIT PROFILE</h1>
            <p className="text-white/70 text-sm font-semibold">
              Update your information
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black font-black text-sm rounded-lg hover:opacity-90 transition-opacity uppercase tracking-wide flex items-center gap-2"
        >
          <Save className="w-4 h-4" strokeWidth={2.5} />
          Save
        </button>
      </div>

      {/* Form */}
      <div className="px-6 pt-6">
        {/* Avatar */}
        <div className="mb-8">
          <p className="text-white/60 text-xs font-black uppercase tracking-wide mb-3">
            Profile Photo
          </p>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center border-4 border-white/20 shadow-lg">
                <span className="text-black text-3xl font-black">SM</span>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-black shadow-lg hover:bg-[#FAFAFA] transition-colors">
                <Camera className="w-4 h-4 text-black" strokeWidth={2.5} />
              </button>
            </div>
            <div>
              <button className="px-4 py-2 bg-white/10 border border-white/20 text-white font-black text-xs rounded-lg hover:bg-white/20 transition-colors uppercase tracking-wide mb-2">
                Upload Photo
              </button>
              <p className="text-white/60 text-xs font-semibold">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-5 mb-8">
          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>

          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>

          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors resize-none"
            />
            <p className="text-white/60 text-xs font-semibold mt-2">
              {formData.bio.length}/150 characters
            </p>
          </div>

          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>

          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>
        </div>

        {/* Style Preferences */}
        <div className="mb-8">
          <label className="text-white text-sm font-black mb-3 block uppercase tracking-wide">
            Style Preferences
          </label>
          <p className="text-white/60 text-xs font-semibold mb-4">
            Select styles that match your aesthetic
          </p>
          <div className="flex flex-wrap gap-2">
            {allStyles.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                  stylePreferences.includes(style)
                    ? 'bg-[#48CD8A] text-black border-[#48CD8A]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button (Mobile) */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black font-black text-sm py-4 rounded-xl hover:opacity-90 transition-opacity uppercase tracking-wide flex items-center justify-center gap-2 mb-6"
        >
          <Save className="w-5 h-5" strokeWidth={2.5} />
          Save Changes
        </button>

        {/* Danger Zone */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-white text-sm font-black uppercase tracking-wide mb-4">
            Danger Zone
          </h3>
          <button className="w-full py-3 bg-red-600/20 border border-red-600/40 text-red-400 font-black text-sm rounded-lg hover:bg-red-600/30 transition-colors uppercase tracking-wide">
            Delete Account
          </button>
          <p className="text-white/60 text-xs font-semibold mt-3 text-center">
            This action cannot be undone
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
