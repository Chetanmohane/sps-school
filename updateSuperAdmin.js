const fs = require('fs');
let content = fs.readFileSync('src/pages/operations-admin/SuperAdminDashboard.tsx', 'utf8');

// 1. Add state for studentToDelete
content = content.replace(
  'const [statusType, setStatusType] = useState<\'success\' | \'error\'>(\'success\');',
  'const [statusType, setStatusType] = useState<\'success\' | \'error\'>(\'success\');\n  const [studentToDelete, setStudentToDelete] = useState<any>(null);'
);

// 2. Modify deleteStudent to just open the modal instead
content = content.replace(
  'const deleteStudent = (id: any) => { if(!window.confirm(\'Delete this student?\')) return; setStudents(p=>p.filter(s=>s.id!==id)); trigger(\'Student deleted.\'); };',
  'const deleteStudent = (id: any) => { setStudentToDelete(id); };\n  const confirmDeleteStudent = async () => {\n    if(!studentToDelete) return;\n    try {\n      await API.delete(\/api/admin/student-admin/students/\\);\n      trigger(\'Student deleted successfully!\');\n      fetchStudents();\n    } catch (err) {\n      trigger(\'Failed to delete student\', \'error\');\n    }\n    setStudentToDelete(null);\n  };'
);

// 3. Add the modal at the end of the return statement
content = content.replace(
  '      </main>\n    </div>',
  '      </main>\n\n      {/* Custom Delete Confirm Modal */}\n      {studentToDelete && (\n        <div style={{ position: \'fixed\', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: \'rgba(0,0,0,0.5)\', zIndex: 9999, display: \'flex\', justifyContent: \'center\', alignItems: \'center\' }}>\n          <div style={{ background: \'var(--card-bg)\', padding: \'24px\', borderRadius: \'12px\', width: \'350px\', boxShadow: \'0 10px 25px rgba(0,0,0,0.2)\', textAlign: \'center\' }}>\n            <div style={{ color: \'#ef4444\', marginBottom: \'16px\' }}>\n              <FiTrash2 size={40} />\n            </div>\n            <h3 style={{ margin: \'0 0 8px 0\' }}>Delete Student</h3>\n            <p style={{ margin: \'0 0 24px 0\', color: \'var(--text-muted)\', fontSize: \'14px\' }}>Are you sure you want to delete this student? This action cannot be undone.</p>\n            <div style={{ display: \'flex\', gap: \'12px\' }}>\n              <button onClick={() => setStudentToDelete(null)} style={{ flex: 1, padding: \'10px\', borderRadius: \'8px\', border: \'1px solid var(--border-color)\', backgroundColor: \'transparent\', cursor: \'pointer\', fontWeight: \'bold\' }}>Cancel</button>\n              <button onClick={confirmDeleteStudent} style={{ flex: 1, padding: \'10px\', borderRadius: \'8px\', border: \'none\', backgroundColor: \'#ef4444\', color: \'white\', cursor: \'pointer\', fontWeight: \'bold\' }}>Delete</button>\n            </div>\n          </div>\n        </div>\n      )}\n\n    </div>'
);

fs.writeFileSync('src/pages/operations-admin/SuperAdminDashboard.tsx', content);
console.log('Modified SuperAdminDashboard.tsx');
