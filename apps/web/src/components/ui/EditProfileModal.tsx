import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import WarzoneButton from './WarzoneButton';
import { api } from '../../lib/api';
import { CameraIcon } from './Icons';

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBio: string;
  currentDp: string | null;
}

export function EditProfileModal({ isOpen, onClose, currentBio, currentDp }: EditProfileModalProps) {
  const [bio, setBio] = useState(currentBio || '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentDp);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 1. Upload DP if changed
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.profile.upload(formData);
      }

      // 2. Update Bio
      await api.profile.update({ bio });

      // Refresh profile data
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-[32px] p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, #181818 0%, #111 100%)`,
          border: `1px solid rgba(255,255,255,0.08)`,
          boxShadow: `0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-display font-black text-white mb-6">Edit Profile</h2>

        {/* DP Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-display font-black bg-black overflow-hidden relative"
              style={{ border: `2px solid rgba(255,255,255,0.1)` }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="DP preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/20"><CameraIcon className="w-8 h-8" /></span>
              )}
              
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="w-5 h-5 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
              </div>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <p className="text-[10px] text-white/30 font-mono mt-3 uppercase tracking-wider">Tap to upload photo</p>
        </div>

        {/* Bio Input */}
        <div className="mb-6">
          <label className="block text-[10px] font-mono text-white/40 uppercase tracking-wider font-bold mb-2">
            Bio / Status
          </label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none h-24"
            placeholder="Write something cool..."
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] font-mono text-white/30">{bio.length}/160</span>
          </div>
        </div>

        <WarzoneButton 
          variant="primary" 
          className="w-full py-3"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </WarzoneButton>
      </motion.div>
    </div>
  );
}
