import Image from 'next/image';

interface BuddyAvatarProps {
  displayName?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BuddyAvatar = ({ displayName, avatarUrl, size = 'md' }: BuddyAvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const dimensions = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '?';

  return (
    <div
      className={`relative inline-block ${sizeClasses[size]} rounded-full bg-blue-100 flex items-center justify-center border-2 border-white overflow-hidden`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName || 'Avatar'}
          width={dimensions[size]}
          height={dimensions[size]}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-blue-600">{initials}</span>
      )}
    </div>
  );
};
