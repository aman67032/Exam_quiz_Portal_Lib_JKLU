import React from 'react';

const MaintenanceMode: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] p-6">
      <div className="max-w-md w-full editorial-card rounded-lg p-8 text-center space-y-3">
        <span className="font-mono-tabular text-xs uppercase text-[#E04F33]">
          SCHEDULED UPGRADE
        </span>
        <h1 className="text-2xl font-semibold">Learn JKLU is updating</h1>
        <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
          The archive will be back online shortly.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMode;
