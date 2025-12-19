interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
}: ButtonProps) {
  // Tailwind classes based on variant and size
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
