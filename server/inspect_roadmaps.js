import { initDb, query } from './src/db/index.js';

async function inspectRoadmaps() {
  await initDb();
  const roadmaps = (await query(`
    SELECT cr.id, cr.student_id, cr.career_id, cr.title, c.title as career_name
    FROM career_roadmaps cr
    LEFT JOIN careers c ON cr.career_id = c.id
  `)).rows;

  console.log('--- Current Career Roadmaps in DB ---');
  console.table(roadmaps);

  for (const r of roadmaps) {
    const items = (await query(`
      SELECT step_number, skill_or_topic, difficulty
      FROM roadmap_items
      WHERE roadmap_id = $1
      ORDER BY step_number ASC
    `, [r.id])).rows;
    console.log(`\nItems for Roadmap ID ${r.id} (${r.career_name}):`);
    console.table(items);
  }
}

inspectRoadmaps().catch(console.error);
