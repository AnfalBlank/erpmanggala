import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import db from '../db/init.js';

const router = Router();
router.use(authMiddleware);

// Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET all office locations
router.get('/office-locations', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM office_locations WHERE is_active = 1').all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create office location (admin only)
router.post('/office-locations', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  try {
    const { name, latitude, longitude, radius_meters } = req.body;
    const r = db.prepare('INSERT INTO office_locations (name, latitude, longitude, radius_meters) VALUES (?,?,?,?)')
      .run(name, latitude, longitude, radius_meters || 100);
    res.json(db.prepare('SELECT * FROM office_locations WHERE id=?').get(r.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH update office location
router.patch('/office-locations/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  try {
    const { name, latitude, longitude, radius_meters, is_active } = req.body;
    const existing = db.prepare('SELECT * FROM office_locations WHERE id=?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE office_locations SET name=?, latitude=?, longitude=?, radius_meters=?, is_active=? WHERE id=?')
      .run(name || existing.name, latitude ?? existing.latitude, longitude ?? existing.longitude, radius_meters ?? existing.radius_meters, is_active ?? existing.is_active, req.params.id);
    res.json(db.prepare('SELECT * FROM office_locations WHERE id=?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE (soft)
router.delete('/office-locations/:id', roleMiddleware('Super Admin', 'Admin'), (req, res) => {
  try {
    db.prepare('UPDATE office_locations SET is_active = 0 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST validate geofence
router.post('/validate-geofence', (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const locations = db.prepare('SELECT * FROM office_locations WHERE is_active = 1').all();
    let nearest = null;
    let minDist = Infinity;
    for (const loc of locations) {
      const dist = haversine(latitude, longitude, loc.latitude, loc.longitude);
      if (dist < minDist) { minDist = dist; nearest = loc; }
    }
    const inRange = nearest ? minDist <= nearest.radius_meters : false;
    res.json({ inRange, distance: Math.round(minDist), nearestLocation: nearest });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
