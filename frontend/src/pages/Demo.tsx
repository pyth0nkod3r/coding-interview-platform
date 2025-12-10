import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
    Code2, ArrowRight, Play, Pause, RotateCcw,
    MessageSquare, FileQuestion, Terminal, Users
} from 'lucide-react';
import { cn } from '../utils/cn';

// Demo steps with simulated content
const demoSteps = [
    {
        id: 1,
        title: 'Create Interview Session',
        description: 'Interviewers can quickly create a new coding session',
        duration: 3000,
        screen: 'dashboard'
    },
    {
        id: 2,
        title: 'Set Interview Questions',
        description: 'Add multiple coding questions for the candidate',
        duration: 3500,
        screen: 'questions'
    },
    {
        id: 3,
        title: 'Real-Time Code Editor',
        description: 'Candidates write code while interviewers watch live',
        duration: 4000,
        screen: 'editor'
    },
    {
        id: 4,
        title: 'Execute & Test Code',
        description: 'Run code instantly and see output in real-time',
        duration: 3000,
        screen: 'output'
    },
    {
        id: 5,
        title: 'Live Chat Communication',
        description: 'Instant messaging between interviewer and candidate',
        duration: 3000,
        screen: 'chat'
    }
];

// Simulated typing effect code
const codeLines = [
    { text: 'function twoSum(nums, target) {', delay: 0 },
    { text: '  const map = new Map();', delay: 400 },
    { text: '  for (let i = 0; i < nums.length; i++) {', delay: 800 },
    { text: '    const complement = target - nums[i];', delay: 1200 },
    { text: '    if (map.has(complement)) {', delay: 1600 },
    { text: '      return [map.get(complement), i];', delay: 2000 },
    { text: '    }', delay: 2400 },
    { text: '    map.set(nums[i], i);', delay: 2800 },
    { text: '  }', delay: 3200 },
    { text: '}', delay: 3600 },
];

const chatMessages = [
    { sender: 'Interviewer', message: "Great start! Can you explain your approach?", delay: 0 },
    { sender: 'Candidate', message: "I'm using a hash map for O(n) lookup", delay: 1000 },
    { sender: 'Interviewer', message: "Perfect! What about edge cases?", delay: 2000 },
];

