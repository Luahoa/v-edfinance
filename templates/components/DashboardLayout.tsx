import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

export default function DashboardLayout({ children, sidebar, header }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <header>{header}</header>
      <div className="content-wrapper">
        <aside>{sidebar}</aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
