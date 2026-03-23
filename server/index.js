import express from 'express';
import cors from 'cors';
import db from '../db.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. مسارات الداشبورد (Dashboard Stats)
// ==========================================
app.get('/api/dashboard', async (req, res) => {
  const {
    from, to
  } = req.query;

  try {
    // جلب البيانات من الجداول
    const driversResult = await db.query('SELECT * FROM drivers');
    const ledgerResult = await db.query('SELECT * FROM ledger');
    const repairsResult = await db.query('SELECT * FROM repairs');

    const drivers = driversResult.rows;
    const ledger = ledgerResult.rows;
    const repairs = repairsResult.rows;

    // فلترة السجل حسب الفترة
    const filteredLedger = ledger.filter(
      (entry) =>
      (!from || entry.date >= from) &&
      (!to || entry.date <= to)
    );

    // دخل الفترة = مجموع المدفوع
    const todayRevenue = filteredLedger.reduce(
      (acc, curr) => acc + Number(curr.paidAmount || 0),
      0
    );

    // مصروفات الزيت (type = 'oil')
    const oilExpenses = ledger
    .filter((entry) => entry.type === 'oil')
    .reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);

    // مصروفات الإصلاحات من جدول repairs
    const maintenanceExpenses = repairs.reduce(
      (acc, curr) => acc + Number(curr.cost || 0),
      0
    );

    // عدد السائقين
    const totalDrivers = drivers.length;

    // إجمالي مديونية النظام = مجموع (الإيجار - المدفوع) لكل السائقين
    const totalSystemDebt = drivers.reduce((acc, driver) => {
      const driverEntries = ledger.filter(
        (l) => String(l.driverId) === String(driver.id)
      );
      const driverDebt = driverEntries.reduce((sum, entry) => {
        // الإيجار اليومي من جدول الباص المرتبط
        const bus = driver.busId
        ? driversResult.rows.find((b) => b.id === driver.busId): null;
        const rentAmount = bus ? Number(bus.dailyRent || 0): 0;
        const paidAmount = Number(entry.paidAmount || 0);
        return sum + (rentAmount - paidAmount);
      }, 0);
      return acc + driverDebt;
    }, 0);
    // إجمالي الدخل من أول يوم إلى آخر يوم
    const totalRevenue = ledger.reduce(
      (acc, curr) => acc + Number(curr.paidAmount || 0),
      0
    );

    // إرجاع النتائج
    res.json({
      totalRevenue,
      todayRevenue,
      oilExpenses,
      maintenanceExpenses,
      totalDrivers,
      totalSystemDebt,
    });
  } catch (err) {
    console.error('خطأ في مسار الداشبورد:', err);
    res.status(500).send('خطأ في جلب بيانات الداشبورد');
  }
});
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


// ==========================================
// 2. مسارات المركبات (Buses)
// ==========================================
app.get('/api/buses', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.id, b."busNumber", b."initialMeter", b."dailyRent",
      CASE WHEN d.id IS NOT NULL THEN 'خارج الخدمة' ELSE 'في الخدمة' END AS status
      FROM buses b
      LEFT JOIN drivers d ON b.id = d."busId"
      ORDER BY b.id DESC
      `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في جلب الباصات');
  }
});

app.post('/api/buses', async (req, res) => {
  const {
    busNumber, initialMeter, dailyRent
  } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO buses ("busNumber", "initialMeter", "dailyRent") VALUES ($1,$2,$3) RETURNING *',
      [busNumber, initialMeter, dailyRent]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة الباص');
  }
});

app.put('/api/buses/:id', async (req, res) => {
  const {
    id
  } = req.params;
  const {
    busNumber, initialMeter, dailyRent
  } = req.body;
  try {
    const result = await db.query(
      'UPDATE buses SET "busNumber"=$1, "initialMeter"=$2, "dailyRent"=$3 WHERE id=$4 RETURNING *',
      [busNumber, initialMeter, dailyRent, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في تعديل الباص');
  }
});

app.delete('/api/buses/:id', async (req, res) => {
  const {
    id
  } = req.params;
  try {
    await db.query('DELETE FROM buses WHERE id=$1', [id]);
    res.send('تم حذف الباص بنجاح');
  } catch (err) {
    res.status(500).send('خطأ في حذف الباص');
  }
});


// ==========================================
// 3. مسارات السائقين (Drivers)
// ==========================================
app.get('/api/driversData', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.id, d.name, d."busId", d.phone, d.guarantor, d."receiveDate",
             b."busNumber", b."dailyRent", b."initialMeter", COALESCE(
    (SELECT l."currentMeter"
     FROM ledger l
     WHERE l."driverId" = d.id
     ORDER BY l."date" DESC
     LIMIT 1),
    b."initialMeter"
  ) AS lastMeter
  
      FROM drivers d
      LEFT JOIN buses b ON d."busId" = b.id
      ORDER BY d.id DESC
      `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في جلب السائقين');
  }
});;

app.post('/api/driversData', async (req, res) => {
  const {
    name, phone, guarantor, receiveDate, busId
  } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO drivers (name, phone, guarantor, "receiveDate", "busId") VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, phone, guarantor, receiveDate, busId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة السائق');
  }
});

