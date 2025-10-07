import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id.trim() || !password) {
      toast.error('Please enter your student ID and password');
      return;
    }
    
    try {
      setLoading(true);
      // Capture the user object returned from login
      const loggedInUser = await login(id, password); 
      
      toast.success('Login successful!');
      
      // CRITICAL REDIRECTION LOGIC
      // Check the returned role and navigate accordingly
      if (loggedInUser.role === 'Admin') {
          navigate('/admin');
      } else {
          navigate('/dashboard');
      }

    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // MODIFIED: Use the dynamic Admin ID pattern for the label check
  const adminIdPattern = /^ADM[0-9]{3}$/i;
  const isIdAdmin = adminIdPattern.test(id);

  return (
    <div className="max-w-md mx-auto p-6 fade-in">
      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Student Academic Results Portal</h1>
          <h2 className="text-xl font-semibold text-secondary">User Login</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {/* Label dynamically shows 'Admin ID' if the pattern is being typed */}
            <label htmlFor="studentId" className="form-label">{isIdAdmin ? 'Admin ID' : 'Student ID'}</label>
            <input
              type="text"
              id="studentId"
              className="form-input"
              placeholder="Enter your student or admin ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <button 
              type="submit" 
              className="btn btn-primary w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                'Logging in...'
              ) : (
                <>
                  <LogIn size={20} className="mr-2" />
                  Login
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;