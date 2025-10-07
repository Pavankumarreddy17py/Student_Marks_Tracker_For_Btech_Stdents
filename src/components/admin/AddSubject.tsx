import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Save, PlusCircle } from 'lucide-react';
import api from '../../services/api';

interface AddSubjectProps {
    onSubjectAdded: () => void;
}

const AddSubject: React.FC<AddSubjectProps> = ({ onSubjectAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 1,
    credits: 3,
    maxInternal: 30,
    passInternal: 15,
    maxExternal: 70,
    passExternal: 25,
    isLab: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.passInternal > formData.maxInternal || formData.passExternal > formData.maxExternal) {
        toast.error("Pass marks cannot exceed maximum marks.");
        setLoading(false);
        return;
    }

    try {
        const response = await api.post('/admin/subjects', formData);
        toast.success(response.data.message || 'Subject added successfully!');
        setFormData(prev => ({ ...prev, name: '', code: '' })); // Clear name/code
        onSubjectAdded(); // Notify parent
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to add subject.');
        console.error('Add Subject error:', error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="card">
        <h3 className="text-xl font-semibold text-accent mb-4 flex items-center">
            <PlusCircle size={20} className="mr-2" />
            Add New Subject
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            <div className="form-group col-span-full">
                <label htmlFor="name" className="form-label">Subject Name</label>
                <input type="text" id="name" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label htmlFor="code" className="form-label">Subject Code</label>
                <input type="text" id="code" name="code" className="form-input" value={formData.code} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
                <label htmlFor="semester" className="form-label">Semester</label>
                <input type="number" id="semester" name="semester" className="form-input" value={formData.semester} onChange={handleChange} min={1} max={8} required />
            </div>
            
            <div className="form-group">
                <label htmlFor="credits" className="form-label">Credits</label>
                <input type="number" id="credits" name="credits" className="form-input" value={formData.credits} onChange={handleChange} min={0.5} max={12} step={0.5} required />
            </div>
            
            <div className="form-group flex items-center col-span-full">
                <input type="checkbox" id="isLab" name="isLab" className="mr-2" checked={formData.isLab} onChange={handleChange} />
                <label htmlFor="isLab" className="form-label mb-0">Is Lab Subject?</label>
            </div>
            
            <h4 className="text-lg font-medium text-primary col-span-full mt-4 border-b pb-2">Marks Configuration</h4>
            
            {/* Internal Marks */}
            <div className="form-group">
                <label htmlFor="maxInternal" className="form-label">Max Internal Marks</label>
                <input type="number" id="maxInternal" name="maxInternal" className="form-input" value={formData.maxInternal} onChange={handleChange} min={0} required />
            </div>
            <div className="form-group">
                <label htmlFor="passInternal" className="form-label">Pass Internal Marks</label>
                <input type="number" id="passInternal" name="passInternal" className="form-input" value={formData.passInternal} onChange={handleChange} min={0} required />
            </div>

            {/* External Marks */}
            <div className="form-group">
                <label htmlFor="maxExternal" className="form-label">Max External Marks</label>
                <input type="number" id="maxExternal" name="maxExternal" className="form-input" value={formData.maxExternal} onChange={handleChange} min={0} required />
            </div>
            <div className="form-group">
                <label htmlFor="passExternal" className="form-label">Pass External Marks</label>
                <input type="number" id="passExternal" name="passExternal" className="form-input" value={formData.passExternal} onChange={handleChange} min={0} required />
            </div>

            <div className="mt-4 col-span-full">
                <p className="text-sm text-gray-600 mb-2">Total Max Marks: {formData.maxInternal + formData.maxExternal}</p>
                <p className="text-sm text-gray-600 mb-4">Total Pass Marks: {formData.passInternal + formData.passExternal}</p>
            </div>

            <div className="col-span-full">
                <button 
                    type="submit" 
                    className="btn btn-accent flex items-center justify-center"
                    disabled={loading}
                >
                    {loading ? (
                        'Adding Subject...'
                    ) : (
                        <>
                            <Save size={20} className="mr-2" />
                            Add Subject
                        </>
                    )}
                </button>
            </div>
        </form>
    </div>
  );
};

export default AddSubject;