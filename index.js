import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors()); // Basic CORS setup

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_ANON_KEY
);
app.get('/',async(req,res)=>{
    res.status(200).send("server responding")
})

app.post('/', async (req, res) => {
    try {
        const { name1, name2 } = req.body;
        console.log(req.body)
        
        // Input validation
        if (!name1 || !name2) {
            return res.status(400).json({ 
                error: 'Both name1 and name2 are required' 
            });
        }
        
        const { data, error } = await supabase
            .from('contact')
            .insert([{ name1, name2 }])
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

app.listen(8443,()=>{
    console.log("Server started")
})

// export default serverless(app);
