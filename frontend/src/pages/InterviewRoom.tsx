import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { InterviewService } from '../services/interview.service';
import type { InterviewSession, Language } from '../services/interview.service';
import { AuthService } from '../services/auth.service';
import type { User } from '../services/auth.service';
import { CodeExecutor } from '../utils/executor';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Play, SquareTerminal, Loader2, Copy, Check, Lock, Unlock,
  Settings, Code2, MessageSquare, FileQuestion, XCircle, Send,
  Edit3, Eye, ArrowLeft, LayoutDashboard, Video
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useDebounce } from '../hooks/useDebounce';
import { webRTCService, type SignalMessage } from '../services/webrtc.service';
import { VideoPanel } from '../components/video/VideoPanel';
import { VideoConsentModal } from '../components/video/VideoConsentModal';

const LANGUAGES: Language[] = ['javascript', 'python', 'typescript'];

export const InterviewRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'question' | 'messages' | 'video' | 'notes'>('output');
  const [isCopied, setIsCopied] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Video state
  const [videoStatus, setVideoStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'waiting' | 'denied'>('disconnected');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Real-time sync debounce
  const debouncedCode = useDebounce(code, 300);

  // Initialize
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    if (!id) return;

    // Store initial user ID to detect account switches
    let initialUserId = currentUser.id;

    // Handle same-browser multi-tab scenario - refresh user on focus
    const handleFocus = () => {
      const latestUser = AuthService.getCurrentUser();
      if (!latestUser) {
        navigate('/login');
        return;
      }
      // If user switched accounts after initial load, reload the page
      if (initialUserId && latestUser.id !== initialUserId) {
        initialUserId = latestUser.id; // Update to prevent multiple reloads
        window.location.reload();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Load initial session from API
    const loadSession = async () => {
      try {
        const initialSession = await InterviewService.getSession(id);
        if (initialSession) {
          // Auto-join for candidates who haven't joined yet
          if (currentUser.role === 'candidate' && !initialSession.candidateId) {
            try {
              await InterviewService.joinSession(id);
              // Refetch session after joining to get updated state
              const updatedSession = await InterviewService.getSession(id);
              if (updatedSession) {
                setSession(updatedSession);
                setCode(updatedSession.codeState.code);
              }
            } catch (joinError) {
              console.error('Failed to join session:', joinError);
              // Continue with original session - might already be joined
              setSession(initialSession);
              setCode(initialSession.codeState.code);
            }
          } else {
            setSession(initialSession);
            setCode(initialSession.codeState.code);
          }
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        navigate('/dashboard');
      }
    };
    loadSession();

    // Subscribe to updates (polling-based)
    const unsubscribe = InterviewService.subscribeToSession(id, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        // Only update code from remote for interviewers (who are viewing, not editing)
        // Candidates are the ones editing, so don't overwrite their local changes
        const isInterviewer = updatedSession.interviewerId === currentUser.id;
        if (isInterviewer) {
          setCode((prev) => {
            if (prev !== updatedSession.codeState.code) {
              return updatedSession.codeState.code;
            }
            return prev;
          });
        }
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      unsubscribe();
    };
  }, [id, navigate]);

  // Scroll to bottom of messages when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.sharedMessages]);

  // Track unread messages when not viewing messages tab
  useEffect(() => {
    const messageCount = session?.sharedMessages?.length || 0;
    if (activeTab === 'messages') {
      // User is viewing messages, reset unread count
      setUnreadMessages(0);
      setLastSeenMessageCount(messageCount);
    } else if (messageCount > lastSeenMessageCount) {
      // New messages arrived while not viewing
      setUnreadMessages(messageCount - lastSeenMessageCount);
    }
  }, [session?.sharedMessages, activeTab, lastSeenMessageCount]);

  // Sync Code Changes to "Server" (Storage) - Only for candidates
  useEffect(() => {
    if (!session || !id || !user) return;

    // Only candidates can sync code changes
    const isInterviewer = session.interviewerId === user.id;
    if (isInterviewer) return;

    if (session.codeState.code === debouncedCode) return;

    InterviewService.updateSession(id, {
      codeState: {
        ...session.codeState,
        code: debouncedCode
      }
    });
  }, [debouncedCode, id, session, user]);

  const handleRunCode = async () => {
    if (!session) return;
    setIsRunning(true);
    setActiveTab('output');
    setOutput([]);

    try {
      const result = await CodeExecutor.execute(code, session.codeState.language);
      const newOutput = result.error ? [result.error] : result.output;
      setOutput(newOutput);
    } catch (e) {
      setOutput(['System Error: Execution failed']);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleTypingPermission = async () => {
    if (!session || !id) return;
    const newValue = !session.permissions.canCandidateType;
    // Optimistic update
    setSession({
      ...session,
      permissions: { ...session.permissions, canCandidateType: newValue }
    });
    await InterviewService.toggleCandidateTyping(id);
  };

  const toggleRunPermission = async () => {
    if (!session || !id) return;
    const newValue = !session.permissions.canCandidateRun;
    // Optimistic update
    setSession({
      ...session,
      permissions: { ...session.permissions, canCandidateRun: newValue }
    });
    await InterviewService.toggleCandidateRun(id);
  };

  const changeLanguage = async (lang: Language) => {
    if (!session || !id) return;
    await InterviewService.updateSession(id, {
      codeState: { ...session.codeState, language: lang }
    });
    setSession({
      ...session,
      codeState: { ...session.codeState, language: lang }
    });
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEndSession = async () => {
    if (!id || isEndingSession) return;
    setIsEndingSession(true);
    try {
      await InterviewService.endSession(id);
      navigate('/dashboard');
    } finally {
      setIsEndingSession(false);
      setShowEndConfirmation(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!id || !newQuestionTitle.trim() || !newQuestionContent.trim() || isAddingQuestion) return;
    setIsAddingQuestion(true);
    try {
      await InterviewService.addQuestion(id, newQuestionTitle.trim(), newQuestionContent.trim());
      setNewQuestionTitle('');
      setNewQuestionContent('');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!id) return;
    await InterviewService.removeQuestion(id, questionId);
  };

  const handleSendMessage = async () => {
    if (!id || !user || !messageInput.trim() || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      await InterviewService.addMessage(id, messageInput.trim());
      setMessageInput('');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // ============================================
  // Video Handlers
  // ============================================

  // Use refs to avoid reconnection on every session poll update
  const wsConnectedRef = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session; // Keep ref updated with latest session

  // Connect to WebRTC signaling when session is active (only once)
  useEffect(() => {
    if (!id || !user || wsConnectedRef.current) return;
    
    // Wait for session to be loaded before connecting
    if (!session || session.status === 'ended') return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Mark as connected to prevent re-connection
    wsConnectedRef.current = true;

    // Connect to signaling server
    webRTCService.connect(id, token).catch((err) => {
      console.error('Failed to connect to signaling server:', err);
      wsConnectedRef.current = false; // Reset on error so we can retry
    });

    // Listen for signaling messages
    const unsubscribe = webRTCService.onMessage((message: SignalMessage) => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;

      switch (message.type) {
        case 'video-request':
          // Candidate receives video request from interviewer
          if (currentSession.candidateId === user.id) {
            setShowConsentModal(true);
          }
          break;

        case 'video-accept':
          // Interviewer receives acceptance
          if (currentSession.interviewerId === user.id) {
            setVideoStatus('connecting');
          }
          break;

        case 'video-reject':
          // Interviewer receives rejection
          if (currentSession.interviewerId === user.id) {
            setVideoStatus('denied');
          }
          break;

        case 'video-stop':
          // Either party stops video
          setVideoStatus('disconnected');
          setRemoteStream(null);
          setLocalStream(null);
          break;

        case 'peer-connected':
          // Remote stream is available
          if (message.payload instanceof MediaStream) {
            setRemoteStream(message.payload);
            setVideoStatus('connected');
          } else {
            // For interviewer, the remote stream comes from ontrack event
            const stream = webRTCService.getRemoteStream();
            if (stream) {
              setRemoteStream(stream);
              setVideoStatus('connected');
            }
          }
          break;

        case 'peer-disconnected':
          setVideoStatus('disconnected');
          setRemoteStream(null);
          break;
      }
    });

    return () => {
      unsubscribe();
      webRTCService.cleanup();
      wsConnectedRef.current = false;
    };
  }, [id, user?.id, session?.id, session?.status]); // Only depend on stable identifiers

  // Cleanup video on unmount or session end
  useEffect(() => {
    if (session?.status === 'ended') {
      webRTCService.cleanup();
      setVideoStatus('disconnected');
      setLocalStream(null);
      setRemoteStream(null);
    }
  }, [session?.status]);

  const handleRequestVideo = () => {
    setVideoStatus('waiting');
    webRTCService.requestVideo();
  };

  const handleAcceptVideo = async () => {
    setIsVideoLoading(true);
    try {
      // Start camera
      const stream = await webRTCService.startCamera();
      setLocalStream(stream);

      // Accept the video request
      webRTCService.acceptVideo();

      // Create and send offer
      await webRTCService.createOffer();

      setVideoStatus('connected');
      setShowConsentModal(false);
    } catch (err) {
      console.error('Failed to start camera:', err);
      setVideoStatus('disconnected');
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleRejectVideo = () => {
    webRTCService.rejectVideo();
    setShowConsentModal(false);
  };

  const handleStopVideo = () => {
    webRTCService.stopVideo();
    setVideoStatus('disconnected');
    setLocalStream(null);
    setRemoteStream(null);
  };

  if (!session || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const isInterviewer = session.interviewerId === user.id;
  const isEnded = session.status === 'ended';
  const canEdit = !isInterviewer && session.permissions.canCandidateType && !isEnded;
  const canRun = !isEnded && (isInterviewer || session.permissions.canCandidateRun);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Session Ended Banner */}
      {isEnded && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-4">
          <span className="text-red-400 text-sm">This interview session has ended.</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Navbar */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-4">
          {/* Back to Dashboard Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="font-semibold hidden sm:inline-block">Interview Room</span>
          </div>
          {/* Dashboard Link */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-4 w-[1px] bg-border mx-2" />
          <Badge variant="outline" className="font-mono text-xs">{session.id}</Badge>
          <Badge variant={isInterviewer ? 'default' : 'secondary'} className="text-xs">
            {isInterviewer ? 'Interviewer' : 'Candidate'}
          </Badge>
          {isInterviewer && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" /> View Only
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Invite Button - Interviewer Only */}
          {isInterviewer && (
            <Button size="sm" variant="ghost" onClick={copyInviteLink}>
              {isCopied ? <Check className="w-4 h-4 text-green-500 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {isCopied ? 'Copied' : 'Invite'}
            </Button>
          )}

          {/* Permissions - Interviewer Only */}
          {isInterviewer && !isEnded && (
            <>
              <Button
                size="sm"
                variant={session.permissions.canCandidateType ? "ghost" : "secondary"}
                onClick={toggleTypingPermission}
                title={session.permissions.canCandidateType ? "Disable candidate typing" : "Enable candidate typing"}
              >
                {session.permissions.canCandidateType ? (
                  <Edit3 className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400 mr-1" />
                )}
                <span className="hidden sm:inline text-xs">Type</span>
              </Button>
              <Button
                size="sm"
                variant={session.permissions.canCandidateRun ? "ghost" : "secondary"}
                onClick={toggleRunPermission}
                title={session.permissions.canCandidateRun ? "Disable candidate run" : "Enable candidate run"}
              >
                {session.permissions.canCandidateRun ? (
                  <Unlock className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400 mr-1" />
                )}
                <span className="hidden sm:inline text-xs">Run</span>
              </Button>
            </>
          )}

          {/* Language Selector - Candidate Only */}
          {!isInterviewer && !isEnded && (
            <div className="flex bg-muted/50 p-1 rounded-lg">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md transition-all capitalize",
                    session.codeState.language === lang
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          {/* Language Display - Interviewer */}
          {isInterviewer && (
            <Badge variant="outline" className="capitalize text-xs">
              {session.codeState.language}
            </Badge>
          )}

          {/* Run Button */}
          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={!canRun || isRunning}
            className={cn(!canRun && "opacity-50 cursor-not-allowed")}
          >
            {isRunning ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Run
          </Button>

          {/* End Session - Interviewer Only */}
          {isInterviewer && !isEnded && (
            <Button size="sm" variant="destructive" onClick={() => setShowEndConfirmation(true)}>
              <XCircle className="w-4 h-4 mr-2" />
              End
            </Button>
          )}
        </div>
      </header>

      {/* End Session Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">End Interview Session?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to end this interview session? The candidate will no longer be able to edit code or send messages.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowEndConfirmation(false)}
                disabled={isEndingSession}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndSession}
                isLoading={isEndingSession}
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 relative">
          {/* Typing Disabled Overlay for Candidate */}
          {!isInterviewer && !session.permissions.canCandidateType && !isEnded && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
              <div className="bg-card/90 px-6 py-4 rounded-lg border border-border text-center">
                <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Typing is currently disabled by the interviewer</p>
              </div>
            </div>
          )}
          <Editor
            height="100%"
            language={session.codeState.language}
            theme="vs-dark"
            value={code}
            onChange={(val) => canEdit && setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 20 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: isInterviewer || !session.permissions.canCandidateType || isEnded,
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-1/3 min-w-[320px] border-l border-border bg-card/30 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            <button
              onClick={() => setActiveTab('output')}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1",
                activeTab === 'output'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-white/5"
              )}
            >
              <SquareTerminal className="w-4 h-4" /> Output
            </button>
            <button
              onClick={() => setActiveTab('question')}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1",
                activeTab === 'question'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-white/5"
              )}
            >
              <FileQuestion className="w-4 h-4" /> Question
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1",
                activeTab === 'messages'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-white/5"
              )}
            >
              <MessageSquare className="w-4 h-4" /> Chat
              {unreadMessages > 0 && activeTab !== 'messages' && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1",
                activeTab === 'video'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-white/5"
              )}
            >
              <Video className="w-4 h-4" /> Video
              {videoStatus === 'connected' && (
                <span className="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={cn(
                "flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1",
                activeTab === 'notes'
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-white/5"
              )}
            >
              <Settings className="w-4 h-4" /> Notes
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'output' && (
              <div className="space-y-2 font-mono text-sm">
                {output.length === 0 ? (
                  <div className="text-muted-foreground opacity-50 italic">
                    Output will appear here...
                  </div>
                ) : (
                  output.map((line, i) => (
                    <div key={i} className="break-words border-b border-white/5 pb-1">
                      {line}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'question' && (
              <div className="space-y-4">
                {isInterviewer ? (
                  <>
                    {/* Add New Question Form */}
                    <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Add a new question:
                      </label>
                      <input
                        type="text"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                        placeholder="Question title (e.g., 'Two Sum Problem')"
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        disabled={isEnded}
                      />
                      <textarea
                        className="w-full h-32 bg-muted/30 border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-sm"
                        placeholder="Question description and requirements..."
                        value={newQuestionContent}
                        onChange={(e) => setNewQuestionContent(e.target.value)}
                        disabled={isEnded}
                      />
                      <Button
                        onClick={handleAddQuestion}
                        disabled={isEnded || !newQuestionTitle.trim() || !newQuestionContent.trim() || isAddingQuestion}
                        isLoading={isAddingQuestion}
                        size="sm"
                        className="w-full"
                      >
                        Add Question
                      </Button>
                    </div>

                    {/* Existing Questions */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Questions ({(session.questions || []).length}):
                      </label>
                      {(!session.questions || session.questions.length === 0) ? (
                        <div className="text-muted-foreground opacity-50 italic text-sm">
                          No questions added yet.
                        </div>
                      ) : (
                        session.questions.map((q, index) => (
                          <div key={q.id} className="bg-muted/30 border border-border rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
                                  <span className="font-medium text-sm">{q.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.content}</p>
                              </div>
                              {!isEnded && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                                  onClick={() => handleRemoveQuestion(q.id)}
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Interview Questions:
                    </label>
                    {(!session.questions || session.questions.length === 0) ? (
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <p className="text-muted-foreground italic">
                          No questions have been set yet. Please wait for the interviewer.
                        </p>
                      </div>
                    ) : (
                      session.questions.map((q, index) => (
                        <div key={q.id} className="bg-muted/30 border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" className="text-xs">Question {index + 1}</Badge>
                            <span className="font-medium">{q.title}</span>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap">{q.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto space-y-3 mb-4">
                  {(!session.sharedMessages || session.sharedMessages.length === 0) ? (
                    <div className="text-muted-foreground opacity-50 italic text-sm">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    session.sharedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-3 rounded-lg max-w-[85%]",
                          msg.senderId === user.id
                            ? "bg-primary/20 ml-auto"
                            : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">
                            {msg.senderName}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {msg.senderRole}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">{msg.content}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {!isEnded && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button size="sm" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'video' && (
              <VideoPanel
                isInterviewer={isInterviewer}
                remoteStream={remoteStream}
                localStream={localStream}
                connectionStatus={videoStatus}
                onRequestVideo={handleRequestVideo}
                onStopVideo={handleStopVideo}
              />
            )}

            {activeTab === 'notes' && (
              <div className="h-full">
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Private Notes (only visible to you):
                </label>
                <textarea
                  className="w-full h-[calc(100%-2rem)] bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                  placeholder="Write your private notes here..."
                  defaultValue={session.privateNotes?.[user.id] || ''}
                  onChange={(e) => {
                    if (id) {
                      InterviewService.updateUserNotes(id, e.target.value);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Consent Modal (for candidates) */}
      <VideoConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptVideo}
        onReject={handleRejectVideo}
        isLoading={isVideoLoading}
      />
    </div>
  );
};
