/**
 * Animasi masuk bertahap tanpa JavaScript animasi.
 * Ringan: hanya opacity + transform, dimatikan otomatis saat reduced motion.
 */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} data-stagger>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ? `stagger-item ${className}` : "stagger-item"}>{children}</div>;
}
