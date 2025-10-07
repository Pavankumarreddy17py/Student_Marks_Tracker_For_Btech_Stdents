import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // ADDED email state
  const [branch, setBranch] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Student' | 'Admin'>('Student'); 
  const [showPassword, setShowPassword] = useState(false); // FIXED: Added setShowPassword setter
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const branches = [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering"
  ];

  // --- Password Strength Logic ---
  const checkPasswordStrength = (newPassword: string) => {
    const strength = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
    };
    setPasswordStrength(strength);
    return Object.values(strength).every(v => v === true);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };
  
  const renderStrengthItem = (isMet: boolean, text: string) => (
    <div className={`flex items-center text-xs ${isMet ? 'text-green-600' : 'text-red-500'}`}>
      {isMet ? <CheckCircle size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
      {text}
    </div>
  );
  // --- End Password Strength Logic ---


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ID format
    const studentIdPattern = /^(28|27|26|25)BC1A05[0-5][0-9]$/;
    const adminIdPattern = /^ADM[0-9]{3}$/i; 
    
    const isAdminIdValid = adminIdPattern.test(id); 
    const finalBranch = role === 'Admin' ? 'N/A' : branch;

    if (role === 'Student' && !studentIdPattern.test(id)) {
      toast.error('Please enter a valid student ID in the format YYBC1A05XX (e.g., 28BC1A0500)');
      return;
    }
    
    if (role === 'Admin' && !isAdminIdValid) {
        toast.error('Admin registration requires an ID in the format ADMxxx (e.g., ADM001).');
        return;
    }

    if (role === 'Student' && adminIdPattern.test(id)) {
        toast.error('This ID pattern is reserved for Admin registration.');
        return;
    }
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    // New: Validate Email (only required for Students)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (role === 'Student' && (!email.trim() || !emailPattern.test(email.trim()))) {
        toast.error('Please enter a valid email address.');
        return;
    }

    if (role === 'Student' && !branch) {
      toast.error('Please select your branch');
      return;
    }
    
    if (!password) {
      toast.error('Please create a password');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!checkPasswordStrength(password)) {
      toast.error('Password is not strong enough. Please meet all criteria.');
      return;
    }

    try {
      setLoading(true);
      // If Admin, construct a placeholder email; otherwise use the entered email.
      const finalEmail = role === 'Admin' ? `${id.toUpperCase()}@portal.com` : email.trim();
      
      // FIX: Pass role and finalEmail to the register function
      await register(id.trim(), name, finalBranch, password.trim(), role, finalEmail); 
      
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const isStudentRole = role === 'Student';

  return (
    <div className="max-w-md mx-auto p-6 fade-in">
      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Student Academic Results Portal</h1>
          <h2 className="text-xl font-semibold text-secondary">User Registration</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Registering as</label>
            <div className="flex space-x-4">
                <button
                    type="button"
                    className={`flex-1 btn py-3 ${isStudentRole ? 'btn-primary' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setRole('Student')}
                >
                    Student
                </button>
                <button
                    type="button"
                    className={`flex-1 btn py-3 ${!isStudentRole ? 'btn-accent' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setRole('Admin')}
                >
                    Admin
                </button>
            </div>
          </div>
          
          {/* ID Input with context-specific placeholder */}
          <div className="form-group">
            <label htmlFor="studentId" className="form-label">{isStudentRole ? 'Student ID' : 'Admin ID'}</label>
            <input
              type="text"
              id="studentId"
              className="form-input"
              placeholder={`Enter your ${isStudentRole ? 'student ID (e.g., 28BC1A0500)' : 'Admin ID (e.g., ADM001)'}`}
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
            {isStudentRole && <p className="text-xs text-gray-500 mt-1">Format: YYBC1A05XX (YY=Year of joining)</p>}
            {!isStudentRole && <p className="text-xs text-gray-500 mt-1">Format: ADMxxx (e.g., ADM001).</p>} {/* FIX: Changed text-red-500 to text-gray-500 */}
          </div>
          
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-input"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {/* New Email Input Field (only for Student) */}
          {isStudentRole && (
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
          )}

          
          {/* Branch field only for Student role */}
          {isStudentRole && (
            <div className="form-group">
              <label htmlFor="branch" className="form-label">Branch</label>
              <select
                id="branch"
                className="form-input"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
              >
                <option value="">Select your branch</option>
                {branches.map((branchOption) => (
                  <option key={branchOption} value={branchOption}>
                    {branchOption}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input pr-10"
                placeholder="Create a password"
                value={password}
                onChange={handlePasswordChange}
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
            
            {password.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg grid grid-cols-2 gap-2">
                    {renderStrengthItem(passwordStrength.length, 'Min 8 Characters')}
                    {renderStrengthItem(passwordStrength.uppercase, 'One Uppercase')}
                    {renderStrengthItem(passwordStrength.lowercase, 'One Lowercase')}
                    {renderStrengthItem(passwordStrength.number, 'One Number')}
                    {renderStrengthItem(passwordStrength.special, 'One Special Character')}
                </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className="form-input pr-10"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                'Registering...'
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" />
                  Register
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/" className="text-primary hover:text-primary-dark font-medium">
                Login
             </Link>
             </p>
           </div>
         </form>
         
       </div>
     </div>
   );
 };
 
 export default Register;