import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useAuthStore } from '../../stores/authStore';
import WarzoneButton from '../ui/WarzoneButton';
import { RivalryEmblem } from '../ui/RivalryLogo';

export default function ProfileScorecard() {
  const user = useAuthStore((s) => s.user);
  const scorecardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!user) return null;

  const handleDownload = async () => {
    if (!scorecardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(scorecardRef.current, {
        backgroundColor: '#000000',
        scale: 2, // High resolution
        useCORS: true,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `rivalry-card-${user.username}.png`;
      link.click();
    } catch (e) {
      console.error('Failed to generate scorecard', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Target Div for HTML2Canvas */}
      <div 
        ref={scorecardRef} 
        className="relative w-[320px] h-[500px] rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-[#0F1115] flex flex-col items-center justify-between p-6"
      >
        {/* Background Haze */}
        <div className="absolute top-0 inset-x-0 h-[60%] bg-gradient-to-b from-yellow-500/20 to-transparent blur-xl pointer-events-none" />

        {/* Header Ribbon */}
        <div className="z-10 w-full flex justify-between items-center bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <RivalryEmblem size={24} />
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Season 2026</span>
        </div>

        {/* Central Identity */}
        <div className="z-10 flex flex-col items-center w-full mt-4">
          <div className="w-24 h-24 bg-white/5 border border-white/20 rounded-full flex items-center justify-center text-4xl shadow-inner mb-4">
            🏏
          </div>
          <h2 className="text-2xl font-black font-display text-white uppercase tracking-wider">{user.username}</h2>
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full mt-2">
            {user.rank}
          </span>
        </div>

        {/* Army Logo & Name */}
        <div className="z-10 flex flex-col items-center mt-4 border-t border-white/10 pt-4 w-full">
          <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Allegiance</span>
          <img src={`/teams/${(typeof user.army === 'string' ? user.army : user.army?.name || '').toLowerCase()}.png`} alt={typeof user.army === 'string' ? user.army : user.army?.name || ''} className="w-12 h-12 object-contain filter drop-shadow-md brightness-110" />
          <h3 className="text-lg font-bold text-white uppercase mt-2">{typeof user.army === 'string' ? user.army : user.army?.name || ''} ARMY</h3>
        </div>

        {/* Bottom Stats */}
        <div className="z-10 flex w-full justify-between items-center bg-white/5 rounded-2xl p-4 mt-4 border border-white/10">
          <div className="text-center flex-1 border-r border-white/10">
            <span className="block text-2xl font-black text-white">{user.totalWarPoints || 0}</span>
            <span className="block text-[8px] uppercase tracking-widest text-white/40 mt-1">War Points</span>
          </div>
          <div className="text-center flex-1">
            <span className="block text-xl font-bold text-white opacity-80">🔥</span>
            <span className="block text-[8px] uppercase tracking-widest text-white/40 mt-1">Reputation</span>
          </div>
        </div>
      </div>

      <WarzoneButton onClick={handleDownload} loading={downloading} className="shadow-orange-500/20 shadow-lg px-8">
        Download & Share
      </WarzoneButton>
      <p className="text-white/40 text-[10px] max-w-[280px] text-center">
        Show off your stats on WhatsApp and Instagram to recruit more soldiers.
      </p>
    </div>
  );
}
