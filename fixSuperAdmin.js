const fs = require('fs');
let content = fs.readFileSync('src/pages/operations-admin/SuperAdminDashboard.tsx', 'utf8');

content = content.replace(
  'const ExamTimetableTab: React.FC<{ exams: any[], setExams: any, loading: boolean, setLoading: any, fetchExams: any }> = ({ exams, setExams, loading, setLoading, fetchExams }) => {',
  'const ExamTimetableTab: React.FC = () => {\n  const [exams, setExams] = useState<any[]>([]);\n  const [loading, setLoading] = useState(false);'
);

fs.writeFileSync('src/pages/operations-admin/SuperAdminDashboard.tsx', content);
console.log('Fixed SuperAdminDashboard.tsx');
