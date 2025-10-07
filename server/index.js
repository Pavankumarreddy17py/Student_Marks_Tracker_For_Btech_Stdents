import 'dotenv/config'; // 1. Load ENV first
import express from 'express';
import cors from 'cors';
import { getPool } from './db.js'; // 2. Import the getter function
const app = express();

// --- GLOBAL UNHANDLED ERROR CATCHING ---
// These listeners capture any errors that would otherwise silently crash the Node.js process
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    // We log the error but keep the process alive in case it's a minor transient error.
    // In a real production app, you might choose to exit(1) here.
});

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    // This is the most dangerous type of error; we log it and exit.
    process.exit(1);
});
// ----------------------------------------

app.use(cors());
app.use(express.json());

// FIX: Initialize the pool object by calling the getter function inside a try/catch
let pool;
try {
    pool = getPool(); 
    
    // Test the connection immediately after getting the pool
    pool.query('SELECT 1 + 1 AS solution')
        .then(() => {
            console.log("✅ Database connection test successful.");
        })
        .catch(dbErr => {
            console.error("❌ Database Connection FAILED:", dbErr.message);
            // This is likely the cause of your server stopping. Log extensively.
            throw new Error("Database initialization failed. Check credentials/server status.");
        });

} catch (e) {
    console.error("❌ FATAL INITIALIZATION ERROR: Cannot instantiate MySQL pool:", e.message);
    process.exit(1); // Exit if pool creation fails synchronously
}

// MARK: HELPER: Dynamically determine the marks table name (partitioning)
const getMarksTableName = (studentId) => {
    const batchPrefix = studentId.substring(0, 2);
    if (['25', '26', '27', '28'].includes(batchPrefix)) {
        return `marks_${batchPrefix}`;
    }
    throw new Error(`Invalid student ID prefix: ${batchPrefix}`);
};


