import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  TreePine, Gift, Star, MessageCircle, Share2, Send, X,
  Sparkles, Snowflake, Lock, Unlock, KeyRound, Plus,
  RefreshCw, AlertTriangle, LogOut, User, LogIn, Home, Trash2
} from 'lucide-react';
// Analytics removed to ensure compatibility in this environment

// Configuration
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_URL = isLocal
  ? "http://localhost:8000"
  : "https://deco-my-tree-clone.onrender.com";

// --- Styles & Helpers ---
const SNOW_ANIMATION = `
  @keyframes snowfall {
    0% { transform: translateY(-10vh) translateX(0); opacity: 1; }
    100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
  }
  .snowflake {
    position: absolute;
    color: white;
    opacity: 0.8;
    pointer-events: none;
    animation: snowfall linear infinite;
  }
`;

const Snowfall = () => {
  const flakes = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 3 + 5}s`, animationDelay: `${Math.random() * 5}s`, size: Math.random() * 10 + 10,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{SNOW_ANIMATION}</style>
      {flakes.map(f => <div key={f.id} className="snowflake" style={{ left: f.left, animationDuration: f.animationDuration, animationDelay: f.animationDelay, fontSize: `${f.size}px` }}>❄</div>)}
    </div>
  );
};

const Ornament = ({ type, color, onClick }) => {
  const colors = { red: "bg-red-500", gold: "bg-yellow-400", blue: "bg-blue-500", purple: "bg-purple-500", green: "bg-green-400", silver: "bg-gray-300" };
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(); }} className={`w-10 h-10 rounded-full shadow-lg cursor-pointer transform hover:scale-110 transition-all duration-300 border-2 border-white/30 flex items-center justify-center relative ${colors[color] || colors.red}`}>
      <div className="w-1 h-3 bg-yellow-600 absolute -top-3 left-1/2 -translate-x-1/2 rounded-t-sm"></div>
      <div className="w-2 h-2 bg-white/40 rounded-full absolute top-1 right-2"></div>
      <Sparkles className="w-5 h-5 text-white/80" />
    </div>
  );
};

// --- Modals ---

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isSignup ? '/signup' : '/login';
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      onLoginSuccess(res.data); // Expecting { id, username }
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">{isSignup ? "Create Account" : "Welcome Back"}</h2>

        <div className="space-y-3 mb-4">
          <input type="text" placeholder="Username" className="w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none focus:ring-2 focus:ring-blue-400" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none focus:ring-2 focus:ring-blue-400" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button onClick={handleSubmit} disabled={loading || !username || !password} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all">
          {loading ? "Processing..." : (isSignup ? "Sign Up" : "Log In")}
        </button>

        <div className="mt-4 text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-blue-600 font-bold hover:underline">
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

const WriteModal = ({ onClose, onSend, senderName, setSenderName, newMessage, setNewMessage, selectedColor, setSelectedColor }) => {
  const [isSending, setIsSending] = useState(false);
  const handleSend = async () => { setIsSending(true); await onSend(); setIsSending(false); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif flex items-center gap-2"><MessageCircle className="text-red-500" /> Leave a Message</h2>
        <div className="mb-6 flex justify-between px-2">{['red', 'gold', 'blue', 'green', 'purple', 'silver'].map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`w-10 h-10 rounded-full border-4 ${selectedColor === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}><div className={`w-full h-full rounded-full bg-${c === 'gold' ? 'yellow-400' : c === 'silver' ? 'gray-300' : c + '-500'}`} /></button>)}</div>
        <div className="space-y-4">
          <input type="text" placeholder="Your Name / Santa" className="w-full bg-gray-50 border rounded-xl px-4 py-2" value={senderName} onChange={e => setSenderName(e.target.value)} maxLength={20} />
          <textarea placeholder="Write a message..." className="w-full bg-gray-50 border rounded-xl px-4 py-3 h-32 resize-none" value={newMessage} onChange={e => setNewMessage(e.target.value)} maxLength={300}></textarea>
        </div>
        <button onClick={handleSend} disabled={!newMessage.trim() || isSending} className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">{isSending ? <RefreshCw className="animate-spin" /> : <Send size={18} />} Hang on Tree</button>
      </div>
    </div>
  );
};

