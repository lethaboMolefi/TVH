'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [view, setView] = useState('login'); // login, register, admin, coach, force-password
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEDICATED_COACH');
  const [msg, setMsg] = useState('');
  
  // Password Reset State
  const [newPassword, setNewPassword] = useState('');

  // Admin state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [interval, setReportingInterval] = useState(24);
  
  // Coach state
  const [teams, setTeams] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  // Note state
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('PUBLIC');
  const [noteTarget, setNoteTarget] = useState(''); // '' for team, or user_id for individual

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-api-ufen.onrender.com/api/v1';

  const api = async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/v1${path}`, { ...opts, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "API Error");
    return data;
  };

  const login = async () => {
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      setToken(data.token);
      setRole(data.role); // Store their actual role
      if (data.requires_password_change) {
        setView('force-password');
        setMsg("You must change your password before continuing.");
      } else {
        setMsg("Logged in successfully!");
        setView(data.role === 'ADMIN' ? 'admin' : 'coach');
      }
    } catch (err) { setMsg(err.message); }
  };

  const changePassword = async () => {
    try {
      await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password: password, new_password: newPassword }) });
      setMsg("Password changed successfully!");
      setView(role === 'ADMIN' ? 'admin' : 'coach');
    } catch (err) { setMsg(err.message); }
  };

  const register = async () => {
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, first_name: "New", last_name: "User", system_role: role }) });
      setMsg("Registered successfully! Awaiting Superadmin approval.");
      setView('login');
    } catch (err) { setMsg(err.message); }
  };

  const logout = () => {
    setToken('');
    setUsername('');
    setPassword('');
    setMsg('Logged out successfully.');
    setSnapshot(null);
    setTeams([]);
    setPendingUsers([]);
    setView('login');
  };

  const fetchAdminData = async () => {
    try {
      const pUsers = await api('/admin/users/pending');
      setPendingUsers(pUsers);
      const settings = await api('/admin/settings');
      setHasApiKey(settings.has_api_key);
      setReportingInterval(settings.reporting_interval_hours);
      const users = await api('/users');
      setAllUsers(users);
    } catch (err) { console.error(err); }
  };

  const updateSettings = async () => {
    try {
      await api('/admin/settings', { method: 'POST', body: JSON.stringify({ openai_api_key: apiKey || null, reporting_interval_hours: interval }) });
      setMsg("Settings saved!");
      fetchAdminData();
    } catch (err) { setMsg(err.message); }
  };

  const approveUser = async (id, is_active) => {
    try {
      await api(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) });
      fetchAdminData();
    } catch (err) { console.error(err); }
  };

  const fetchTeams = async () => {
    try {
      const t = await api('/teams');
      setTeams(t);
    } catch (err) { console.error(err); }
  };

  const fetchSnapshot = async (teamId) => {
    try {
      setMsg('');
      const data = await api(`/teams/${teamId}/snapshot`);
      setSnapshot(data);
      setNoteTarget('');
    } catch (err) { setSnapshot(null); setMsg(err.message); }
  };

  const addNote = async () => {
    if (!snapshot) return;
    try {
      const payload = {
        team_id: snapshot.team.id,
        content: noteContent,
        visibility: noteVisibility
      };
      if (noteTarget) payload.target_user_id = noteTarget;
      
      await api('/notes', { method: 'POST', body: JSON.stringify(payload) });
      setNoteContent('');
      fetchSnapshot(snapshot.team.id); // Refresh
    } catch (err) { setMsg(err.message); }
  };

  const generateInsight = async () => {
    if (!snapshot) return;
    try {
      setMsg("Generating AI Insight... please wait.");
      await api(`/teams/${snapshot.team.id}/insights`);
      setMsg("Insight generated!");
      fetchSnapshot(snapshot.team.id);
    } catch (err) { setMsg(err.message); }
  };

  useEffect(() => {
    if (view === 'admin') fetchAdminData();
    if (view === 'coach') fetchTeams();
  }, [view]);

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen text-gray-800 font-sans">
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-2 text-center md:text-left">Hackathon OS V2</h1>
      <p className="text-gray-500 mb-6 md:mb-8 font-medium border-b pb-4 text-center md:text-left text-sm md:text-base">AI-Powered Coaching & Analytics</p>

      {msg && <div className="mb-4 p-4 bg-yellow-100 text-yellow-900 rounded-md font-semibold shadow-sm border border-yellow-200 text-sm md:text-base">{msg}</div>}

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border max-w-md mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-6">System Login</h2>
          <input className="block w-full border border-gray-300 p-3 mb-4 rounded focus:ring-2 focus:ring-blue-500" placeholder="Username (e.g. Super1)" onChange={e => setUsername(e.target.value)} />
          <input className="block w-full border border-gray-300 p-3 mb-6 rounded focus:ring-2 focus:ring-blue-500" type="password" placeholder="Password (e.g. 161841)" onChange={e => setPassword(e.target.value)} />
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition" onClick={login}>Login</button>
            <button className="text-blue-600 hover:underline text-sm font-medium w-full sm:w-auto text-center" onClick={() => setView('register')}>Create Account</button>
          </div>
        </div>
      )}

      {/* FORCE PASSWORD RESET VIEW */}
      {view === 'force-password' && (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border max-w-md mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-red-600">Action Required</h2>
          <p className="mb-6 text-gray-600 text-sm">For security reasons, you must change your default password before accessing the system.</p>
          <input className="block w-full border border-gray-300 p-3 mb-4 rounded bg-gray-50 text-gray-500 cursor-not-allowed" type="password" value={password} disabled />
          <input className="block w-full border border-gray-300 p-3 mb-6 rounded focus:ring-2 focus:ring-red-500" type="password" placeholder="Enter New Password" onChange={e => setNewPassword(e.target.value)} />
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold w-full transition" onClick={changePassword}>Update Password</button>
        </div>
      )}

      {/* REGISTER VIEW */}
      {view === 'register' && (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border max-w-md mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Request Access</h2>
          <input className="block w-full border border-gray-300 p-3 mb-4 rounded" placeholder="Desired Username" onChange={e => setUsername(e.target.value)} />
          <input className="block w-full border border-gray-300 p-3 mb-4 rounded" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <select className="block w-full border border-gray-300 p-3 mb-6 rounded" onChange={e => setRole(e.target.value)}>
            <option value="DEDICATED_COACH">Dedicated Coach</option>
            <option value="COACH">Global Coach</option>
            <option value="ADMIN">Superadmin</option>
          </select>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold" onClick={register}>Submit Request</button>
            <button className="w-full sm:w-auto text-gray-500 hover:text-gray-800 text-center" onClick={() => setView('login')}>Cancel</button>
          </div>
        </div>
      )}

      {/* SUPERADMIN DASHBOARD */}
      {view === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded shadow-sm border gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-red-600">Superadmin Control Panel</h2>
            <button className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 w-full sm:w-auto rounded font-medium border" onClick={logout}>Logout</button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 md:p-6 rounded shadow-sm border">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                User Approvals <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{pendingUsers.length}</span>
              </h3>
              {pendingUsers.length === 0 ? <p className="text-gray-500 italic text-sm">No users awaiting approval.</p> : (
                <ul className="space-y-3">
                  {pendingUsers.map(u => (
                    <li key={u.id} className="p-4 bg-gray-50 border rounded-lg flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold block text-base">{u.username}</span>
                          <span className="font-mono text-[10px] sm:text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-wider">{u.system_role}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-sm font-medium transition" onClick={() => approveUser(u.id, true)}>Approve</button>
                        <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm font-medium transition" onClick={() => approveUser(u.id, false)}>Disable</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white p-4 md:p-6 rounded shadow-sm border h-fit">
              <h3 className="font-bold text-lg mb-4">System Settings (AI)</h3>
              
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-1">OpenAI API Key</label>
                {hasApiKey && <div className="mb-2 text-xs font-bold text-green-600 bg-green-50 p-2 rounded border border-green-200 block">✅ Key is Active</div>}
                <input className="w-full border p-2 md:p-3 rounded focus:ring-2 focus:ring-blue-500 text-sm" type="password" placeholder="sk-..." onChange={e => setApiKey(e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing key.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1">Coach Reporting Interval (Hours)</label>
                <input className="w-full border p-2 md:p-3 rounded focus:ring-2 focus:ring-blue-500 text-sm" type="number" value={interval} onChange={e => setReportingInterval(parseInt(e.target.value))} />
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold transition text-sm md:text-base" onClick={updateSettings}>Save Configuration</button>
            </div>

            {/* Create Team UI */}
            <div className="bg-white p-4 md:p-6 rounded shadow-sm border lg:col-span-2">
              <h3 className="font-bold text-lg mb-4">Create New Team</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Team Name</label>
                  <input id="admin-team-name" className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. Data Wizards" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Assign Global Coach</label>
                  <select id="admin-team-coach" className="w-full border p-2 rounded text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select Coach --</option>
                    {allUsers.filter(u => u.system_role === 'COACH').map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.username})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Project Idea Title</label>
                  <input id="admin-idea-title" className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. Smart Traffic System" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Problem Chosen</label>
                  <textarea id="admin-idea-problem" className="w-full border p-2 rounded text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500" placeholder="Describe the problem they are solving..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Proposed Solution</label>
                  <textarea id="admin-idea-solution" className="w-full border p-2 rounded text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500" placeholder="Describe how they propose to solve it..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">PowerPoint / Presentation Link</label>
                  <input id="admin-idea-link" className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500" placeholder="https://docs.google.com/presentation/..." />
                </div>
              </div>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition w-full md:w-auto"
                onClick={async () => {
                  const name = document.getElementById('admin-team-name').value;
                  const coach_id = document.getElementById('admin-team-coach').value;
                  const title = document.getElementById('admin-idea-title').value;
                  const problem = document.getElementById('admin-idea-problem').value;
                  const solution = document.getElementById('admin-idea-solution').value;
                  const link = document.getElementById('admin-idea-link').value;
                  
                  if (!name || !coach_id || !title || !problem || !solution) {
                    return setMsg("Please fill in all required team and idea fields.");
                  }
                  
                  try {
                    await api('/teams', {
                      method: 'POST',
                      body: JSON.stringify({
                        name,
                        coach_id,
                        idea: { title, problem_statement: problem, proposed_solution: solution, presentation_link: link || null }
                      })
                    });
                    setMsg("Team and idea created successfully!");
                    document.getElementById('admin-team-name').value = '';
                    document.getElementById('admin-idea-title').value = '';
                    document.getElementById('admin-idea-problem').value = '';
                    document.getElementById('admin-idea-solution').value = '';
                    document.getElementById('admin-idea-link').value = '';
                  } catch (e) {
                    setMsg(e.message);
                  }
                }}
              >
                Create Team & Idea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COACH / DEDICATED COACH DASHBOARD */}
      {view === 'coach' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded shadow-sm border border-purple-100 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-purple-700">Coach Workspace</h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-mono bg-purple-50 text-purple-700 px-3 py-2 sm:py-1 rounded-full border border-purple-200 text-center">Role: {role}</span>
              <button className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 sm:py-1 rounded font-medium border w-full sm:w-auto" onClick={logout}>Logout</button>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4 shadow-sm">
              <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">⚠️ Reporting Alerts</h3>
              <ul className="space-y-1">
                {alerts.map((a, i) => (
                  <li key={i} className="text-red-700 text-sm font-medium">• {a}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team List Sidebar */}
            <div className="lg:col-span-1 bg-white p-4 md:p-5 rounded shadow-sm border h-fit order-first">
              <h3 className="font-bold text-lg mb-3">Available Teams</h3>
              <ul className="space-y-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2 lg:gap-0 snap-x">
                {teams.map(t => (
                  <li key={t.id} onClick={() => fetchSnapshot(t.id)} className="p-3 bg-gray-50 hover:bg-purple-50 border rounded-lg cursor-pointer transition flex justify-between items-center group min-w-[200px] lg:min-w-0 snap-center shrink-0">
                    <span className="font-semibold text-gray-800 text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">{t.name}</span>
                    <span className="text-purple-300 group-hover:text-purple-600 hidden lg:inline">&rarr;</span>
                  </li>
                ))}
                {teams.length === 0 && <p className="text-gray-400 text-sm italic w-full text-center lg:text-left">No teams available.</p>}
              </ul>
            </div>
            
            {/* Main Snapshot Area */}
            <div className="lg:col-span-2">
              {!snapshot ? (
                <div className="bg-white p-8 md:p-12 text-center rounded shadow-sm border text-gray-400 text-sm md:text-base">
                  Select a team to view their workspace, notes, and AI insights.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overview Card */}
                  <div className="bg-white p-4 md:p-6 rounded shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">{snapshot.team.name}</h3>
                      </div>
                      <button onClick={generateInsight} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center justify-center gap-2">
                        ✨ Analyze Team
                      </button>
                    </div>

                    {/* Idea Section */}
                    {snapshot.team.idea && (
                      <div className="bg-white p-4 rounded shadow-sm border mb-6 border-blue-200">
                        <h3 className="font-bold text-lg text-blue-800 mb-2">Project Idea: {snapshot.team.idea.title}</h3>
                        <div className="mt-2">
                          <p className="font-semibold text-sm text-gray-700">Problem Chosen:</p>
                          <p className="text-gray-600 mt-1 whitespace-pre-wrap text-sm">{snapshot.team.idea.problem_statement}</p>
                        </div>
                        <div className="mt-3 border-t pt-2 border-blue-100">
                          <p className="font-semibold text-sm text-gray-700">Proposed Solution:</p>
                          <p className="text-gray-600 mt-1 whitespace-pre-wrap text-sm">{snapshot.team.idea.proposed_solution}</p>
                        </div>
                        {snapshot.team.idea.presentation_link && (
                          <div className="mt-3 border-t pt-2 border-blue-100">
                            <p className="font-semibold text-sm text-gray-700">Presentation:</p>
                            <a href={snapshot.team.idea.presentation_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                              {snapshot.team.idea.presentation_link}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manage Team Members (Dedicated Coach only) */}
                    {role === 'DEDICATED_COACH' && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <h4 className="font-bold text-sm text-gray-700 mb-3">Add Team Member</h4>
                        <div className="flex flex-col sm:flex-row gap-2 items-center flex-wrap">
                          <input id="new-member-first" className="border p-2 rounded text-sm w-full sm:w-[48%]" placeholder="First Name" />
                          <input id="new-member-last" className="border p-2 rounded text-sm w-full sm:w-[48%]" placeholder="Last Name" />
                          <input id="new-member-username" className="border p-2 rounded text-sm w-full sm:w-[48%]" placeholder="Username" />
                          <input id="new-member-password" type="password" className="border p-2 rounded text-sm w-full sm:w-[48%]" placeholder="Temp Password" />
                          <input id="new-member-role" className="border p-2 rounded text-sm w-full" placeholder="Role (e.g. Designer)" />
                          <button 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold w-full transition mt-2"
                            onClick={async () => {
                              const first = document.getElementById('new-member-first').value;
                              const last = document.getElementById('new-member-last').value;
                              const username = document.getElementById('new-member-username').value;
                              const password = document.getElementById('new-member-password').value;
                              const teamRole = document.getElementById('new-member-role').value;
                              if (!first || !last || !teamRole || !username || !password) return setMsg("Please fill in all member fields.");
                              try {
                                await api(`/teams/${snapshot.team.id}/participants`, {
                                  method: 'POST',
                                  body: JSON.stringify({ first_name: first, last_name: last, team_role: teamRole, username, password })
                                });
                                document.getElementById('new-member-first').value = '';
                                document.getElementById('new-member-last').value = '';
                                document.getElementById('new-member-username').value = '';
                                document.getElementById('new-member-password').value = '';
                                document.getElementById('new-member-role').value = '';
                                fetchSnapshot(snapshot.team.id);
                              } catch (e) { setMsg(e.message); }
                            }}
                          >
                            + Add Member
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Insight Display */}
                    {snapshot.ai_insight && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-inner">
                        <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2 text-sm md:text-base">
                          <span>🤖</span> AI Coach Insight
                        </h4>
                        <p className="text-blue-900 text-sm whitespace-pre-wrap leading-relaxed">{snapshot.ai_insight.content}</p>
                        <p className="text-xs text-blue-400 mt-2 font-mono">Generated: {new Date(snapshot.ai_insight.created_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes & Team Members Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Write Note Section */}
                    <div className="bg-white p-4 md:p-5 rounded shadow-sm border flex flex-col">
                      <h4 className="font-bold text-lg mb-3">Add a Note</h4>
                      <select className="border p-2 rounded mb-3 bg-gray-50 text-sm font-medium w-full" value={noteTarget} onChange={e => setNoteTarget(e.target.value)}>
                        <option value="">Target: Entire Team</option>
                        <optgroup label="Individuals">
                          {snapshot.team.members.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.team_role || 'Hacker'})</option>
                          ))}
                        </optgroup>
                      </select>
                      
                      <textarea 
                        className="border p-3 rounded mb-3 w-full min-h-[100px] resize-y focus:ring-2 focus:ring-purple-500 text-sm" 
                        placeholder="Write your observation or feedback..."
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                      />
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                        <select className="border p-2 rounded bg-gray-50 text-sm font-medium w-full sm:w-1/2" value={noteVisibility} onChange={e => setNoteVisibility(e.target.value)}>
                          <option value="PUBLIC">Public (All Coaches)</option>
                          <option value="PRIVATE">Private (Only Me)</option>
                        </select>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold w-full sm:w-1/2 transition text-sm" onClick={addNote}>Post Note</button>
                      </div>
                    </div>

                    {/* View Notes Section */}
                    <div className="bg-white p-4 md:p-5 rounded shadow-sm border max-h-[500px] overflow-y-auto">
                      <h4 className="font-bold text-lg mb-4 sticky top-0 bg-white pb-2 border-b">Recent Notes</h4>
                      {snapshot.notes.length === 0 ? <p className="text-gray-400 italic text-sm">No notes have been added yet.</p> : (
                        <div className="space-y-4">
                          {snapshot.notes.map(n => {
                            const isPrivate = n.visibility === 'PRIVATE';
                            const targetMember = snapshot.team.members.find(m => m.id === n.target_user_id);
                            return (
                              <div key={n.id} className={`p-3 md:p-4 rounded-lg border text-sm ${isPrivate ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                                  <span className={`font-bold text-[10px] md:text-xs px-2 py-0.5 rounded ${isPrivate ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                                    {isPrivate ? 'PRIVATE' : 'PUBLIC'}
                                  </span>
                                  {targetMember && <span className="text-[10px] md:text-xs font-mono text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded break-all">@{targetMember.name}</span>}
                                </div>
                                <p className="text-gray-800 text-sm whitespace-pre-wrap">{n.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