// Auth routes - All database interactions below now correctly use the 'pool' instance.
app.post('/api/auth/register', async (req, res) => {
  try {
    const { id, name, branch, password, email: clientEmail, role } = req.body; 
    
    const finalRole = role || 'Student'; 
    const email = clientEmail || `${id.toLowerCase()}@student.portal.com`; 

    if (finalRole === 'Student') {
      const [existingStudent] = await pool.query('SELECT id, email FROM students WHERE id = ? OR email = ?', [id, email]);
      
      if (existingStudent.length > 0) {
        const existsById = existingStudent.some(s => s.id === id);
        if (existsById) {
          return res.status(400).json({ message: 'Student ID already exists' });
        } else if (existingStudent.some(s => s.email === email)) {
          return res.status(400).json({ message: 'Email address is already in use' });
        }
      }
      
      await pool.query(
        'INSERT INTO students (id, name, branch, password, email) VALUES (?, ?, ?, ?, ?)',
        [id, name, branch, password, email]
      );

    } else if (finalRole === 'Admin') {
      const [existingAdmin] = await pool.query('SELECT id FROM admins WHERE id = ?', [id]);
      if (existingAdmin.length > 0) {
        return res.status(400).json({ message: 'Admin ID already exists' });
      }

      await pool.query(
        'INSERT INTO admins (id, name, password) VALUES (?, ?, ?)',
        [id, name, password]
      );
      
    } else {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }
    
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error); 
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    
    const trimmedId = id.trim();
    const trimmedPassword = password.trim();

    let user;

    // 1. Try finding in the STUDENTS table
    const [studentUser] = await pool.query(
      'SELECT id, name, branch, email FROM students WHERE id = ? AND BINARY password = ?', 
      [trimmedId, trimmedPassword]
    );

    if (studentUser.length > 0) {
      user = { ...studentUser[0], role: 'Student' };
    } else {
      // 2. If not found, try finding in the ADMINS table
      const [adminUser] = await pool.query(
        'SELECT id, name FROM admins WHERE id = ? AND BINARY password = ?',
        [trimmedId, trimmedPassword]
      );

      if (adminUser.length > 0) {
        user = { ...adminUser[0], branch: 'N/A', role: 'Admin', email: `${adminUser[0].id}@portal.com` };
      }
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/marks/:semester', async (req, res) => {
  try {
    const semester = parseInt(req.params.semester, 10);
    const { studentId, marks } = req.body; 
    
    if (!studentId || !marks || Object.keys(marks).length === 0) {
        return res.status(400).json({ message: 'Invalid mark submission data: Missing student ID or marks.' });
    }
    
    const marksTableName = getMarksTableName(studentId);

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete existing marks using dynamic table name
      await connection.query(
        `DELETE FROM ${marksTableName} WHERE student_id = ? AND semester = ?`,
        [studentId, semester]
      );
      
      for (const [subjectIdString, markSplit] of Object.entries(marks)) {
        const subjectId = parseInt(subjectIdString, 10);
        
        const rawInternal = markSplit ? markSplit.internal : 0;
        const rawExternal = markSplit ? markSplit.external : 0;
        
        const internal = Math.max(0, parseInt(rawInternal, 10) || 0);
        const external = Math.max(0, parseInt(rawExternal, 10) || 0);

        if (internal === 0 && external === 0) continue; 
        
        // Insert using dynamic table name
        await connection.query(
          `INSERT INTO ${marksTableName} (student_id, subject_id, internal_marks, external_marks, semester) VALUES (?, ?, ?, ?, ?)`,
          [studentId, subjectId, internal, external, semester]
        );
      }
      
      await connection.commit();
      res.json({ message: 'Marks saved successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('CRITICAL SQL ERROR DURING MARKS INSERTION:', error); 
      res.status(500).json({ message: 'Server error occurred during save. Check console for SQL details.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving marks (Outer Catch):', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/api/marks/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const marksTableName = getMarksTableName(studentId);
    
    // Fetch from dynamic marks table
    const [marks] = await pool.query(
      `SELECT m.semester, m.internal_marks, m.external_marks, s.name as subject_name, s.max_marks, s.is_lab 
       FROM ${marksTableName} m 
       JOIN subjects s ON m.subject_id = s.id 
       WHERE m.student_id = ?`,
      [studentId]
    );
    
    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/subjects', async (req, res) => {
  try {
    const { name, code, semester, maxInternal, maxExternal, isLab } = req.body;
    
    const max_marks = maxInternal + maxExternal;
    
    const [existingSubject] = await pool.query(
        'SELECT id FROM subjects WHERE code = ?',
        [code]
    );

    if (existingSubject.length > 0) {
      return res.status(400).json({ message: 'Subject code already exists.' });
    }
    
    await pool.query(
      'INSERT INTO subjects (name, code, semester, max_marks, is_lab) VALUES (?, ?, ?, ?, ?)',
      [name, code, semester, max_marks, isLab]
    );
    
    res.status(201).json({ 
      message: 'Subject added successfully.',
    });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ message: 'Server error occurred while processing subject insertion.' });
  }
});


app.get('/api/admin/analytics/:year', async (req, res) => {
  try {
    const targetYear = parseInt(req.params.year, 10);
    if (isNaN(targetYear) || targetYear < 1 || targetYear > 4) {
      return res.status(400).json({ message: 'Invalid academic year (must be 1-4).' });
    }

    const yearToPrefix = { 1: '28', 2: '27', 3: '26', 4: '25' };
    const idPrefix = yearToPrefix[targetYear];
    
    if (!idPrefix) {
        return res.status(400).json({ message: 'No batch found for the specified academic year.' });
    }
    
    const marksTableName = getMarksTableName(idPrefix + '00000000'); 

    // 1. Fetch all students for the given batch from the unified 'students' table
    const [students] = await pool.query(
        'SELECT id, name, branch, email FROM students WHERE id LIKE ?',
        [`${idPrefix}%`]
    );
    
    if (students.length === 0) {
        return res.json([]);
    }
    
    const studentIds = students.map(s => s.id);

    // 2. Fetch all marks and subjects for these students from the dynamic marks table
    const [allMarks] = await pool.query(
        `SELECT m.student_id, m.semester, m.internal_marks, m.external_marks, s.name as subject_name, s.max_marks, s.is_lab 
         FROM ${marksTableName} m 
         JOIN subjects s ON m.subject_id = s.id 
         WHERE m.student_id IN (?)`,
        [studentIds]
    );
    
    // 3. Aggregate data per student
    const aggregatedData = students.reduce((map, student) => {
        map[student.id] = { ...student, marks: [] }; 
        return map;
    }, {});
    
    allMarks.forEach(mark => {
        const studentId = mark.student_id;
        if (aggregatedData[studentId]) {
            aggregatedData[studentId].marks.push(mark);
        }
    });

    res.json(Object.values(aggregatedData));
    
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});