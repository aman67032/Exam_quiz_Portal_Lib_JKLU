import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { API } from '@/utils/api';

interface AuthenticatedUploadPreviewProps {
  filePath: string;
  alt: string;
  isPdf?: boolean;
}

const AuthenticatedUploadPreview: React.FC<AuthenticatedUploadPreviewProps> = ({
  filePath,
  alt,
  isPdf,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const base = filePath.split('/').pop() || filePath;

    setBlobUrl(null);
    setFailed(false);

    API.client
      .get(`/uploads/${encodeURIComponent(base)}`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filePath]);

  if (failed) {
    return (
      <div className="w-full h-64 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
        Error
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="w-full h-64 bg-[#FAF9F6] dark:bg-[#0A0A0C]/60 rounded-lg flex items-center justify-center border border-[#E5E2DC] dark:border-[#232329] text-xs text-[#5C5B57] dark:text-[#94938E]">
        Loading...
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full h-64 bg-[#FAF9F6] dark:bg-[#0A0A0C]/60 rounded-lg flex flex-col items-center justify-center border border-[#E5E2DC] dark:border-[#232329] gap-2">
        <Eye className="h-12 w-12 text-[#896ABD]" />
        <p className="text-xs font-medium text-[#5C5B57] dark:text-[#94938E]">PDF Document</p>
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#896ABD] dark:text-[#C084FC] underline"
        >
          View PDF
        </a>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className="w-full h-auto rounded-lg object-cover border border-[#E5E2DC] dark:border-[#232329] max-h-96"
      onError={() => setFailed(true)}
    />
  );
};

export default AuthenticatedUploadPreview;
