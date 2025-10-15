import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Separator } from '@/components/shared/ui/separator';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { toast } from 'sonner';
import { Mail, Apple, Chrome } from 'lucide-react';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (resetMode) {
        // Password reset flow
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset link sent! Check your email.');
        setResetMode(false);
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email: email,
            }
          }
        });

        if (error) throw error;

        // Profile creation is now handled automatically by database trigger
        toast.success('Account created! Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/onboarding');
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);

      // Provide more specific error messages
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message.includes('Password should be')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('signup_disabled')) {
          errorMessage = 'Sign up is currently disabled. Please contact support.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('OAuth error:', error);
      setError(error instanceof Error ? error.message : 'OAuth sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md glass-card">
        <CardHeader>
          <CardTitle className="gradient-text text-center text-3xl">
            {resetMode ? 'Reset Password' : isSignUp ? 'Join Newomen' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {resetMode
              ? 'Enter your email to receive a password reset link.'
              : isSignUp
              ? 'Start your journey of self-discovery today.'
              : 'Sign in to continue your transformation.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="glass"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!resetMode && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    className="glass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert" aria-live="assertive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full mt-6 clay-button" disabled={loading}>
              {loading ? 'Processing...' : resetMode ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          {!resetMode && (
            <>
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="glass"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="glass"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={loading}
                >
                  <Apple className="mr-2 h-4 w-4" />
                  Apple
                </Button>
              </div>
            </>
          )}

          {!isSignUp && !resetMode && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                className="text-sm text-muted-foreground"
                onClick={() => {
                  setResetMode(true);
                  setError(null);
                }}
              >
                Forgot password?
              </Button>
            </div>
          )}

          {resetMode && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                className="text-sm text-muted-foreground"
                onClick={() => {
                  setResetMode(false);
                  setError(null);
                }}
              >
                Back to sign in
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!resetMode && (
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button 
                variant="link" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
