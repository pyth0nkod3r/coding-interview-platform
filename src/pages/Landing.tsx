import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
    Code2, Users, Zap, Shield, Play, ArrowRight, Check,
    Monitor, MessageSquare, Clock, Star
} from 'lucide-react';
import { cn } from '../utils/cn';

export const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Code2,
            title: 'Real-Time Code Editor',
            description: 'Collaborative Monaco editor with syntax highlighting for JavaScript, Python, and TypeScript.',
            gradient: 'from-violet-500 to-purple-600'
        },
        {
            icon: Users,
            title: 'Live Collaboration',
            description: 'See code changes in real-time. Both interviewer and candidate stay perfectly in sync.',
            gradient: 'from-cyan-500 to-blue-600'
        },
        {
            icon: MessageSquare,
            title: 'Instant Messaging',
            description: 'Built-in chat for seamless communication during the interview session.',
            gradient: 'from-pink-500 to-rose-600'
        },
        {
            icon: Shield,
            title: 'Role-Based Access',
            description: 'Interviewers control permissions. Candidates focus on solving problems.',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            icon: Zap,
            title: 'Code Execution',
            description: 'Run code instantly and see output in real-time. Test solutions on the fly.',
            gradient: 'from-amber-500 to-orange-600'
        },
        {
            icon: Clock,
            title: 'Session Management',
            description: 'Create, manage, and end interview sessions with complete control.',
            gradient: 'from-indigo-500 to-violet-600'
        }
    ];

    const stats = [
        { value: '10K+', label: 'Interviews Conducted' },
        { value: '500+', label: 'Companies Trust Us' },
        { value: '99.9%', label: 'Uptime Guarantee' },
        { value: '4.9/5', label: 'User Rating' }
    ];

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-background to-cyan-950/30" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            CodeInterview
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-white transition-colors"
                            onClick={() => navigate('/login')}
                        >
                            Sign In
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-105"
                            onClick={() => navigate('/signup')}
                        >
                            Get Started Free
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-muted-foreground">Trusted by 500+ companies worldwide</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                            Conduct Technical
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                            Interviews Like Never Before
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                        A real-time collaborative platform for coding interviews.
                        <span className="text-white/90"> Live code editor, instant messaging, and seamless execution </span>
                        — all in one beautiful interface.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-2xl shadow-violet-500/30 text-lg px-8 py-6 transition-all duration-300 hover:scale-105 group"
                            onClick={() => navigate('/signup')}
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-white/20 hover:bg-white/5 text-lg px-8 py-6 transition-all duration-300 hover:border-white/40"
                            onClick={() => navigate('/login')}
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Watch Demo
                        </Button>
                    </div>

                    {/* Hero Image / Preview */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-pink-500/20 blur-3xl -z-10 rounded-3xl" />
                        <div className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
                            {/* Mock Editor Header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="text-xs text-muted-foreground font-mono">interview-room.tsx</span>
                                </div>
                            </div>
                            {/* Mock Code */}
                            <div className="p-6 font-mono text-sm text-left">
                                <div className="text-violet-400">// Real-time collaborative coding</div>
                                <div className="mt-2">
                                    <span className="text-pink-400">function</span>
                                    <span className="text-cyan-400"> twoSum</span>
                                    <span className="text-white">(nums, target) {'{'}</span>
                                </div>
                                <div className="pl-4">
                                    <span className="text-pink-400">const</span>
                                    <span className="text-white"> map = </span>
                                    <span className="text-pink-400">new</span>
                                    <span className="text-cyan-400"> Map</span>
                                    <span className="text-white">();</span>
                                </div>
                                <div className="pl-4">
                                    <span className="text-pink-400">for</span>
                                    <span className="text-white"> (</span>
                                    <span className="text-pink-400">let</span>
                                    <span className="text-white"> i = 0; i {'<'} nums.length; i++) {'{'}</span>
                                </div>
                                <div className="pl-8">
                                    <span className="text-pink-400">const</span>
                                    <span className="text-white"> complement = target - nums[i];</span>
                                </div>
                                <div className="pl-8">
                                    <span className="text-pink-400">if</span>
                                    <span className="text-white"> (map.</span>
                                    <span className="text-cyan-400">has</span>
                                    <span className="text-white">(complement)) {'{'}</span>
                                </div>
                                <div className="pl-12">
                                    <span className="text-pink-400">return</span>
                                    <span className="text-white"> [map.</span>
                                    <span className="text-cyan-400">get</span>
                                    <span className="text-white">(complement), i];</span>
                                </div>
                                <div className="pl-8 text-white">{'}'}</div>
                                <div className="pl-8">
                                    <span className="text-white">map.</span>
                                    <span className="text-cyan-400">set</span>
                                    <span className="text-white">(nums[i], i);</span>
                                </div>
                                <div className="pl-4 text-white">{'}'}</div>
                                <div className="text-white">{'}'}</div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-2 h-5 bg-violet-400 animate-pulse" />
                                    <span className="text-muted-foreground">|</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-6 border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2 transition-transform group-hover:scale-110">
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                Everything You Need for
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                Perfect Interviews
                            </span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Powerful features designed to make technical interviews seamless,
                            efficient, and enjoyable for everyone involved.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10"
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110",
                                    feature.gradient
                                )}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-cyan-600/20 to-pink-600/20 blur-3xl -z-10 rounded-3xl" />
                    <div className="text-center p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                            Ready to Transform Your Hiring?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                            Join thousands of companies conducting better technical interviews.
                            Start free today, no credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-xl shadow-violet-500/25 text-lg px-8 transition-all duration-300 hover:scale-105"
                                onClick={() => navigate('/signup')}
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                No credit card
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                Free forever plan
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                Cancel anytime
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                <Code2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white">CodeInterview</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            © 2024 CodeInterview. Built with ❤️ for developers.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Custom CSS for animations */}
            <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
        </div>
    );
};
