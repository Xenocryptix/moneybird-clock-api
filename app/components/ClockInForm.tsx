'use client';

import { useState, useEffect } from 'react';
import { clockIn, clockOut, getActiveEntry } from '../actions';

interface User {
  id: string;
  name: string;
}

interface Project {
  id: string; // usually string in Moneybird
  name: string; 
}

interface Contact {
  id: string;
  company_name: string;
  firstname: string;
  lastname: string;
}

interface Props {
  users: User[];
  projects: Project[];
  contacts: Contact[];
}

export default function ClockInForm({ users, projects, contacts }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [contactId, setContactId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState<any>(null);

  // Load saved user from local storage
  useEffect(() => {
    const saved = localStorage.getItem('moneybird_user_id');
    console.log('[Client] Loaded saved user ID from localStorage:', saved);
    if (saved && users.some(u => String(u.id) === saved)) {
        console.log('[Client] Found matching user in list, setting selectedUserId:', saved);
        setSelectedUserId(saved);
    } else {
        console.log('[Client] No matching saved user or user list empty. Users count:', users.length);
        if (users.length > 0) {
           console.log('[Client] First user ID type:', typeof users[0].id, 'Value:', users[0].id);
        }
    }
  }, [users]);

  // Fetch active entry when user changes
  useEffect(() => {
    async function checkActive() {
        if (!selectedUserId) {
            console.log('[Client] No selectedUserId, skipping checkActive');
            return;
        }
        console.log('[Client] Calling getActiveEntry for:', selectedUserId);
        setIsLoading(true);
        try {
            const entry = await getActiveEntry(selectedUserId);
            console.log('[Client] getActiveEntry result:', entry);
            setActiveEntry(entry);
        } catch (error) {
            console.error('[Client] Error fetching active entry:', error);
        } finally {
            setIsLoading(false);
        }
    }
    checkActive();
    if (selectedUserId) {
      localStorage.setItem('moneybird_user_id', selectedUserId);
    }
  }, [selectedUserId]);

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsLoading(true);
    try {
        const newEntry = await clockIn(selectedUserId, description, projectId || null, contactId || null);
        setActiveEntry(newEntry);
        setDescription('');
        setProjectId('');
        setContactId('');
    } catch (err) {
        alert('Failed to clock in');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;
    setIsLoading(true);
    try {
        await clockOut(activeEntry.id, selectedUserId);
        setActiveEntry(null);
    } catch (err) {
        alert('Failed to clock out');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  if (!users || users.length === 0) {
      return <div>No users found. Check API/Permissions.</div>;
  }

  const getContactName = (c: Contact) => {
      const names = [c.company_name, c.firstname, c.lastname].filter(Boolean);
      return names.join(' ').trim() || c.id;
  };

  const handleSwitchUser = () => {
    setSelectedUserId('');
    setProjectId('');
    setContactId('');
    setDescription('');
    setActiveEntry(null);
    localStorage.removeItem('moneybird_user_id');
  };

  if (!selectedUserId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Who is clocking in?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {users.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => {
                console.log('[Client] User clicked:', u);
                setSelectedUserId(String(u.id));
              }}
              className="aspect-square flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-800 shadow-sm"
            >
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-center break-words w-full">
                {u.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* User Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">
          Hi, {users.find((u) => String(u.id) === selectedUserId)?.name}
        </h3>
        <button
          onClick={handleSwitchUser}
          className="text-sm text-gray-500 hover:text-blue-600 font-medium"
        >
          Switch User
        </button>
      </div>

      {isLoading ? (
         <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         </div>
      ) : activeEntry ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
            <h3 className="text-lg font-medium text-green-900">
               Clocked In
            </h3>
            <p className="text-sm text-green-700 mt-2">Started at: {new Date(activeEntry.started_at).toLocaleString()}</p>
            <p className="text-sm text-green-700 mt-1">Description: {activeEntry.description}</p>
            <button
                onClick={handleClockOut}
                className="mt-6 w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
                Clock Out
            </button>
        </div>
      ) : (
        <form onSubmit={handleClockIn} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                    type="text"
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What are you working on?"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project (Optional)</label>
                <select
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                >
                    <option value="">-- None --</option>
                    {projects && projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option> 
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Optional)</label>
                <select
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    value={contactId}
                    onChange={e => setContactId(e.target.value)}
                >
                    <option value="">-- None --</option>
                    {contacts && contacts.map(c => (
                        <option key={c.id} value={c.id}>{getContactName(c)}</option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors mt-2"
            >
                Clock In
            </button>
        </form>
      )}
    </div>
  );
}
