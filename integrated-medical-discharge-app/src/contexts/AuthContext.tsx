import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

interface User {
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string, department: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  confirmEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      if (currentUser && session) {
        setUser({
          username: currentUser.username,
          email: currentUser.signInDetails?.loginId,
        });
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn({ username: email, password });
      
      if (result.isSignedIn) {
        await checkUser();
        return { success: true };
      }
      
      return { success: false, error: 'Sign in not completed' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to sign in';
      if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Incorrect email or password';
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'User not found. Please sign up first.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    department: string
  ) => {
    try {
      // Store department in localStorage temporarily until we have a backend
      // AWS Cognito doesn't have custom:department configured in the User Pool
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          },
        },
      });

      // Store department locally (in production, this would be stored in a database)
      if (result.isSignUpComplete || result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        localStorage.setItem(`user_department_${email}`, department);
      }

      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        return { success: true, needsConfirmation: true };
      }

      if (result.isSignUpComplete) {
        return { success: true, needsConfirmation: false };
      }

      return { success: false, error: 'Sign up not completed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Failed to sign up';
      if (error.name === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists';
      } else if (error.name === 'InvalidPasswordException') {
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, numbers and special characters';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const confirmEmail = async (email: string, code: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (error: any) {
      console.error('Confirmation error:', error);
      
      let errorMessage = 'Failed to confirm email';
      if (error.name === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code';
      } else if (error.name === 'ExpiredCodeException') {
        errorMessage = 'Verification code has expired';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const resendCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (error: any) {
      console.error('Resend code error:', error);
      return { success: false, error: error.message || 'Failed to resend code' };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmEmail, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
