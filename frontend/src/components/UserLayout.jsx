import React from 'react';
import Sidebar from './Sidebar.jsx';
import './UserLayout.css';

export default function UserLayout({ children }) {
  return (
    <div className="eb-layout">
      <Sidebar />
      <div className="eb-layout-main">{children}</div>
    </div>
  );
}
