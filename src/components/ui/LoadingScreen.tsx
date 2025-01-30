import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="flex flex-col items-center gap-4 fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50"></div>
          <Loader2 className="h-12 w-12 animate-spin-slow text-indigo-600 relative" />
        </div>
        <p className="text-sm font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
}