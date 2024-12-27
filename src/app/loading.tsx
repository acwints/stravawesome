import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const COLORS = {
  DARK: '#100333',    // Dark purple
  DARKER: '#0A0221',  // Darker purple for gradient
};

export default function Loading() {
  return (
    <div style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`,
      minHeight: '100vh'
    }}>
      <Header />
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-strava-orange"></div>
          <p className="text-strava-light opacity-80">Loading your activities...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
} 