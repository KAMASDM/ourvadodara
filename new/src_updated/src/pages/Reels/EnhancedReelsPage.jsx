// =============================================
// src/pages/Reels/EnhancedReelsPage.jsx
// Vertical snap-scroll reels. IntersectionObserver for play/pause,
// side action rail, progress bar, swipe hint.
// =============================================
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, MapPin, ArrowLeft } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

const Reel = memo(function Reel({ reel, active, muted, onToggleMute, onLike, onSave, onShare, onComment, isLiked, isSaved }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (active) { v.currentTime = 0; v.play().catch(()=>{}); setPaused(false); }
    else        { v.pause(); }
  }, [active]);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime = () => setProgress((v.currentTime / (v.duration || 1)) * 100);
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  }, []);

  return (
    <section className="relative h-[100dvh] w-full snap-start snap-always bg-black grid place-items-center overflow-hidden" aria-label={reel.title}>
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.thumbnail}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          onClick={togglePlay}
        />
      ) : (
        <img src={reel.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none" />

      {paused && (
        <button type="button" onClick={togglePlay} className="absolute inset-0 grid place-items-center" aria-label="Play">
          <span className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm grid place-items-center">
            <Play className="w-10 h-10 text-white fill-white" />
          </span>
        </button>
      )}

      {/* Progress */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20">
        <div className="h-full bg-white transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-10">
        <ActionBtn icon={<Heart className="w-6 h-6" fill={isLiked ? '#ef4444' : 'none'} />} count={reel.likes} label="Like" active={isLiked} onClick={() => onLike?.(reel.id)} />
        <ActionBtn icon={<MessageCircle className="w-6 h-6" />} count={reel.comments} label="Comment" onClick={() => onComment?.(reel.id)} />
        <ActionBtn icon={<Share2 className="w-6 h-6" />} label="Share" onClick={() => onShare?.(reel)} />
        <ActionBtn icon={<Bookmark className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} />} label="Save" active={isSaved} onClick={() => onSave?.(reel.id)} />
        <button type="button" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur grid place-items-center text-white active:scale-95 transition-transform">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Caption */}
      <div className="absolute left-0 right-16 bottom-6 px-5 text-white z-10">
        <div className="flex items-center gap-2 mb-2">
          <img src={reel.author?.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-white object-cover bg-neutral-600" />
          <span className="font-bold text-sm">{reel.author?.name || 'Our Vadodara'}</span>
          <button type="button" className="ml-1 px-3 py-1 rounded-full border border-white/70 text-xs font-semibold hover:bg-white hover:text-black transition-colors">
            Follow
          </button>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-balance">{reel.title}</h3>
        {reel.location && (
          <div className="mt-1.5 flex items-center gap-1 text-xs opacity-90">
            <MapPin className="w-3.5 h-3.5" />{reel.location}
          </div>
        )}
      </div>
    </section>
  );
});

const ActionBtn = memo(function ActionBtn({ icon, count, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className="flex flex-col items-center gap-0.5 text-white active:scale-90 transition-transform">
      <span className={`w-11 h-11 rounded-full grid place-items-center ${active ? 'bg-white/20' : 'bg-white/10 backdrop-blur'}`}>
        {icon}
      </span>
      {count != null && <span className="text-2xs font-semibold tabular-nums">{formatNumber(count)}</span>}
    </button>
  );
});

export default function EnhancedReelsPage({ reels = [], onBack, likedIds = new Set(), savedIds = new Set(), onLike, onSave, onShare, onComment }) {
  const rootRef = useRef(null);
  const [activeId, setActiveId] = useState(reels[0]?.id);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio > 0.7) setActiveId(e.target.dataset.id); });
    }, { root, threshold: [0.7] });
    root.querySelectorAll('[data-id]').forEach(n => io.observe(n));
    return () => io.disconnect();
  }, [reels]);

  return (
    <div className="fixed inset-0 bg-black z-50">
      <button type="button" onClick={onBack} aria-label="Back"
        className="absolute top-3 left-3 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur grid place-items-center text-white">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div ref={rootRef} className="snap-y h-full overflow-y-scroll scrollbar-hide">
        {reels.map((r) => (
          <div key={r.id} data-id={r.id}>
            <Reel
              reel={r}
              active={activeId === r.id}
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
              isLiked={likedIds.has(r.id)}
              isSaved={savedIds.has(r.id)}
              onLike={onLike} onSave={onSave} onShare={onShare} onComment={onComment}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
