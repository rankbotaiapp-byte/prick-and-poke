// Change these two constants once and every avatar in the app updates.
export const HALO_GRADIENT = 'linear-gradient(160deg,#9fb83a,#e0a33a 40%,#e8763a 70%,#d95a8a)';
export const HALO_GLOW = 'rgba(232,118,58,.45)';

export default function HaloAvatar({ src, name = '', size = 72 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="rounded-full shrink-0"
      style={{ width: size, height: size, padding: 3, background: HALO_GRADIENT, boxShadow: `0 0 14px ${HALO_GLOW}` }}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center">
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-zinc-400 font-bold" style={{ fontSize: size / 3 }}>{initials || '?'}</span>
        )}
      </div>
    </div>
  );
}