export const Demo = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [typedCode, setTypedCode] = useState<string[]>([]);
    const [visibleMessages, setVisibleMessages] = useState<number>(0);
    const [showOutput, setShowOutput] = useState(false);

    // Auto-advance through demo steps
    useEffect(() => {
        if (!isPlaying) return;

        const timer = setTimeout(() => {
            setCurrentStep((prev) => (prev + 1) % demoSteps.length);
        }, demoSteps[currentStep].duration);

        return () => clearTimeout(timer);
    }, [currentStep, isPlaying]);

    // Typing animation for code editor
    useEffect(() => {
        if (demoSteps[currentStep].screen !== 'editor') {
            setTypedCode([]);
            return;
        }

        const timers: NodeJS.Timeout[] = [];
        codeLines.forEach((line, index) => {
            const timer = setTimeout(() => {
                setTypedCode(prev => [...prev.slice(0, index), line.text]);
            }, line.delay);
            timers.push(timer);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, [currentStep]);

    // Chat message animation
    useEffect(() => {
        if (demoSteps[currentStep].screen !== 'chat') {
            setVisibleMessages(0);
            return;
        }

        const timers: NodeJS.Timeout[] = [];
        chatMessages.forEach((_, index) => {
            const timer = setTimeout(() => {
                setVisibleMessages(index + 1);
            }, chatMessages[index].delay);
            timers.push(timer);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, [currentStep]);

    // Output animation
    useEffect(() => {
        if (demoSteps[currentStep].screen !== 'output') {
            setShowOutput(false);
            return;
        }

        const timer = setTimeout(() => setShowOutput(true), 800);
        return () => clearTimeout(timer);
    }, [currentStep]);

    const handleRestart = () => {
        setCurrentStep(0);
        setTypedCode([]);
        setVisibleMessages(0);
        setShowOutput(false);
        setIsPlaying(true);
    };

    const step = demoSteps[currentStep];

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-background to-cyan-950/30" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            CodeInterview
                        </span>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500"
                        onClick={() => navigate('/signup')}
                    >
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </nav>

            {/* Demo Content */}
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                See CodeInterview in Action
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Watch how easy it is to conduct technical interviews
                        </p>
                    </div>

                    {/* Demo Player */}
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-pink-500/20 blur-3xl -z-10 rounded-3xl" />

                        {/* Main demo container */}
                        <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                            {/* Window chrome */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    CodeInterview Demo
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleRestart}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Demo screen area */}
                            <div className="h-[500px] flex">
                                {/* Sidebar */}
                                <div className="w-16 border-r border-white/10 bg-black/20 flex flex-col items-center py-4 gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                                        step.screen === 'dashboard' ? "bg-violet-500 text-white" : "bg-white/5 text-muted-foreground"
                                    )}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                                        step.screen === 'questions' ? "bg-violet-500 text-white" : "bg-white/5 text-muted-foreground"
                                    )}>
                                        <FileQuestion className="w-5 h-5" />
                                    </div>
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                                        (step.screen === 'editor' || step.screen === 'output') ? "bg-violet-500 text-white" : "bg-white/5 text-muted-foreground"
                                    )}>
                                        <Code2 className="w-5 h-5" />
                                    </div>
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                                        step.screen === 'chat' ? "bg-violet-500 text-white" : "bg-white/5 text-muted-foreground"
                                    )}>
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Main content area */}
                                <div className="flex-1 p-6 overflow-hidden">
                                    {/* Dashboard Screen */}
                                    {step.screen === 'dashboard' && (
                                        <div className="h-full animate-fade-in">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-xl font-semibold">Dashboard</h2>
                                                <div className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg text-sm font-medium animate-pulse">
                                                    + New Interview
                                                </div>
                                            </div>
                                            <div className="grid gap-4">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">Interview Session #{i}</div>
                                                            <div className="text-sm text-muted-foreground">Created today</div>
                                                        </div>
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-full text-xs",
                                                            i === 1 ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {i === 1 ? 'Active' : 'Completed'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions Screen */}
                                    {step.screen === 'questions' && (
                                        <div className="h-full animate-fade-in">
                                            <h2 className="text-xl font-semibold mb-6">Interview Questions</h2>
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-1 bg-violet-500 text-white rounded text-xs">Q1</span>
                                                        <span className="font-medium">Two Sum Problem</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Given an array of integers, return indices of two numbers that add up to target.
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 border-dashed flex items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-white/10 transition-colors">
                                                    <span className="text-xl">+</span>
                                                    <span>Add another question</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Editor Screen */}
                                    {step.screen === 'editor' && (
                                        <div className="h-full animate-fade-in">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex gap-2">
                                                    <span className="px-3 py-1 bg-violet-500 text-white rounded text-xs">JavaScript</span>
                                                    <span className="px-3 py-1 bg-white/10 text-muted-foreground rounded text-xs">Python</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-green-400">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                    Live
                                                </div>
                                            </div>
                                            <div className="font-mono text-sm bg-black/30 rounded-lg p-4 h-[350px] overflow-hidden">
                                                {typedCode.map((line, i) => (
                                                    <div key={i} className="animate-fade-in">
                                                        <span className="text-muted-foreground mr-4">{i + 1}</span>
                                                        <span className="text-cyan-400">{line}</span>
                                                    </div>
                                                ))}
                                                <div className="inline-block w-2 h-5 bg-violet-400 animate-pulse ml-1" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Output Screen */}
                                    {step.screen === 'output' && (
                                        <div className="h-full animate-fade-in">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Terminal className="w-5 h-5 text-violet-400" />
                                                <span className="font-medium">Output</span>
                                            </div>
                                            <div className="font-mono text-sm bg-black/30 rounded-lg p-4 h-[350px]">
                                                {showOutput && (
                                                    <div className="space-y-2 animate-fade-in">
                                                        <div className="text-green-400">✓ Running code...</div>
                                                        <div className="text-muted-foreground">Test case 1: nums = [2,7,11,15], target = 9</div>
                                                        <div className="text-cyan-400">Output: [0, 1]</div>
                                                        <div className="text-green-400 mt-4">✓ All test cases passed!</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Chat Screen */}
                                    {step.screen === 'chat' && (
                                        <div className="h-full animate-fade-in flex flex-col">
                                            <h2 className="text-xl font-semibold mb-4">Live Chat</h2>
                                            <div className="flex-1 space-y-4 overflow-hidden">
                                                {chatMessages.slice(0, visibleMessages).map((msg, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "p-3 rounded-lg max-w-[80%] animate-fade-in",
                                                            msg.sender === 'Interviewer'
                                                                ? "bg-white/10 mr-auto"
                                                                : "bg-violet-500/20 ml-auto"
                                                        )}
                                                    >
                                                        <div className="text-xs text-violet-400 mb-1">{msg.sender}</div>
                                                        <div className="text-sm">{msg.message}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Type a message..."
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                                                    readOnly
                                                />
                                                <button className="px-4 py-2 bg-violet-500 rounded-lg text-sm">Send</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 bg-white/10">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300"
                                    style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Step indicator */}
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                <span className="text-violet-400 font-mono text-sm">Step {currentStep + 1}/{demoSteps.length}</span>
                                <div className="w-px h-4 bg-white/20" />
                                <span className="font-medium">{step.title}</span>
                            </div>
                            <p className="mt-3 text-muted-foreground">{step.description}</p>
                        </div>

                        {/* Step dots */}
                        <div className="flex justify-center gap-2 mt-6">
                            {demoSteps.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentStep(i)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        i === currentStep
                                            ? "w-8 bg-gradient-to-r from-violet-500 to-cyan-500"
                                            : "bg-white/20 hover:bg-white/40"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-12">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-xl shadow-violet-500/25 text-lg px-8 transition-all duration-300 hover:scale-105"
                            onClick={() => navigate('/signup')}
                        >
                            Start Your Free Trial
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
        </div>
    );
};
