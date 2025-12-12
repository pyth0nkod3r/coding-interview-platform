import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import type { User } from '../services/auth.service';
import { InterviewService } from '../services/interview.service';
import type { InterviewSession } from '../services/interview.service';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, Clock, Code, LogOut, Search, Link as LinkIcon, MoreVertical, Copy, ExternalLink, Check } from 'lucide-react';
import { Input } from '../components/ui/Input';

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [joinInterviewId, setJoinInterviewId] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Fetch sessions from API
    InterviewService.getAllSessions()
      .then(sessions => setSessions(sessions.reverse()))
      .catch(err => console.error('Failed to fetch sessions', err));
  }, [navigate]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSession = async () => {
    if (!user) return;
    setIsCreating(true);
    setCreateError('');
    try {
      const session = await InterviewService.createSession(user);
      navigate(`/interview/${session.id}`);
    } catch (error: any) {
      console.error('Failed to create session', error);
      setCreateError(error.message || 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/login');
  };

  const handleJoinInterview = () => {
    if (!joinInterviewId.trim()) return;
    // Extract interview ID from full URL or use as-is
    let interviewId = joinInterviewId.trim();
    const urlMatch = interviewId.match(/\/interview\/([a-zA-Z0-9-]+)/);
    if (urlMatch) {
      interviewId = urlMatch[1];
    }
    navigate(`/interview/${interviewId}`);
  };

  const handleCopyLink = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/interview/${sessionId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
    setOpenMenuId(null);
  };

  const handleOpenNewTab = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/interview/${sessionId}`, '_blank');
    setOpenMenuId(null);
  };

  const toggleMenu = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const filteredSessions = sessions.filter(s =>
    s.id.includes(searchTerm) ||
    new Date(s.createdAt).toLocaleDateString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Welcome, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'interviewer' ? 'Manage your coding interviews' : 'View your interview sessions'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-white">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
          {user?.role === 'interviewer' && (
            <>
              <Button type="button" onClick={handleCreateSession} isLoading={isCreating}>
                <Plus className="mr-2 h-4 w-4" /> New Interview
              </Button>
              {createError && <span className="text-red-400 text-sm">{createError}</span>}
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Join Interview Section - Only for Candidates */}
        {user?.role === 'candidate' && (
          <Card glass className="p-6 border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  Join an Interview
                </h3>
                <p className="text-sm text-muted-foreground">
                  Paste the interview link or ID shared by your interviewer
                </p>
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <Input
                  placeholder="Paste interview link or ID..."
                  value={joinInterviewId}
                  onChange={(e) => setJoinInterviewId(e.target.value)}
                  className="flex-1 sm:w-64"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinInterview()}
                />
                <Button type="button" onClick={handleJoinInterview} disabled={!joinInterviewId.trim()}>
                  Join
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <Card glass className="p-12 text-center border-dashed border-white/10 bg-white/5">
            <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Code className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-6">
              {user?.role === 'interviewer'
                ? 'Create your first interview session to get started.'
                : 'Use the join section above to enter an interview, or wait for your interviewer to share a link.'
              }
            </p>
            {user?.role === 'interviewer' && (
              <Button type="button" onClick={handleCreateSession} isLoading={isCreating} variant="secondary">
                Create Session
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="group hover:border-primary/50 transition-colors cursor-pointer glass-panel relative"
                onClick={() => navigate(`/interview/${session.id}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate max-w-[60%]">
                    ID: {session.id.slice(0, 8)}...
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'ended' ? 'secondary' : 'default'}>
                      {session.status === 'ended' ? 'Ended' : 'Active'}
                    </Badge>
                    {/* 3-dot Menu - visible on hover */}
                    <div className="relative" ref={openMenuId === session.id ? menuRef : null}>
                      <button
                        onClick={(e) => toggleMenu(session.id, e)}
                        className={`p-1 rounded-md hover:bg-white/10 transition-all ${openMenuId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {openMenuId === session.id && (
                        <div className="absolute right-0 top-8 z-50 min-w-[160px] bg-zinc-900 border border-border rounded-lg shadow-2xl py-1 animate-slide-up">
                          <button
                            onClick={(e) => handleCopyLink(session.id, e)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-white/10 flex items-center gap-2 transition-colors"
                          >
                            {copiedId === session.id ? (
                              <>
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Link
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleOpenNewTab(session.id, e)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-white/10 flex items-center gap-2 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open in New Tab
                          </button>
                          <div className="border-t border-border my-1" />
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {new Date(session.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-2xl font-bold py-2">
                    <Code className="h-6 w-6 text-primary" />
                    <span className="capitalize">{session.codeState.language}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                    <Badge variant={session.interviewerId === user?.id ? 'outline' : 'secondary'} className="text-[10px]">
                      {session.interviewerId === user?.id ? 'Interviewer' : 'Candidate'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
