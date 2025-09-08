import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

const app = express();

app.use(express.json());

// Robust CORS setup
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Idempotency-Key'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_ANON_KEY
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY is not set.');
}
app.get('/',async(req,res)=>{
    res.status(200).send("server responding")
})
app.get('/couples',async(req,res)=>{
    try {
        const { data, error } = await supabase
            .from('contact')
            .select('id, name1, name2, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase select error:', error);
            return res.status(500).json({ error: 'Failed to fetch couples', details: error.message });
        }

        return res.status(200).json({ data });
    } catch (err) {
        console.error('Server error on GET /couples:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
})


app.post('/', async (req, res) => {
    try {
        const { name1, name2, percentage } = req.body || {};
        console.log('Incoming POST / payload:', req.body)
        
        // Input validation
        if (!name1 || !name2) {
            return res.status(400).json({ 
                error: 'Both name1 and name2 are required' 
            });
        }
        const insertPayload = { name1: String(name1).trim(), name2: String(name2).trim() };
        if (percentage !== undefined) insertPayload.percentage = Number(percentage);
        
        const { data, error } = await supabase
            .from('contact')
            .insert([insertPayload])
            .select();
        
        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ 
                error: 'Failed to insert data' 
            });
        }
        
        res.status(201).json({ 
            message: 'Contact created successfully', 
            data 
        });
        
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 8443;
app.listen(PORT,()=>{
    console.log(`Server started on port ${PORT}`)
})

// export default serverless(app);
