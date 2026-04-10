import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { Video, CalendarPlus, LogOut, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Meeting {
  _id: string;
  title: string;
  scheduledAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch user's meetings on load
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await axiosInstance.get('/meetings');
        setMeetings(response.data);
      } catch (error) {
        toast.error('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    try {
      const response = await axiosInstance.post('/meetings', { title });
      setMeetings([response.data, ...meetings]);
      setTitle('');
      toast.success('Meeting scheduled!');
    } catch (error) {
      toast.error('Failed to schedule meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-blue-600">
          <Video size={28} />
          <span className="text-xl font-bold">IntellMeet</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-700">Hi, {user?.name}</span>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Create Meeting Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CalendarPlus className="mr-2 text-blue-600" size={20} />
              Schedule New Meeting
            </h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <input
                type="text"
                placeholder="Meeting Topic (e.g., Q3 Strategy)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
              >
                {creating ? <Loader2 className="animate-spin" size={20} /> : 'Create Meeting'}
              </button>
            </form>
          </div>

          {/* Meeting List */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Upcoming Meetings</h2>
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : meetings.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                No meetings scheduled yet. Create one to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{meeting.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate(`/meeting/${meeting._id}`)}
                      className="px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition"
                    >
                      Join Room
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}