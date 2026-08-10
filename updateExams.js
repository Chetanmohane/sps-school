const fs = require('fs');
let content = fs.readFileSync('src/pages/operations-admin/Exams.tsx', 'utf8');

content = content.replace(
  '  const [exams, setExams] = useState<any[]>([]);',
  '  const [exams, setExams] = useState<any[]>([]);\n  const [teachers, setTeachers] = useState<any[]>([]);\n  const [editingExam, setEditingExam] = useState<any>(null);'
);

content = content.replace(
  '  const fetchExams = async () => {',
  '  const fetchTeachers = async () => {\n    try {\n      const res = await API.get(\'/api/academic-admin/teachers\');\n      if(res.data?.data) setTeachers(res.data.data);\n    } catch (e) { console.error(\'Error fetching teachers\', e); }\n  };\n\n  const fetchExams = async () => {'
);

content = content.replace(
  '  useEffect(() => {\n    fetchExams();\n  }, []);',
  '  useEffect(() => {\n    fetchExams();\n    fetchTeachers();\n  }, []);'
);

// Update Invigilator input in CREATE form
content = content.replace(
  '<label style={labelStyle}>Invigilator Duty</label>\\n                      <input type=\"text\" placeholder=\"e.g. Mr. Smith\" value={row.invigilator} onChange={e => updateSubjectRow(idx, \'invigilator\', e.target.value)} style={inputStyle} />',
  '<label style={labelStyle}>Invigilator Duty</label>\\n                      <select value={row.invigilator} onChange={e => updateSubjectRow(idx, \'invigilator\', e.target.value)} style={inputStyle}>\\n                        <option value=\"\">-- Select Teacher --</option>\\n                        {teachers.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}\\n                      </select>'
);

// Add Created By column
content = content.replace(
  '<th>Max Marks</th>\\n                        <th>Invigilator</th>\\n                        <th>Action</th>',
  '<th>Max Marks</th>\\n                        <th>Invigilator</th>\\n                        <th>Created By</th>\\n                        <th>Action</th>'
);

content = content.replace(
  '<td>{exam.maxMarks || 100}</td>\\n                          <td>{exam.invigilator || \'TBD\'}</td>\\n                          <td>\\n                            <button onClick={() => handleDelete(exam._id)} className=\"action-btn delete\">Delete</button>\\n                          </td>',
  '<td>{exam.maxMarks || 100}</td>\\n                          <td>{exam.invigilator || \'TBD\'}</td>\\n                          <td>{exam.createdBy || \'Admin\'}</td>\\n                          <td style={{ display: \'flex\', gap: \'8px\' }}>\\n                            <button onClick={() => setEditingExam(exam)} className=\"action-btn\" style={{ backgroundColor: \'#3b82f6\', color: \'white\' }}>Edit</button>\\n                            <button onClick={() => handleDelete(exam._id)} className=\"action-btn delete\">Delete</button>\\n                          </td>'
);

fs.writeFileSync('src/pages/operations-admin/Exams.tsx', content);
console.log('Modified Exams.tsx');
