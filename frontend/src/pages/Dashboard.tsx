import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';
import { Video, Calendar, Clock, LogOut, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Meeting {
  _id: string;
  title: string;
  description: string;
  scheduledAt: string;
  host: { _id: string; name: string };
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch meetings when the dashboard loads
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await axiosInstance.get('/meetings');
        setMeetings(response.data);
      } catch (error) {
        console.error('Failed to load meetings:', error);
        toast.error('Failed to load your meetings');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async () => {
    try {
      const response = await axiosInstance.post('/meetings', {
        title: `${user?.name}'s Quick Meeting`,
        description: 'Instant meeting room',
        scheduledAt: new Date().toISOString()
      });
      // Navigate straight into the new meeting room
      navigate(`/meeting/${response.data._id}`);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast.error('Failed to create meeting');
    }
  };
  const response = await axios.post(
  'https://intell-meet.onrender.com/api/meetings/create', // Full URL
  { title: "New Meeting" }, // or whatever data you send
  { withCredentials: true } // THIS IS THE KEY!
);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Video className="text-blue-600" size={28} />
            <span className="text-xl font-bold text-gray-900">IntellMeet</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your upcoming and past meetings.</p>
          </div>
          <button 
            onClick={handleCreateMeeting}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all active:scale-95"
          >
            <Plus size={20} />
            New Meeting
          </button>
        </div>

        {/* Meetings Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-500"/> Meeting History
          </h2>
          
          {loading ? (
            <div className="text-center py-10 text-gray-400 animate-pulse">Loading your meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Video className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600 font-medium">No meetings found.</p>
              <p className="text-gray-400 text-sm mt-1">Click 'New Meeting' to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((meeting) => (
                <div key={meeting._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                  <h3 className="font-bold text-gray-800 truncate">{meeting.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <Clock size={16} />
                    <span>{new Date(meeting.scheduledAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => navigate(`/meeting/${meeting._id}`)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md"
                    >
                      Rejoin Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}