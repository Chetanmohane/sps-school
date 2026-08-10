const fs = require('fs');
let content = fs.readFileSync('src/pages/operations-admin/ManageTimetable.tsx', 'utf8');

content = content.replace(
  '{/* Custom Delete Confirm Modal */}\n        {scheduleToDelete && (\n          <div style={{ position: \\'fixed\\', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: \\'rgba(0,0,0,0.5)\\', zIndex: 9999, display: \\'flex\\', justifyContent: \\'center\\', alignItems: \\'center\\' }}>\n            <div style={{ background: \\'var(--card-bg)\\', padding: \\'24px\\', borderRadius: \\'12px\\', width: \\'350px\\', boxShadow: \\'0 10px 25px rgba(0,0,0,0.2)\\', textAlign: \\'center\\' }}>\n              <div style={{ color: \\'#ef4444\\', marginBottom: \\'16px\\' }}>\n                <FiTrash2 size={40} />\n              </div>\n              <h3 style={{ margin: \\'0 0 8px 0\\' }}>Delete Timetable</h3>\n              <p style={{ margin: \\'0 0 24px 0\\', color: \\'var(--text-muted)\\', fontSize: \\'14px\\' }}>Are you sure you want to delete this day\\'s timetable? This action cannot be undone.</p>\n              <div style={{ display: \\'flex\\', gap: \\'12px\\' }}>\n                <button onClick={() => setScheduleToDelete(null)} style={{ flex: 1, padding: \\'10px\\', borderRadius: \\'8px\\', border: \\'1px solid var(--border-color)\\', backgroundColor: \\'transparent\\', cursor: \\'pointer\\', fontWeight: \\'bold\\' }}>Cancel</button>\n                <button onClick={confirmDeleteSchedule} style={{ flex: 1, padding: \\'10px\\', borderRadius: \\'8px\\', border: \\'none\\', backgroundColor: \\'#ef4444\\', color: \\'white\\', cursor: \\'pointer\\', fontWeight: \\'bold\\' }}>Delete</button>\n              </div>\n            </div>\n          </div>\n        )}',
  ''
);

fs.writeFileSync('src/pages/operations-admin/ManageTimetable.tsx', content);
console.log('Removed duplicate modal');
