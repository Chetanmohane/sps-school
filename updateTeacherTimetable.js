const fs = require('fs');
let content = fs.readFileSync('src/pages/operations-admin/TeacherExamTimetable.tsx', 'utf8');

// 1. Add teacherName 
content = content.replace(
  'const TeacherExamTimetable = () => {',
  'const TeacherExamTimetable = () => {\n  const teacherName = localStorage.getItem(\'userName\') || \'\';'
);

// 2. Add createdBy to formatting
content = content.replace(
  '    invigilator: e.invigilator || \'TBD\',',
  '    invigilator: e.invigilator || \'TBD\',\n    createdBy: e.createdBy || \'Admin\','
);

// 3. Highlight if invigilator matches
content = content.replace(
  '                  return (\\n                    <div key={item.id} style={{',
  '                  const isMyDuty = item.invigilator === teacherName;\n                  return (\n                    <div key={item.id} style={{'
);

content = content.replace(
  '                      border: \'1.5px solid var(--border-color)\',',
  '                      border: isMyDuty ? \'2px solid #3b82f6\' : \'1.5px solid var(--border-color)\',\n                      boxShadow: isMyDuty ? \'0 4px 12px rgba(59, 130, 246, 0.2)\' : \'none\','
);

content = content.replace(
  '                        <div style={{\\n                          background: \'#f0fdf4\',\\n                          border: \'1.5px solid #86efac\',',
  '                        {isMyDuty && <div style={{ fontSize: \'11px\', fontWeight: \'bold\', color: \'#3b82f6\', background: \'#dbeafe\', padding: \'4px 8px\', borderRadius: \'6px\', display: \'inline-block\', marginBottom: \'8px\' }}>dY?* Assigned to You</div>}\n                        <div style={{ fontSize: \'11px\', color: \'#6b7280\', marginBottom: \'8px\' }}>Scheduled By: {item.createdBy}</div>\n                        <div style={{\n                          background: \'#f0fdf4\',\n                          border: \'1.5px solid #86efac\','
);

fs.writeFileSync('src/pages/operations-admin/TeacherExamTimetable.tsx', content);
console.log('Modified TeacherExamTimetable.tsx');
