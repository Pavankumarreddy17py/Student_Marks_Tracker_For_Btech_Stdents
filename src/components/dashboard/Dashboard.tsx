import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, ClipboardList, Award, PenTool, Loader2, Gauge } from 'lucide-react';
import SemesterCard from './SemesterCard';
import api from '../../services/api';
import { semesterSubjects, SubjectMaxMarks } from '../../data/subjects';

// --- Interfaces and Helper Functions (Copied/Adapted from ViewResults.tsx) ---

// Interface for API response mark data
export interface ApiMark {
  semester: number;
  internal_marks: number | null;
  external_marks: number | null;
  max_marks: number;
  subject_name: string;
  is_lab: boolean;
}
export interface GradeResult {
  grade: string;
  gradePoints: number;
}
export interface ProcessedResultDetail {
  subject: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  isLab: boolean;
  internalMarks: number;
  externalMarks: number;
  credits: number;
  grade: string;
  gradePoints: number;
  passStatus: 'Pass' | 'Fail' | 'Ab';
}

const getSubjectMaxMarks = (semester: number, subject: string, isLab: boolean): SubjectMaxMarks => {
  const config = semesterSubjects[semester];
  const DEFAULT_MARKS: SubjectMaxMarks = { total: 100, internal: 30, external: 70, credits: isLab ? 1.5 : 3 };
  if (!config) return DEFAULT_MARKS;
  
  const marksConfig = isLab ? config.maxMarks.lab : config.maxMarks.subject;
  
  if (typeof marksConfig === 'function') {
    return marksConfig(subject);
  }
  
  return (marksConfig || DEFAULT_MARKS) as SubjectMaxMarks;
};

const getGradeAndPoints = (percentage: number): GradeResult => {
  if (percentage >= 90) return { grade: 'S', gradePoints: 10 };
  if (percentage >= 80) return { grade: 'A', gradePoints: 9 };
  if (percentage >= 70) return { grade: 'B', gradePoints: 8 };
  if (percentage >= 60) return { grade: 'C', gradePoints: 7 };
  if (percentage >= 50) return { grade: 'D', gradePoints: 6 };
  if (percentage >= 40) return { grade: 'Y', gradePoints: 5 };
  return { grade: 'F', gradePoints: 0 };
};

const getPassStatus = (internalMarks: number, externalMarks: number, maxMarks: SubjectMaxMarks): 'Pass' | 'Fail' | 'Ab' => {
  const totalMarks = internalMarks + externalMarks;
  
  if (totalMarks === 0 && maxMarks.total > 0) return 'Ab'; 
  
  const totalPass = maxMarks.total * 0.4;
  const INT_PASS = maxMarks.internal === 60 ? 24 : 15;
  const EXT_PASS = maxMarks.external === 140 ? 56 : 25;

  const passedInternal = maxMarks.internal > 0 ? (internalMarks >= INT_PASS) : true;
  const passedExternal = maxMarks.external > 0 ? (externalMarks >= EXT_PASS) : true;
  
  const isStandardTheory = maxMarks.internal === 30 && maxMarks.external === 70;
  const specialCaseFail = isStandardTheory && (internalMarks <= 10 && externalMarks < 30);

  if (passedInternal && passedExternal && totalMarks >= totalPass && !specialCaseFail) {
      return 'Pass';
  }

  return 'Fail';
};

const calculateCGPA = (cumulativeGradePoints: number, cumulativeCreditsOffered: number, totalMarks: number, totalMaxMarks: number): number => {
  if (cumulativeCreditsOffered === 0) {
      const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks * 100) : 0;
      return percentage / 10;
  }
  return cumulativeGradePoints / cumulativeCreditsOffered;
};