app.put('/api/driversData/:id', async (req, res) => {
  const {
    id
  } = req.params;
  const {
    name, phone, guarantor, receiveDate, busId
  } = req.body;
  try {
    const result = await db.query(
      'UPDATE drivers SET name=$1, phone=$2, guarantor=$3, "receiveDate"=$4, "busId"=$5 WHERE id=$6 RETURNING *',
      [name, phone, guarantor, receiveDate, busId, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في تعديل السائق');
  }
});

app.delete('/api/driversData/:id', async (req, res) => {
  const {
    id
  } = req.params;
  try {
    await db.query('DELETE FROM drivers WHERE id=$1', [id]);
    res.send('تم حذف السائق بنجاح');
  } catch (err) {
    res.status(500).send('خطأ في حذف السائق');
  }
});


// ==========================================
// 4. مسارات السجل المالي (Ledger)
// ==========================================
// جلب السجل
app.get('/api/ledger', async (req, res) => {
  const {
    driverId
  } = req.query;
  try {
    let result;
    if (driverId) {
      result = await db.query(
        'SELECT id, "driverId", "busId", date, "currentMeter", "paidAmount", type, note FROM ledger WHERE "driverId" = $1 ORDER BY date DESC',
        [driverId]
      );
    } else {
      result = await db.query(
        'SELECT id, "driverId", "busId", date, "currentMeter", "paidAmount", type, note FROM ledger ORDER BY date DESC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب السجل');
  }
});

// إضافة سجل جديد
app.post('/api/ledger', async (req, res) => {
  const {
    driverId,
    busId,
    date,
    currentMeter,
    paidAmount,
    type,
    note
  } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO ledger ("driverId", "busId", date, "currentMeter", "paidAmount", type, note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [driverId, busId, date, currentMeter, paidAmount, type, note]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في إضافة السجل');
  }
});

// تعديل سجل
app.put('/api/ledger/:id', async (req, res) => {
  const {
    id
  } = req.params;
  const {
    driverId,
    busId,
    date,
    currentMeter,
    paidAmount,
    type,
    note
  } = req.body;
  try {
    const result = await db.query(
      'UPDATE ledger SET "driverId"=$1, "busId"=$2, date=$3, "currentMeter"=$4, "paidAmount"=$5, type=$6, note=$7 WHERE id=$8 RETURNING *',
      [driverId, busId, date, currentMeter, paidAmount, type, note, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('خطأ في تعديل السجل');
  }
});

// حذف سجل
app.delete('/api/ledger/:id', async (req, res) => {
  const {
    id
  } = req.params;
  try {
    await db.query('DELETE FROM ledger WHERE id=$1', [id]);
    res.send('تم الحذف بنجاح');
  } catch (err) {
    res.status(500).send('خطأ في الحذف');
  }
});


// =======================
// 🛠️ مسارات الإصلاحات (repairs)
// =======================
app.get('/api/repairsData', async (req, res) => {
  const { busId } = req.query;
  try {
    let query = 'SELECT * FROM repairs';
    let params = [];

    if (busId) {
      query += ' WHERE "busId" = $1'; // لاحظ هنا الحرف I كابيتال حسب استعلامك السابق
      params.push(busId);
    }

    query += ' ORDER BY date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('خطأ في جلب الإصلاحات');
  }
});


app.post('/api/repairsData', async (req, res) => {
  const { busId, date, note, cost } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO repairs ("busId", date, note, cost) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        parseInt(busId), 
        date || new Date(), 
        note, 
        Number(cost || 0)
        
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ خطأ في إضافة الإصلاح:', err.message);
    res.status(500).send('خطأ في إضافة الإصلاح');
  }
});



// ==========================================
// 🛢️ مسار تسجيل تغيير الزيت (Oil Changes)
// ==========================================
// جلب تاريخ تغييرات الزيت لجميع الباصات

app.get('/api/oil_changes', async (req, res) => {
  const { busId } = req.query; // قراءة المعرف من الرابط
  try {
    let query = 'SELECT * FROM oil_changes';
    let params = [];

    if (busId) {
      query += ' WHERE "busid" = $1'; // تأكد من مسمى الحقل في قاعدة بياناتك (غالباً busid)
      params.push(busId);
    }

    query += ' ORDER BY "changedate" DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في جلب بيانات الزيت');
  }
});


// تسجيل عملية تغيير زيت وتصفير العداد
app.post('/api/oil_changes', async (req, res) => {
  const { busId, date, currentMeter, paidAmount, note } = req.body;

  // تتبع القيم القادمة من الواجهة
  console.log("📩 البيانات المستلمة من الواجهة:", req.body);

  try {
    const oilResult = await db.query(
      `INSERT INTO oil_changes ("busid", "changedate", "totaldistance", "amount", "note") 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        busId, 
        date || new Date(), 
        Number(currentMeter), 
        Number(paidAmount || 0), 
        note || 'تغيير زيت دوري'
      ]
    );

    await db.query(
      'UPDATE buses SET "initialMeter" = $1 WHERE id = $2',
      [Number(currentMeter), busId]
    );

    console.log(`✅ باص ID: ${busId} | تم تغيير الزيت وتحديث العداد الابتدائي إلى: ${currentMeter}`);

    res.json({
      success: true,
      message: "تم تسجيل العملية وتصفير العداد بنجاح",
      data: oilResult.rows[0]
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الزيت:', err.message);
    res.status(500).json({ error: 'فشل في معالجة طلب تغيير الزيت' });
  }
});




app.listen(PORT, () => {
  console.log(`🚀 السيرفر جاهز ويعمل على المنفذ: ${PORT}`);
});