const ReadModal = ({ onClose, msg, isOwner, onDelete }) => {
  // --- SECRET SANTA LOGIC (UPDATED) ---
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 11 = Dec
  const day = now.getDate();
  const hour = now.getHours();

  const isNovember = month === 10;
  const isDecemberPreChristmas = month === 11 && (day < 25 || (day === 25 && hour < 5));
  const isLockedSeason = isNovember || isDecemberPreChristmas;

  let displayTitle = `From: ${msg?.sender}`;
  let displayContent = msg?.content;
  let canRead = true;
  let icon = <Sparkles className="text-white w-8 h-8" />;

  // 1. Guest Check (Never can read)
  if (!isOwner) {
    displayTitle = "🔒 Secret Message";
    displayContent = "Only the tree owner can read this message!";
    canRead = false;
    icon = <Lock className="text-white w-8 h-8" />;
  }
  // 2. Time Check (Owner locked during build-up season)
  else if (isLockedSeason) {
    // Show SENDER NAME, but hide Content
    // displayTitle remains "From: {sender}"
    displayContent = "This message is wrapped until Christmas morning (Dec 25th, 5:00 AM).";
    canRead = false;
    icon = <Gift className="text-white w-8 h-8" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>

        {/* Delete Button for Owner */}
        {isOwner && (
          <button
            onClick={() => onDelete(msg.id)}
            className="absolute top-4 left-4 text-red-300 hover:text-red-500 transition-colors p-2"
            title="Delete Message"
          >
            <Trash2 size={20} />
          </button>
        )}

        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-${msg?.color === 'gold' ? 'yellow-400' : msg?.color === 'silver' ? 'gray-300' : msg?.color + '-500' || 'red-500'} shadow-lg`}>
          {icon}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-1 font-serif">{displayTitle}</h3>
        <p className="text-xs text-gray-400 mb-6">{msg?.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Just now'}</p>

        <div className={`p-6 rounded-xl border relative ${canRead ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-100 border-dashed border-gray-300'}`}>
          <p className={`${canRead ? 'text-gray-700 font-medium italic' : 'text-gray-500 italic'} relative z-10`}>
            {displayContent}
          </p>
        </div>

        {!canRead && isOwner && (
          <p className="mt-4 text-xs text-red-500 font-bold uppercase tracking-wider">
            Unlocks: Dec 25th, 5:00 AM
          </p>
        )}

        <button onClick={onClose} className="mt-6 text-gray-500 hover:text-gray-800 text-sm font-semibold">Close</button>
      </div>
    </div>
  );
};

// --- Main Views ---

const LandingView = ({ onCreate, onOpenAuth, currentUser, userTrees, onLoadTree, onLogout }) => {
  const [nameInput, setNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onCreate(nameInput, pinInput);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-b from-green-900 to-slate-900 text-white relative z-10">
      <div className="absolute top-6 right-6">
        {currentUser ? (
          <button
            onClick={() => {
              if (window.confirm("Do you want to logout?")) {
                onLogout();
              }
            }}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all"
            title="Click to Logout"
          >
            <User size={16} className="text-yellow-300" />
            <span className="font-bold">{currentUser.username}</span>
          </button>
        ) : (
          <button onClick={onOpenAuth} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all flex items-center gap-2">
            <LogIn size={16} /> Login / Signup
          </button>
        )}
      </div>

      <div className="mb-8 animate-bounce"><TreePine size={80} className="text-green-400 drop-shadow-lg mx-auto" /></div>
      <h1 className="text-5xl font-bold mb-4 font-serif text-yellow-300 drop-shadow-md">Deco My Tree ka clone </h1>
      <h1 className="text-4xl font-bold mb-4 font-serif text-yellow-300 drop-shadow-md">that nalin made cause he was angry at the original</h1>

      {currentUser ? (
        <>
          {userTrees.length > 0 && (
            <div className="w-full max-w-sm mb-6">
              <p className="text-lg text-green-100 mb-4">Welcome back! Continue to your tree:</p>
              <div className="flex flex-col gap-3">
                {userTrees.map(tree => (
                  <button key={tree.id} onClick={() => onLoadTree(tree.id)} className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left flex justify-between items-center transition-all border border-white/10">
                    <span className="font-bold">{tree.name}</span>
                    <span className="text-xs text-green-300">Open &rarr;</span>
                  </button>
                ))}
              </div>
              <div className="my-6 border-t border-white/10"></div>
              <p className="text-sm text-gray-400 mb-2">Or create a new one:</p>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl w-full max-w-sm border border-white/20 shadow-xl">
            <div className="space-y-4">
              <input type="text" placeholder="Tree Name" className="w-full px-4 py-3 rounded-xl text-slate-900 outline-none font-medium" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              <div className="relative">
                <input type="text" inputMode="numeric" maxLength={4} placeholder="Set PIN (Backup Access)" className="w-full px-4 py-3 rounded-xl text-slate-900 outline-none font-medium tracking-widest" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
                <Lock className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={!nameInput || pinInput.length < 4 || isLoading} className="w-full mt-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
              {isLoading ? <RefreshCw className="animate-spin" /> : <TreePine size={20} />} {isLoading ? "Creating..." : "Create Tree"}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl w-full max-w-sm border border-white/20 shadow-xl">
          <p className="text-xl mb-6 text-green-100 font-semibold">Join the Fun!</p>
          <p className="text-sm mb-8 text-green-200/80">You need an account to create your own personal tree. Guests can decorate, but only you can create!</p>
          <button onClick={onOpenAuth} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <LogIn size={20} /> Login / Signup to Create
          </button>
        </div>
      )}
    </div>
  );
};

// --- App Controller ---

export default function DecoMyTree() {
  const [view, setView] = useState('landing'); // landing, tree, loading
  const [treeData, setTreeData] = useState(null);
  const [messages, setMessages] = useState([]);

  // User State
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('deco_user_account')) || null);
  const [userTrees, setUserTrees] = useState([]);

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [readMsg, setReadMsg] = useState(null);

  // Write Form
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('red');

  useEffect(() => {
    // Check URL for direct link
    const params = new URLSearchParams(window.location.search);
    const treeId = params.get('treeId');
    if (treeId) loadTree(treeId);
    else if (currentUser) fetchUserTrees(currentUser.id);
  }, []);

  const fetchUserTrees = async (uid) => {
    try {
      const res = await axios.get(`${API_URL}/user-trees/${uid}`);
      setUserTrees(res.data);
    } catch (e) { console.error("Failed to fetch trees", e); }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('deco_user_account', JSON.stringify(user));
    fetchUserTrees(user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserTrees([]);
    localStorage.removeItem('deco_user_account');

    // If currently viewing a tree, stay there but as a visitor
    if (view === 'tree') {
      alert("Logged out. You are now viewing this tree as a guest.\n(Only the owner can read messages)");
    } else {
      setView('landing');
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const loadTree = async (tid) => {
    setView('loading');
    try {
      const tRes = await axios.get(`${API_URL}/trees/${tid}`);
      setTreeData(tRes.data);
      const mRes = await axios.get(`${API_URL}/messages/${tid}`);
      setMessages(mRes.data);
      setView('tree');
    } catch (e) {
      alert("Tree not found");
      setView('landing');
    }
  };

  const createTree = async (name, pin) => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    const ownerId = currentUser.id;
    try {
      const res = await axios.post(`${API_URL}/trees`, { name, pin, ownerId });
      if (currentUser) fetchUserTrees(currentUser.id);

      const newUrl = `${window.location.pathname}?treeId=${res.data.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      loadTree(res.data.id);
    } catch (e) { alert("Failed to create tree"); }
  };

  const addMessage = async () => {
    try {
      await axios.post(`${API_URL}/messages`, { treeId: treeData.id, content: newMessage, sender: senderName || "Anonymous", color: selectedColor });
      setShowWrite(false); setNewMessage(''); setSenderName('');
      const mRes = await axios.get(`${API_URL}/messages/${treeData.id}`);
      setMessages(mRes.data);
    } catch (e) { alert("Failed to send"); }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message permanently?")) return;
    try {
      // Pass the current user's ID so the backend can verify they own the tree
      await axios.delete(`${API_URL}/messages/${msgId}?user_id=${currentUser.id}`);
      // Optimistic update
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setReadMsg(null);
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete message. Ensure you are the owner.");
    }
  };

  const isOwner = currentUser && treeData && currentUser.id === treeData.ownerId;

  // Tree View Render
  if (view === 'loading') return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><RefreshCw className="animate-spin mr-2" /> Loading...</div>;

  if (view === 'landing') return (
    <>
      <Snowfall />
      <LandingView
        onCreate={createTree}
        onOpenAuth={() => setShowAuth(true)}
        currentUser={currentUser}
        userTrees={userTrees}
        onLoadTree={loadTree}
        onLogout={handleLogout}
      />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={handleAuthSuccess} />}
    </>
  );

  return (
    <div className="font-sans text-slate-900 overflow-hidden relative min-h-screen bg-gradient-to-b from-slate-900 via-green-900 to-slate-900 flex flex-col items-center">
      <Snowfall />

      {/* Header */}
      <div className="w-full p-4 flex justify-between items-center z-50 backdrop-blur-sm bg-black/20 sticky top-0">
        <div className="text-white font-serif font-bold text-xl drop-shadow-md flex items-center gap-2">
          <TreePine className="text-green-400" /> {treeData.name}
        </div>
        <div className="flex gap-2">
          {isOwner && <span className="bg-yellow-500/20 text-yellow-200 px-3 py-1 rounded-full text-xs border border-yellow-500/30 flex items-center font-bold"><Unlock size={12} className="mr-1" /> Owner</span>}

          {/* Home Button */}
          <button onClick={() => { setView('landing'); window.history.pushState({}, '', window.location.pathname); }} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white flex items-center gap-1 text-xs transition-all" title="Go to Homepage">
            <Home size={12} /> Home
          </button>

          {!currentUser && (
            <button onClick={() => setShowAuth(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs">Login</button>
          )}

          <button onClick={() => {
            // Explicitly construct URL with query param
            const url = `${window.location.origin}${window.location.pathname}?treeId=${treeData.id}`;
            const ta = document.createElement("textarea"); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
            alert("Tree link copied to clipboard!\nSend it to friends to get messages! 🎄");
          }} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white flex items-center gap-1 text-xs">
            <Share2 size={12} /> Share
          </button>

          {currentUser && <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded-full text-red-200 flex items-center gap-1 text-xs"><LogOut size={12} /> Logout</button>}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-grow flex items-center justify-center w-full max-w-3xl relative mt-4 mb-20">
        <div className="relative w-full max-w-[400px] flex flex-col items-center justify-center">
          {/* Star - On Top */}
          <div className="z-20 -mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
            <Star size={64} className="text-yellow-300 fill-yellow-300" />
          </div>

          <div className="relative flex flex-col items-center">
            <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[80px] border-l-transparent border-r-transparent border-b-green-700 drop-shadow-lg z-10 -mb-6"></div>
            <div className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[120px] border-l-transparent border-r-transparent border-b-green-800 drop-shadow-lg z-0 -mb-6"></div>
            <div className="w-0 h-0 border-l-[150px] border-r-[150px] border-b-[180px] border-l-transparent border-r-transparent border-b-green-900 drop-shadow-lg z-[-1]"></div>

            {/* Trunk */}
            <div className="w-16 h-24 bg-amber-900 rounded-b-lg mt-0 shadow-inner z-[-2]"></div>

            {/* Ornament Overlay */}
            <div className="absolute inset-0 flex flex-col items-center pt-8 pb-4 px-8 z-40 pointer-events-none">
              <div className="w-full h-full flex flex-wrap content-center justify-center gap-6 py-4 overflow-visible pointer-events-auto">
                {messages.map((msg, idx) => (
                  <Ornament key={msg.id} type="ball" color={msg.color} onClick={() => setReadMsg(msg)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 z-50">
        <button onClick={() => setShowWrite(true)} className="bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-4 px-8 rounded-full shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 transition-all"><Gift className="animate-bounce" /> Decorate Tree</button>
      </div>

      {showWrite && <WriteModal onClose={() => setShowWrite(false)} onSend={addMessage} senderName={senderName} setSenderName={setSenderName} newMessage={newMessage} setNewMessage={setNewMessage} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
      {readMsg && <ReadModal onClose={() => setReadMsg(null)} msg={readMsg} isOwner={isOwner} onDelete={deleteMessage} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={handleAuthSuccess} />}
    </div>
  );
}