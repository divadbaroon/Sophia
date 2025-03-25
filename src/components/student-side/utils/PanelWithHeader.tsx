import React from 'react';

interface PanelWithHeaderProps {
  children: React.ReactNode;
}

export const PanelWithHeader = ({ children }: PanelWithHeaderProps) => (
  <div className="h-full flex flex-col">
    <div className="h-24 bg-white -mt-1"></div>  
    <div className="flex-1">
      {children}
    </div>
  </div>
);