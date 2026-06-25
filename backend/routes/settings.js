// routes/settings.js  (FIXED)
//
// FIX 25: Added all new site_settings columns to GET and PUT:
//          site_name_ar, site_name_en, logo_url, favicon_url,
//          about_desc_ar/en, vision_ar/en, mission_ar/en.
//          Without these, the admin panel could not manage site identity
//          or the About page content.

const router = require('express').Router()
const db     = require('../lib/db')
const auth   = require('../middleware/auth')

function superAdminOnly(req, res, next) {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'هذه العملية متاحة للمشرف الرئيسي فقط' })
  }
  next()
}

async function ensureRow() {
  await db.query(`INSERT INTO site_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id`)
}

// GET /api/settings  (public)
router.get('/', async (req, res) => {
  try {
    await ensureRow()
    const [rows] = await db.query('SELECT * FROM site_settings WHERE id = 1')
    res.json(rows[0] || null)
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// PUT /api/settings  (super_admin only)
router.put('/', auth, superAdminOnly, async (req, res) => {
  try {
    await ensureRow()
    const {
      // Identity
      site_name_ar, site_name_en, logo_url, favicon_url,
      // Contact
      contact_phone, contact_email, address_ar, address_en,
      // Footer
      footer_desc_ar, footer_desc_en,
      // Social
      social_facebook, social_youtube, social_linkedin, social_x,
      // Home about image
      home_about_image_url, home_about_image_alt_ar, home_about_image_alt_en,
      // About page content
      about_desc_ar, about_desc_en,
      vision_ar, vision_en,
      mission_ar, mission_en,
    } = req.body || {}

    await db.query(
      `UPDATE site_settings
       SET
         site_name_ar=?, site_name_en=?, logo_url=?, favicon_url=?,
         contact_phone=?, contact_email=?, address_ar=?, address_en=?,
         footer_desc_ar=?, footer_desc_en=?,
         social_facebook=?, social_youtube=?, social_linkedin=?, social_x=?,
         home_about_image_url=?, home_about_image_alt_ar=?, home_about_image_alt_en=?,
         about_desc_ar=?, about_desc_en=?,
         vision_ar=?, vision_en=?,
         mission_ar=?, mission_en=?,
         updated_at=NOW()
       WHERE id=1`,
      [
        site_name_ar   || 'منظمة تراث اليمن لأجل السلام',
        site_name_en   || 'Yemen Heritage for Peace',
        logo_url       || null,
        favicon_url    || null,
        contact_phone  || null,
        contact_email  || null,
        address_ar     || null,
        address_en     || null,
        footer_desc_ar || null,
        footer_desc_en || null,
        social_facebook  || null,
        social_youtube   || null,
        social_linkedin  || null,
        social_x         || null,
        home_about_image_url    || null,
        home_about_image_alt_ar || null,
        home_about_image_alt_en || null,
        about_desc_ar || null,
        about_desc_en || null,
        vision_ar     || null,
        vision_en     || null,
        mission_ar    || null,
        mission_en    || null,
      ]
    )

    const [rows] = await db.query('SELECT * FROM site_settings WHERE id=1')
    res.json({ message: 'تم التحديث', settings: rows[0] })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

module.exports = router
