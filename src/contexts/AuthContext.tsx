// pavankumarreddy17py/new_student/new_student-9a3027dd43212820b04ae638d62d597218768eb3/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { semesterSubjects } from '../data/subjects'; // Import subjects data for subject list retrieval

interface User {
  id: string;
  name: string;
  branch: string;
  email: string;
  role: 'Student' | 'Admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (id: string, password: string) => Promise<User>; // FIX: Explicitly returns Promise<User>
  register: (id: string, name: string, branch: string, password: string, role: 'Student' | 'Admin', email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get subject ID (needed for mark saving later)
const getSubjectIdMap = () => {
  const subjectMap: Record<string, string> = {};
  let currentId = 1;

  for (const semester in semesterSubjects) {
    const config = semesterSubjects[Number(semester)];
    
    // Subjects
    config.subjects.forEach(subject => {
      const key = subject.toLowerCase().replace(/\s+/g, '-');
      subjectMap[key] = (currentId++).toString();
    });

    // Labs
    if (config.labs) {
      config.labs.forEach(lab => {
        const key = lab.toLowerCase().replace(/\s+/g, '-');
        subjectMap[key] = (currentId++).toString();
      });
    }
  }
  return subjectMap;
};

const subjectIdMap = getSubjectIdMap();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    }
  }, []);

  // FIX: The login function is updated to return the User object.
  const login = async (id: string, password: string): Promise<User> => {
    try {
      const response = await api.post('/auth/login', { id, password });
      
      const loggedInUser: User = response.data;
      
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      
      return loggedInUser; // REQUIRED: Returns user object for redirection logic
      
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (id: string, name: string, branch: string, password: string, role: 'Student' | 'Admin', email: string) => {
    try {
      await api.post('/auth/register', { id, name, branch, password, role, email });
      
      // Auto-login after successful registration (Note: This is technically redundant if login is called after, but follows the original pattern)
      const newUser: User = { id, name, branch, email, role };
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(newUser));

    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the subject map for use in other components like EnterMarks
export { subjectIdMap };