import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageCircle, Send, Plus, Search, Users, User, Paperclip, Image,
  FileText, X, ArrowLeft, Check, CheckCheck, Smile
} from 'lucide-react';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass } from '../components/Modal';

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchRooms, setSearchRooms] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  // Load rooms
  const loadRooms = useCallback(() => {
    api.get('/chat/rooms').then(res => { setRooms(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  // Poll for new messages
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadRooms();
      if (activeRoom) loadMessages(activeRoom.id);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeRoom, loadRooms]);

  const loadMessages = (roomId) => {
    api.get(`/chat/rooms/${roomId}/messages`).then(res => setMessages(res.data || [])).catch(console.error);
  };

  const openRoom = (room) => {
    setActiveRoom(room);
    loadMessages(room.id);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Send message
  const handleSend = async () => {
    if ((!newMsg.trim()) || !activeRoom) return;
    setSending(true);
    try {
      await api.post(`/chat/rooms/${activeRoom.id}/messages`, { message: newMsg.trim() });
      setNewMsg('');
      loadMessages(activeRoom.id);
      loadRooms();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // File upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB'); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.post('/chat/upload', { data: reader.result, name: file.name, type: file.type });
        await api.post(`/chat/rooms/${activeRoom.id}/messages`, {
          message: `📎 ${file.name}`,
          file_url: res.url,
          file_name: file.name,
          file_type: file.type,
        });
        loadMessages(activeRoom.id);
        loadRooms();
      } catch (err) { alert('Gagal upload: ' + (err.message || 'Error')); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start new direct chat
  const startDirectChat = async (targetUser) => {
    try {
      const res = await api.post('/chat/rooms', { type: 'direct', member_ids: [targetUser.id] });
      setShowNewChat(false);
      loadRooms();
      setTimeout(() => {
        const room = { id: res.id, display_name: targetUser.name, type: 'direct', members: [{ user_id: targetUser.id, name: targetUser.name }] };
        openRoom(room);
      }, 300);
    } catch (e) { alert('Gagal: ' + (e.message || 'Error')); }
  };

  // Create group
  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    try {
      const res = await api.post('/chat/rooms', { type: 'group', name: groupName, member_ids: selectedMembers });
      setShowNewGroup(false); setGroupName(''); setSelectedMembers([]);
      loadRooms();
      openRoom({ id: res.id, display_name: groupName, type: 'group' });
    } catch (e) { alert('Gagal: ' + (e.message || 'Error')); }
  };

  const loadAllUsers = () => { api.get('/chat/users').then(res => setAllUsers(res.data || [])).catch(console.error); };
  useEffect(() => { loadAllUsers(); }, []);

  const filteredRooms = rooms.filter(r => !searchRooms || (r.display_name || '').toLowerCase().includes(searchRooms.toLowerCase()));
  const filteredUsers = allUsers.filter(u => !searchUsers || u.name.toLowerCase().includes(searchUsers.toLowerCase()));

  const formatTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const isImage = (type) => type && type.startsWith('image/');

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* ── Sidebar: Room List ── */}
      <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col shrink-0 ${activeRoom ? 'hidden sm:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><MessageCircle size={20} className="text-blue-500" /> Chat</h2>
            <div className="flex gap-1">
              <button onClick={() => { setShowNewChat(true); loadAllUsers(); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors" title="Chat Baru"><Plus size={18} /></button>
              <button onClick={() => { setShowNewGroup(true); loadAllUsers(); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors" title="Grup Baru"><Users size={18} /></button>
            </div>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchRooms} onChange={e => setSearchRooms(e.target.value)} placeholder="Cari percakapan..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all" />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada percakapan</p>
              <button onClick={() => setShowNewChat(true)} className="mt-3 text-blue-500 text-sm font-medium hover:text-blue-700">Mulai Chat Baru</button>
            </div>
          ) : filteredRooms.map(room => (
            <button key={room.id} onClick={() => openRoom(room)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeRoom?.id === room.id ? 'bg-blue-50' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${room.type === 'group' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {room.type === 'group' ? <Users size={16} /> : (room.display_name?.[0] || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 truncate">{room.display_name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTime(room.last_message_at)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {room.last_sender && room.type === 'group' ? `${room.last_sender}: ` : ''}{room.last_message || 'Belum ada pesan'}
                  </p>
                  {room.unread > 0 && <span className="w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shrink-0 ml-2">{room.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main: Chat Area ── */}
      <div className={`flex-1 flex flex-col ${!activeRoom ? 'hidden sm:flex' : 'flex'}`}>
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Pilih percakapan untuk mulai chat</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-16 px-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <button onClick={() => setActiveRoom(null)} className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></button>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${activeRoom.type === 'group' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {activeRoom.type === 'group' ? <Users size={14} /> : (activeRoom.display_name?.[0] || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{activeRoom.display_name}</div>
                <div className="text-[11px] text-gray-400">
                  {activeRoom.type === 'group' ? `${activeRoom.members?.length || 0} anggota` : 'Online'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">Belum ada pesan. Mulai percakapan!</div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user.id;
                const showAvatar = !isMine && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isMine && showAvatar && (
                      <div className="w-7 h-7 rounded-lg bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-auto">
                        {msg.sender_name?.[0] || '?'}
                      </div>
                    )}
                    {!isMine && !showAvatar && <div className="w-7 shrink-0" />}
                    <div className={`max-w-[70%] ${isMine ? 'order-1' : ''}`}>
                      {!isMine && showAvatar && activeRoom.type === 'group' && (
                        <div className="text-[10px] text-gray-400 mb-0.5 ml-1 font-medium">{msg.sender_name}</div>
                      )}
                      <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-blue-500 text-white chat-bubble-mine rounded-br-md'
                          : 'bg-white border border-gray-200 text-gray-800 chat-bubble-other rounded-bl-md'
                      }`}>
                        {/* File attachment */}
                        {msg.file_url && (
                          <div className="mb-1.5">
                            {isImage(msg.file_type) ? (
                              <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-xl max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.file_url)} />
                            ) : (
                              <a href={msg.file_url} download={msg.file_name} className={`flex items-center gap-2 p-2 rounded-xl text-xs ${isMine ? 'bg-blue-600' : 'bg-gray-50'}`}>
                                <FileText size={16} />
                                <span className="truncate">{msg.file_name}</span>
                              </a>
                            )}
                          </div>
                        )}
                        {msg.message && !msg.message.startsWith('📎') && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'text-blue-200 justify-end' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                          {isMine && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors shrink-0" title="Lampirkan file">
                  <Paperclip size={18} />
                </button>
                <div className="flex-1 relative">
                  <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan..." rows={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-none max-h-24"
                    style={{ minHeight: '42px' }} />
                </div>
                <button onClick={handleSend} disabled={!newMsg.trim() || sending}
                  className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0 shadow-sm shadow-blue-500/20">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New Direct Chat Modal ── */}
      <Modal open={showNewChat} onClose={() => setShowNewChat(false)} title="Chat Baru" size="sm">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchUsers} onChange={e => setSearchUsers(e.target.value)} placeholder="Cari user..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filteredUsers.map(u => (
            <button key={u.id} onClick={() => startDirectChat(u)}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition-colors">
              <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">{u.name[0]}</div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{u.name}</div>
                <div className="text-[11px] text-gray-400">{u.role}</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* ── New Group Modal ── */}
      <Modal open={showNewGroup} onClose={() => setShowNewGroup(false)} title="Buat Grup" size="sm"
        footer={<BtnPrimary onClick={createGroup} disabled={!groupName.trim() || selectedMembers.length === 0}>Buat Grup ({selectedMembers.length} anggota)</BtnPrimary>}>
        <div className="space-y-4">
          <FormField label="Nama Grup" required>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} className={inputClass} placeholder="Nama grup..." />
          </FormField>
          <FormField label="Anggota">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedMembers.map(uid => {
                const u = allUsers.find(x => x.id === uid);
                return u ? (
                  <span key={uid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                    {u.name}
                    <button onClick={() => setSelectedMembers(prev => prev.filter(id => id !== uid))} className="hover:text-blue-900"><X size={12} /></button>
                  </span>
                ) : null;
              })}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2">
              {allUsers.map(u => (
                <label key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={e => {
                    if (e.target.checked) setSelectedMembers(prev => [...prev, u.id]);
                    else setSelectedMembers(prev => prev.filter(id => id !== u.id));
                  }} className="rounded border-gray-300" />
                  <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">{u.name[0]}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{u.name}</div>
                    <div className="text-[10px] text-gray-400">{u.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
