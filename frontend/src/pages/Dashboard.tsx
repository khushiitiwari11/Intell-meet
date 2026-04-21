import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Link as LinkIcon, Plus, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardActions() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  // Flow 1: Create a brand new meeting
  const handleCreateMeeting = () => {
    // Generate a short, random string for the meeting ID (e.g., 'a8f3-b9x1')
    const newMeetingId = Math.random().toString(36).substring(2, 10);

    // Optional: Copy the link to clipboard automatically for the host
    const meetingUrl = `${window.location.origin}/meeting/${newMeetingId}`;
    navigator.clipboard.writeText(meetingUrl);
    toast.success('Meeting link copied to clipboard!');

    // Push the user into the room
    navigate(`/meeting/${newMeetingId}`);
  };

  // Flow 2: Join an existing meeting
  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    // Clean up the input in case they pasted the full URL instead of just the ID
    const cleanId = joinCode.replace(`${window.location.origin}/meeting/`, '').trim();

    navigate(`/meeting/${cleanId}`);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Video className="text-blue-600" /> Start or Join a Meeting
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Create Meeting Button */}
        <div className="flex-1">
          <button
            onClick={handleCreateMeeting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Meeting
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Instantly generates a room and copies the invite link.
          </p>
        </div>

        <div className="hidden md:flex items-center text-gray-300">
          <div className="h-full w-px bg-gray-200"></div>
        </div>

        {/* Join Meeting Form */}
        <div className="flex-1">
          <form onSubmit={handleJoinMeeting} className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter code or link"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              Join
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Got an invite? Paste the link or code here.
          </p>
        </div>
      </div>
    </div>
  );
}