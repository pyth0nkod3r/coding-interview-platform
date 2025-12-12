import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../services/auth.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Code2, Sparkles } from 'lucide-react';

export const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Determine role based on URL path
  const isInterviewerSignup = location.pathname.includes('/interviewer');
  const role: UserRole = isInterviewerSignup ? 'interviewer' : 'candidate';

  // Get the redirect destination from location state, or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await AuthService.signup(username, email, password, role);
      // Redirect to the originally requested page or dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <Card glass className="w-full max-w-md z-10 animate-slide-up border-white/10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
            {isInterviewerSignup ? 'Interviewer Registration' : 'Create Account'}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {isInterviewerSignup
              ? 'Register as an interviewer to create and manage coding interviews'
              : 'Join the platform to participate in coding interviews'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Username"
              placeholder="e.g. coder123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={error.includes('Username') ? error : ''}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a password (min 4 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error.includes('Password') ? error : ''}
            />
            {error && !error.includes('Username') && !error.includes('Password') && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Get Started <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
