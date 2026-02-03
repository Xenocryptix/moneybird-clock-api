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

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {!activeEntry && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Select User</label>
        <select 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
        >
            <option value="">-- Select User --</option>
            {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
            ))}
        </select>
      </div>
      )}

      {selectedUserId && (
          <>
            {isLoading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
            ) : activeEntry ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-green-900">
                        {users.find(u => u.id === selectedUserId)?.name} is Clocked In
                    </h3>
                    <p className="text-sm text-green-700 mt-1">Started at: {new Date(activeEntry.started_at).toLocaleString()}</p>
                    <p className="text-sm text-green-700">Description: {activeEntry.description}</p>
                    <button
                        onClick={handleClockOut}
                        className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Clock Out
                    </button>
                </div>
            ) : (
                <form onSubmit={handleClockIn} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Project (Optional)</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
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
                        <label className="block text-sm font-medium text-gray-700">Contact (Optional)</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
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
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        Clock In
                    </button>
                </form>
            )}
          </>
      )}
    </div>
  );
}
