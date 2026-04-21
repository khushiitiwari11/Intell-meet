import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // Zidio Recommended State 
import axios from 'axios';
import { CheckCircle, FileText, List } from 'lucide-react';

export default function MeetingDetail() {
  const { id } = useParams();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => axios.get(`https://intell-meet.onrender.com/api/meetings/${id}`, { withCredentials: true }).then(res => res.data)
  });

  if (isLoading) return <div className="p-10 text-center">Analysing Meeting Data...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
      
      {/* AI Summary Section  */}
      <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h2 className="flex items-center gap-2 text-blue-800 font-bold mb-3">
          <FileText size={20}/> AI Smart Summary
        </h2>
        <p className="text-gray-700 leading-relaxed">{meeting.summary}</p>
      </section>

      {/* Action Items Section [cite: 42, 122] */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="flex items-center gap-2 text-gray-800 font-bold mb-4">
          <List size={20} className="text-green-500" /> Action Items
        </h2>
        <ul className="space-y-3">
          {meeting.actionItems.map((item: any, idx: number) => (
            <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle size={18} className="text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{item.task}</p>
                <p className="text-xs text-gray-500">Owner: {item.owner} • Due: {item.dueDate}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}