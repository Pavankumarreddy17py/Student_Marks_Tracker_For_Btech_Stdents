// pavankumarreddy17py/new_student/new_student-d688e7c55047da053678b264af35b08d6aa7159c/src/components/admin/AdminDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import AddSubject from './AddSubject';
import { semesterSubjects, SubjectMaxMarks } from '../../data/subjects';

// --- Interfaces and Helper Functions ---
interface ApiMark {
  semester: number;
  internal_marks: number | null;
  external_marks: number | null;
  max_marks: number;
  subject_name: string;
  is_lab: boolean;
}
interface ProcessedMark {
    subject: string;
    marks: number;
    maxMarks: number;
    percentage: number;
    isLab: boolean;
    credits: number;
    grade: string;
    passStatus: 'Pass' | 'Fail' | 'Ab';
    internalMarks: number;
    externalMarks: number;
}
interface StudentWithMarks {
    id: string;
    name: string;
    branch: string;
    email: string; // CORRECTED: Added email field
    marks: ApiMark[];
    overallPass: boolean; 
    overallPercentage: number;
}
interface Analytics {
    totalStudents: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
    failPercentage: number;
    scoreDistribution: {
        above90: number;
        above80: number;
        above70: number;
        above60: number;
        above50: number;
        above40: number;
        below40: number; 
    };
}
interface GradeResult {
  grade: string;
  gradePoints: number;
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
const calculateStudentResult = (marks: ApiMark[]): { totalMarks: number, totalMaxMarks: number, isOverallPass: boolean, overallPercentage: number } => {
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let hasFailed = false;
    marks.forEach(mark => {
        const internalMark = mark.internal_marks ?? 0;
        const externalMark = mark.external_marks ?? 0;
        const totalMark = internalMark + externalMark;
        const subjectMaxMarks = getSubjectMaxMarks(mark.semester, mark.subject_name, mark.is_lab);
        const maxMark = subjectMaxMarks.total;
        totalMarks += totalMark;
        totalMaxMarks += maxMark;
        const passStatus = getPassStatus(internalMark, externalMark, subjectMaxMarks);
        if (passStatus === 'Fail') {
            hasFailed = true;
        }
    });
    const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    return { 
        totalMarks, 
        totalMaxMarks, 
        isOverallPass: !hasFailed, 
        overallPercentage 
    };
};
// --- END CALCULATION HELPERS ---

// Component to represent a bar in the visualization placeholder
const ScoreBar: React.FC<{ label: string, value: number, total: number, color: string }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="text-sm">
            <div className="flex justify-between mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="font-semibold text-gray-900">{percentage.toFixed(2)}% ({value})</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

// Component to display a selected student's semester-wise marks
const StudentDetailView: React.FC<{ student: StudentWithMarks }> = ({ student }) => {
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

    const processMarksBySemester = (marks: ApiMark[]) => {
        const semesters = marks.reduce<Record<number, ProcessedMark[]>>((acc, mark) => {
            const internalMark = mark.internal_marks ?? 0;
            const externalMark = mark.external_marks ?? 0;
            const totalMark = internalMark + externalMark;
            
            const subjectMaxMarks = getSubjectMaxMarks(mark.semester, mark.subject_name, mark.is_lab);
            const maxMark = subjectMaxMarks.total;

            const percentage = maxMark > 0 ? (totalMark / maxMark * 100) : 0;
            const { grade } = getGradeAndPoints(percentage);
            const passStatus = getPassStatus(internalMark, externalMark, subjectMaxMarks);

            const processedMark: ProcessedMark = {
                subject: mark.subject_name,
                marks: totalMark,
                maxMarks: maxMark,
                percentage,
                isLab: mark.is_lab,
                credits: subjectMaxMarks.credits,
                grade,
                passStatus,
                internalMarks: internalMark,
                externalMarks: externalMark,
            };

            if (!acc[mark.semester]) acc[mark.semester] = [];
            acc[mark.semester].push(processedMark);
            return acc;
        }, {});
        
        // Sort semesters numerically
        return Object.keys(semesters).sort((a, b) => Number(a) - Number(b)).reduce<Record<number, ProcessedMark[]>>((acc, key) => {
            acc[Number(key)] = semesters[Number(key)];
            return acc;
        }, {});
    };

    const semesterResults = processMarksBySemester(student.marks);

    const getPassStatusClass = (status: 'Pass' | 'Fail' | 'Ab') => {
        if (status === 'Pass') return 'bg-green-100 text-green-700';
        if (status === 'Fail') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-secondary mb-4 border-b pb-2">
                {student.name}'s Semester Results
            </h3>
            
            {Object.keys(semesterResults).map(semKey => {
                const semester = Number(semKey);
                const details = semesterResults[semester];
                const semTotalMarks = details.reduce((sum, d) => sum + d.marks, 0);
                const semMaxMarks = details.reduce((sum, d) => sum + d.maxMarks, 0);
                
                return (
                    <div key={semester} className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                        <div
                            className={`p-4 flex items-center justify-between cursor-pointer ${
                                selectedSemester === semester ? 'bg-primary/10' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedSemester(selectedSemester === semester ? null : semester)}
                        >
                            <h4 className="font-medium">Semester {semester}</h4>
                            <div className="flex items-center gap-4 text-sm">
                                <span>{semTotalMarks}/{semMaxMarks}</span>
                                {selectedSemester === semester ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                        
                        {selectedSemester === semester && (
                            <div className="p-4 bg-white overflow-x-auto">
                                <table className="w-full min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Subject</th>
                                            <th className="p-2 text-center">Int/Ext</th>
                                            <th className="p-2 text-center">Total/Max</th>
                                            <th className="p-2 text-center">Credits</th>
                                            <th className="p-2 text-center">Grade</th>
                                            <th className="p-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.map((detail, index) => (
                                            <tr key={index} className={`${detail.isLab ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                                <td className="p-2 border-t">{detail.subject}</td>
                                                <td className="p-2 border-t text-center">{detail.internalMarks}/{detail.externalMarks}</td>
                                                <td className="p-2 border-t text-center">{detail.marks}/{detail.maxMarks}</td>
                                                <td className="p-2 border-t text-center">{detail.credits}</td>
                                                <td className={`p-2 border-t text-center font-semibold`}>
                                                    {detail.grade}
                                                </td>
                                                <td className="p-2 border-t text-center">
                                                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPassStatusClass(detail.passStatus)}`}>
                                                        {detail.passStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState(1);
    const [studentsData, setStudentsData] = useState<StudentWithMarks[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithMarks | null>(null);
    const years = [1, 2, 3, 4];

    const fetchAnalytics = useCallback(async (year: number) => {
        setLoading(true);
        setStudentsData([]);
        setAnalytics(null);
        setSelectedStudent(null);
        
        try {
            const response = await api.get(`/admin/analytics/${year}`);
            const studentsWithMarks: StudentWithMarks[] = response.data;

            if (studentsWithMarks.length === 0) {
                setStudentsData([]);
                setAnalytics({
                    totalStudents: 0,
                    passCount: 0,
                    failCount: 0,
                    passPercentage: 0,
                    failPercentage: 0,
                    scoreDistribution: { above90: 0, above80: 0, above70: 0, above60: 0, above50: 0, above40: 0, below40: 0 }
                });
                setLoading(false);
                return;
            }

            const processedStudents = studentsWithMarks.map(student => {
                const { isOverallPass, overallPercentage } = calculateStudentResult(student.marks);
                return {
                    ...student,
                    overallPass: isOverallPass,
                    overallPercentage: overallPercentage,
                };
            });
            
            const totalStudents = processedStudents.length;
            const passCount = processedStudents.filter(s => s.overallPass).length;
            const failCount = totalStudents - passCount;

            const scoreDistribution = {
                above90: processedStudents.filter(s => s.overallPercentage >= 90).length,
                above80: processedStudents.filter(s => s.overallPercentage >= 80).length,
                above70: processedStudents.filter(s => s.overallPercentage >= 70).length,
                above60: processedStudents.filter(s => s.overallPercentage >= 60).length,
                above50: processedStudents.filter(s => s.overallPercentage >= 50).length,
                above40: processedStudents.filter(s => s.overallPercentage >= 40).length,
                below40: processedStudents.filter(s => s.overallPercentage < 40).length,
            };

            setStudentsData(processedStudents);
            setAnalytics({
                totalStudents,
                passCount,
                failCount,
                passPercentage: (passCount / totalStudents) * 100,
                failPercentage: (failCount / totalStudents) * 100,
                scoreDistribution
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics(selectedYear);
    }, [selectedYear, fetchAnalytics]);
    
    const handleSubjectAdded = () => {
        fetchAnalytics(selectedYear); 
    };

    const yearSuffix = (year: number) => {
        if (year === 1) return 'st';
        if (year === 2) return 'nd';
        if (year === 3) return 'rd';
        return 'th';
    };

    return (
        <div className="fade-in">
            <div className="card bg-gradient-to-r from-accent to-secondary text-white mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-white/90">System-wide results and subject management.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* 1. Add Subject Panel */}
                <div className="lg:col-span-1">
                    <AddSubject onSubjectAdded={handleSubjectAdded} />
                </div>
                
                {/* 2. Analytics Panel (Year-wise filtering and display) */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-secondary flex items-center">
                                <TrendingUp size={20} className="mr-2" />
                                Overall Academic Analytics
                            </h2>
                            {/* Year Selection */}
                            <div className="inline-flex items-center">
                                <label htmlFor="year-select" className="mr-2 text-sm font-medium">Select Academic Year:</label>
                                <select
                                    id="year-select"
                                    className="form-input py-2 w-24"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}{yearSuffix(year)} Year</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-10 text-gray-500">
                                <Loader2 size={24} className="animate-spin mr-2" />
                                Fetching analytics for {selectedYear}{yearSuffix(selectedYear)} year...
                            </div>
                        )}

                        {analytics && (
                            <div className="space-y-6">
                                {/* Total Students */}
                                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <span className="text-lg font-medium text-gray-700 flex items-center">
                                        <Users size={20} className="mr-2" /> Total Students Analyzed
                                    </span>
                                    <span className="text-2xl font-bold text-primary">{analytics.totalStudents}</span>
                                </div>

                                {/* Pass/Fail Summary (Total Pass Count/Fail Count) */}
                                <h4 className="font-semibold text-primary">Total Pass/Fail Statistics</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-green-700 flex items-center"><CheckCircle size={18} className="mr-2"/> Pass Count</span>
                                            <span className="text-2xl font-bold text-green-600">{analytics.passCount}</span>
                                        </div>
                                        <p className="text-sm text-green-600 mt-1">{analytics.passPercentage.toFixed(2)}%</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-red-700 flex items-center"><XCircle size={18} className="mr-2"/> Fail Count</span>
                                            <span className="text-2xl font-bold text-red-600">{analytics.failCount}</span>
                                        </div>
                                        <p className="text-sm text-red-600 mt-1">{analytics.failPercentage.toFixed(2)}%</p>
                                    </div>
                                </div>
                                
                                {/* Score Distribution (Visualization Placeholder) */}
                                <h4 className="font-semibold text-primary pt-2 border-t mt-4">Score Distribution (Overall Percentage)</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="p-3 bg-white border rounded">
                                        <h5 className="font-medium mb-2">Percentage of Students by Score Bracket (Chart Placeholder)</h5>
                                        {analytics.totalStudents > 0 ? (
                                            <div className="space-y-3">
                                                <ScoreBar label="Above 90% (S Grade)" value={analytics.scoreDistribution.above90} total={analytics.totalStudents} color="bg-green-500" />
                                                <ScoreBar label="Above 80% (A Grade)" value={analytics.scoreDistribution.above80} total={analytics.totalStudents} color="bg-blue-500" />
                                                <ScoreBar label="Above 70% (B Grade)" value={analytics.scoreDistribution.above70} total={analytics.totalStudents} color="bg-cyan-500" />
                                                <ScoreBar label="Above 60% (C Grade)" value={analytics.scoreDistribution.above60} total={analytics.totalStudents} color="bg-yellow-500" />
                                                <ScoreBar label="Above 50% (D Grade)" value={analytics.scoreDistribution.above50} total={analytics.totalStudents} color="bg-orange-500" />
                                                <ScoreBar label="Above 40% (Pass)" value={analytics.scoreDistribution.above40} total={analytics.totalStudents} color="bg-gray-500" />
                                                <ScoreBar label="Below 40% (Fail)" value={analytics.scoreDistribution.below40} total={analytics.totalStudents} color="bg-red-600" /> 
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500">No data available for score distribution.</p>
                                        )}
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-500 italic pt-4 border-t">
                                    *Note: Charts/graphs are represented by score bars as a dedicated charting library cannot be installed.
                                </p>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>

            {/* Student Details Table (View all student details year-wise) */}
            <div className="card mt-6">
                <h2 className="text-xl font-semibold text-secondary mb-4 pb-2 border-b border-gray-200">
                    Student Records for {selectedYear}{yearSuffix(selectedYear)} Year ({studentsData.length})
                </h2>
                
                {loading && <div className="text-center text-gray-500">Loading student details...</div>}

                {!loading && studentsData.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Student ID</th>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Branch</th>
                                    <th scope="col" className="px-6 py-3">Email</th> {/* ADDED Email Header */}
                                    <th scope="col" className="px-6 py-3">Overall %</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Subjects</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsData.map((student) => (
                                    <tr 
                                        key={student.id} 
                                        className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedStudent(student)} // Set selected student
                                    >
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.id}</th>
                                        <td className="px-6 py-4 font-semibold text-primary/70 hover:text-primary">
                                            {student.name}
                                        </td>
                                        <td className="px-6 py-4">{student.branch}</td>
                                        <td className="px-6 py-4 text-xs">{student.email}</td> {/* ADDED Email Data */}
                                        <td className="px-6 py-4 font-semibold">{student.overallPercentage.toFixed(2)}%</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                student.overallPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {student.overallPass ? 'PASS' : 'FAIL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{student.marks.length}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && studentsData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No student data found for the selected year.
                    </div>
                )}
            </div>

            {/* Student Detail View Section (Modal) */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                        <div className="sticky top-0 bg-primary text-white p-4 flex items-center justify-between border-b border-gray-200">
                            <h2 className="text-xl font-bold">Results for {selectedStudent.name} ({selectedStudent.id})</h2>
                            <button 
                                onClick={() => setSelectedStudent(null)}
                                className="text-white hover:text-red-300 font-bold text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6">
                            <StudentDetailView student={selectedStudent} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;