// --- End of Helper Functions ---

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for results
  const [loadingResults, setLoadingResults] = useState(true);
  const [totalMarks, setTotalMarks] = useState(0);
  const [totalMaxMarks, setTotalMaxMarks] = useState(0);
  const [overallCGPA, setOverallCGPA] = useState(0);
  const [cumulativeCreditsOffered, setCumulativeCreditsOffered] = useState(0);

  const getCurrentYearText = useCallback((id: string | undefined): string => {
    if (!id) return '';
    const studentIdPrefix = id.substring(0, 2);
    
    if (studentIdPrefix === '28') return '1st Year';
    if (studentIdPrefix === '27') return '2nd Year';
    if (studentIdPrefix === '26') return '3rd Year';
    if (studentIdPrefix === '25') return '4th Year';
    
    return '';
  }, []);

  const currentYearText = getCurrentYearText(user?.id);

  const getSemestersToShow = useCallback(() => {
    if (!user) return 0;
    
    const studentIdPrefix = user.id.substring(0, 2);
    
    if (studentIdPrefix === '28') return 2; // 1st year
    if (studentIdPrefix === '27') return 4; // 2nd year
    if (studentIdPrefix === '26') return 6; // 3rd year
    if (studentIdPrefix === '25') return 8; // 4th year
    
    return 0;
  }, [user]);

  const semestersToShow = getSemestersToShow();

  // Load results logic
  const loadResults = useCallback(async () => {
    if (!user) return;
    setLoadingResults(true);
    
    try {
        const response = await api.get(`/marks/${user.id}`);
        const apiMarks: ApiMark[] = response.data;
        
        const resultsMap: Record<number, {
            totalMarks: number;
            totalMaxMarks: number;
            totalCreditsOffered: number;
            totalCreditsEarned: number;
            totalGradePoints: number;
            details: ProcessedResultDetail[];
        }> = {};

        apiMarks.forEach(mark => {
            if (!resultsMap[mark.semester]) {
                resultsMap[mark.semester] = {
                    totalMarks: 0,
                    totalMaxMarks: 0,
                    totalCreditsOffered: 0,
                    totalCreditsEarned: 0,
                    totalGradePoints: 0,
                    details: []
                };
            }
            
            const internalMark = mark.internal_marks ?? 0;
            const externalMark = mark.external_marks ?? 0;
            const totalMark = internalMark + externalMark;  

            const subjectMaxMarks = getSubjectMaxMarks(mark.semester, mark.subject_name, mark.is_lab);
            const maxMark = subjectMaxMarks.total;
            const creditsOffered = subjectMaxMarks.credits;

            const percentage = maxMark > 0 ? (totalMark / maxMark * 100) : 0;
            
            const passStatus = getPassStatus(internalMark, externalMark, subjectMaxMarks);

            const { gradePoints: calculatedGradePoints } = getGradeAndPoints(percentage);
            
            const finalGradePoints = passStatus === 'Pass' ? calculatedGradePoints : 0;
            const creditsEarned = passStatus === 'Pass' ? creditsOffered : 0;
            
            resultsMap[mark.semester].totalMarks += totalMark;
            resultsMap[mark.semester].totalMaxMarks += maxMark;
            resultsMap[mark.semester].totalCreditsOffered += creditsOffered;
            resultsMap[mark.semester].totalCreditsEarned += creditsEarned;
            resultsMap[mark.semester].totalGradePoints += (finalGradePoints * creditsOffered); 
        });

        let overallTotalM = 0;
        let overallTotalMaxM = 0;
        let overallTotalCreditsOffered = 0;
        let overallTotalGradePoints = 0;
        
        for (let i = 1; i <= semestersToShow; i++) {
            const result = resultsMap[i];
            if (result) {
                overallTotalM += result.totalMarks;
                overallTotalMaxM += result.totalMaxMarks;
                overallTotalCreditsOffered += result.totalCreditsOffered;
                overallTotalGradePoints += result.totalGradePoints;
            }
        }

        const cgpa = calculateCGPA(overallTotalGradePoints, overallTotalCreditsOffered, overallTotalM, overallTotalMaxM);

        setTotalMarks(overallTotalM);
        setTotalMaxMarks(overallTotalMaxM);
        setOverallCGPA(cgpa);
        setCumulativeCreditsOffered(overallTotalCreditsOffered);

    } catch (error) {
        console.error('Error loading results on dashboard:', error);
        setTotalMarks(0);
        setTotalMaxMarks(0);
        setOverallCGPA(0);
        setCumulativeCreditsOffered(0);
    } finally {
        setLoadingResults(false);
    }
  }, [user, semestersToShow]);

  // useEffect to load results on component mount/user change
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return (
    <div className="fade-in">
      <div className="card mb-6 bg-gradient-to-r from-primary to-secondary text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {/* MODIFIED: Display student's name and current year */}
          Welcome, {user?.name} 
          {currentYearText && <span className="text-xl ml-3 px-3 py-1 bg-white/20 rounded-full font-medium">{currentYearText}</span>}
        </h1>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-white/90">
          <p><span className="font-medium">ID:</span> {user?.id}</p>
          <p><span className="font-medium">Branch:</span> {user?.branch}</p>
          <p><span className="font-medium">Email:</span> {user?.email}</p> {/* ADDED email display */}
        </div>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-secondary mb-6 pb-2 border-b border-gray-200">
          Academic Dashboard
        </h2>
        
        {loadingResults ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 size={24} className="animate-spin mr-2" />
                Loading overall results...
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              
              <div className="bg-primary/10 rounded-lg p-4 flex items-center">
                <div className="rounded-full bg-primary p-3 mr-4">
                  <Award size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Semesters</h3>
                  <p className="text-2xl font-semibold">{semestersToShow}</p>
                </div>
              </div>
              
              {/* CGPA Card */}
              <div className="bg-accent/10 rounded-lg p-4 flex items-center">
                <div className="rounded-full bg-accent p-3 mr-4">
                  <Gauge size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Overall CGPA</h3>
                  <p className="text-2xl font-semibold">
                    {overallCGPA.toFixed(2)}/10
                  </p>
                </div>
              </div>
              
              {/* Total Marks Card */}
              <div className="bg-secondary/10 rounded-lg p-4 flex items-center">
                <div className="rounded-full bg-secondary p-3 mr-4">
                  <BookOpen size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Total Marks</h3>
                  <p className="text-2xl font-semibold">
                    {totalMarks} <span className="text-gray-500 text-lg">/{totalMaxMarks}</span>
                  </p>
                </div>
              </div>

              <div className="bg-info/10 rounded-lg p-4 flex items-center">
                <div className="rounded-full bg-info p-3 mr-4">
                  <ClipboardList size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Credits Offered</h3>
                  <p className="text-2xl font-semibold">{cumulativeCreditsOffered}</p>
                </div>
              </div>
            </div>
        )}
        
        <h2 className="text-xl font-semibold text-secondary mb-4">Semester Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: semestersToShow }, (_, i) => (
            <SemesterCard key={i} semesterNumber={i + 1} />
          ))}
        </div>
        
        <div className="flex flex-wrap gap-4 mt-8">
          <button
            onClick={() => navigate('/enter-marks')}
            className="btn btn-primary"
          >
            <PenTool size={20} className="mr-2" />
            Enter Marks
          </button>
          
          <button
            onClick={() => navigate('/view-results')}
            className="btn btn-secondary"
          >
            <BookOpen size={20} className="mr-2" />
            View Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;