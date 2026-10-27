import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { supabase, checkSupabaseConnection } from './config/supabase.js';
import asistenteRoutes from './routes/asistenteRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rutas del módulo Asistente Inteligente IA
app.use('/api/asistente', asistenteRoutes);

app.get('/api/saludo', (req, res) => {
    res.json({ mensaje: "Backend esta bien" });
});

app.get('/api/test-supabase', async (req, res) => {
    const result = await checkSupabaseConnection();
    if (result.ok) {
        return res.json({
            ok: true,
            mensaje: result.message,
            proyecto: "Asistencia-IA"
        });
    }
    return res.status(500).json({
        ok: false,
        error: result.error,
        ayuda: "Verifica que el archivo backend/.env contenga SUPABASE_URL y SUPABASE_KEY válidas."
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});

export default app;
