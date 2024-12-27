import Image from 'next/image'

interface User {
  name: string;
  username: string;
  image?: string;
}

const COLORS = {
  CARD_BG: 'rgba(26, 26, 31, 0.7)',
};

export function ProfileHeader({ user }: { user: User }) {
  return (
    <div 
      className="backdrop-blur-md rounded-lg shadow-lg border border-opacity-10 border-white p-6 mb-6"
      style={{ background: COLORS.CARD_BG }}
    >
      <div className="flex items-center space-x-6">
        {user.image && (
          <div className="relative">
            <Image
              src={user.image}
              alt={`${user.name}'s profile`}
              width={80}
              height={80}
              className="rounded-full border-2 border-strava-orange"
            />
            <div className="absolute inset-0 rounded-full bg-strava-orange opacity-0 hover:opacity-10 transition-opacity" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-strava-light">{user.name}</h1>
          <p className="text-strava-light opacity-80">@{user.username}</p>
        </div>
      </div>
    </div>
  )
} 