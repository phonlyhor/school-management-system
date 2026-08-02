import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { createStudentScore } from '../../services/scoreService';
import { getClassStudents } from '../../services/teacherService';
import { getAssessments } from '../../services/assessmentService';
import { exportToCSV } from '../../utils/excelExporter';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Scores = () => {
    const [schedule, setSchedule] = useState([]);
    const [assessments, setAssessments] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState('');
    
    const [students, setStudents] = useState([]);
    const [scoresData, setScoresData] = useState({}); // { student_id: score }
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [schedRes, assRes] = await Promise.all([
                    api.get('/teacher/schedule'),
                    getAssessments()
                ]);
                setSchedule(schedRes.data.schedule || []);
                setAssessments(assRes.data.assessments || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load initial data.");
            }
        };
        fetchInitialData();
    }, []);

    // Extract unique classes from schedule
    const uniqueClasses = Array.from(new Map(schedule.map(item => [item.class.id, item.class])).values());
    
    // Extract unique subjects for the selected class
    const availableSubjects = Array.from(new Map(
        schedule
            .filter(item => item.class.id === parseInt(selectedClass))
            .map(item => [item.subject.id, item.subject])
    ).values());

    const handleLoadStudents = async () => {
        if (!selectedClass || !selectedSubject || !selectedAssessment) {
            toast.error("Please select a class, subject, and assessment.");
            return;
        }

        setLoading(true);
        try {
            const res = await getClassStudents(selectedClass);
            const studentList = res.data.students || [];
            setStudents(studentList);
            
            // Initialize scores data
            const initialData = {};
            studentList.forEach(s => {
                initialData[s.id] = '';
            });
            setScoresData(initialData);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load students.");
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentId, value) => {
        setScoresData(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleSubmit = async () => {
        if (students.length === 0) return;
        setIsSubmitting(true);
        
        // Filter out empty scores
        const studentsWithScores = students.filter(s => scoresData[s.id] !== '');
        
        if (studentsWithScores.length === 0) {
            toast.error("No scores to submit.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Submit scores one by one since backend doesn't support bulk score submission
            await Promise.all(studentsWithScores.map(student => 
                createStudentScore({
                    student_id: student.id,
                    subject_id: selectedSubject,
                    assessment_id: selectedAssessment,
                    score: scoresData[student.id]
                })
            ));

            toast.success(`Successfully saved ${studentsWithScores.length} scores!`);
            // Clear inputs
            setScoresData(prev => {
                const cleared = { ...prev };
                studentsWithScores.forEach(s => { cleared[s.id] = ''; });
                return cleared;
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to save some or all scores. Check if they already exist.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentMaxScore = assessments.find(a => a.id === parseInt(selectedAssessment))?.max_score || 100;

    const columns = [
        { header: 'Student ID', render: (row) => row.student_code },
        { header: 'Name', render: (row) => row.user?.name },
        { 
            header: `Score (Max: ${currentMaxScore})`, 
            render: (row) => (
                <div style={{ maxWidth: '150px' }}>
                    <Input 
                        type="number" 
                        min="0" 
                        max={currentMaxScore}
                        value={scoresData[row.id]} 
                        onChange={(e) => handleScoreChange(row.id, e.target.value)}
                        placeholder="Enter score"
                    />
                </div>
            )
        }
    ];

    const handleExportScoresExcel = () => {
        if (!students || students.length === 0) {
            toast.error("មិនទាន់មានបញ្ជីសិស្សសម្រាប់ទាញយកទេ! (No students loaded)");
            return;
        }

        const className = uniqueClasses.find(c => c.id === parseInt(selectedClass))?.name || 'Class';
        const subjectName = availableSubjects.find(s => s.id === parseInt(selectedSubject))?.name || 'Subject';
        const assessmentName = assessments.find(a => a.id === parseInt(selectedAssessment))?.name || 'Assessment';

        const exportCols = [
            { header: 'កូដសិស្ស (Student ID)', accessor: 'student_code' },
            { header: 'ឈ្មោះសិស្ស (Student Name)', renderText: (s) => s.user?.name || s.name },
            { header: 'អ៊ីមែល (Email)', renderText: (s) => s.user?.email || '-' },
            { header: 'ថ្នាក់រៀន (Class)', renderText: () => className },
            { header: 'មុខវិជ្ជា (Subject)', renderText: () => subjectName },
            { header: 'ការវាយតម្លៃ (Assessment)', renderText: () => assessmentName },
            { header: `ពិន្ទុ (Score Max: ${currentMaxScore})`, renderText: (s) => scoresData[s.id] !== undefined ? scoresData[s.id] : '' },
        ];

        exportToCSV(`Student_Scores_${className}_${subjectName}_${new Date().toISOString().slice(0, 10)}.csv`, exportCols, students);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Grade Students (វាយតម្លៃពិន្ទុសិស្ស)</h1>
                {students.length > 0 && (
                    <Button variant="secondary" onClick={handleExportScoresExcel}>
                        📥 Export Excel
                    </Button>
                )}
            </div>

            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Class</label>
                        <select 
                            value={selectedClass} 
                            onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        >
                            <option value="">-- Select Class --</option>
                            {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject</label>
                        <select 
                            value={selectedSubject} 
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            disabled={!selectedClass}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', opacity: !selectedClass ? 0.5 : 1 }}
                        >
                            <option value="">-- Select Subject --</option>
                            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assessment</label>
                        <select 
                            value={selectedAssessment} 
                            onChange={(e) => setSelectedAssessment(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        >
                            <option value="">-- Select Assessment --</option>
                            {assessments.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                        </select>
                    </div>

                    <Button onClick={handleLoadStudents} disabled={loading || !selectedClass || !selectedSubject || !selectedAssessment}>
                        {loading ? 'Loading...' : 'Load Students'}
                    </Button>
                </div>

                {students.length > 0 ? (
                    <>
                        <Table columns={columns} data={students} />
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="secondary" onClick={handleExportScoresExcel}>
                                📥 Export Excel
                            </Button>
                            <Button size="large" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving Scores...' : 'Submit Scores'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <p>Please select a class, subject, and assessment, then click "Load Students" to input grades.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Scores;
