import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import corsLib from 'cors';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import crypto from 'crypto';

// Inicializa Firebase Admin una sola vez al cargar el módulo
initializeApp();
const db = getFirestore();
const cors = corsLib({ origin: true });

// Esquema flexible para soportar LinkedIn Ads y Organización
const MetricsRecord = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));
const MetricsArray = z.array(z.record(z.any()));

const PayloadSchema = z.object({
  source: z.literal('linkedin').default('linkedin'),
  stream: z.enum(['ads', 'organization']).describe('Tipo de métrica'),
  timestamp: z.union([z.string(), z.number()]).describe('Epoch ms o ISO string'),
  accountId: z.string().optional(),
  orgId: z.string().optional(),
  metrics: z.union([MetricsRecord, MetricsArray]).describe('Contenido de métricas'),
  // Campo opcional para versionar payloads de n8n
  version: z.string().optional()
}).refine((p) => Boolean(p.accountId || p.orgId), {
  message: 'Se requiere accountId u orgId',
  path: ['accountId']
});

function safeDate(input: string | number) {
  const d = typeof input === 'number' ? new Date(input) : new Date(input);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

function verifySignature(req: any, secret?: string) {
  // Verificación opcional de firma HMAC enviada por n8n en cabecera X-N8N-Signature
  if (!secret) return true;
  try {
    const signature = req.get('x-n8n-signature') || req.get('X-N8N-Signature');
    if (!signature) return false;
    const rawBody: Buffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return signature === hmac;
  } catch {
    return false;
  }
}

// HTTP Function: endpoint para n8n
export const ingestLinkedInMetrics = onRequest({ cors: true }, async (req, res) => {
  // Manejo de CORS y método
  await new Promise<void>((resolve) => cors(req, res, () => resolve()));
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido' }); return; }

  const secret = process.env.N8N_WEBHOOK_SECRET;

  // Verificación de firma (opcional si está configurada)
  if (secret && !verifySignature(req, secret)) {
    logger.warn('Firma inválida en webhook de n8n');
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  try {
    // Validación del payload
    const parsed = PayloadSchema.parse(req.body);
    const receivedAt = new Date();
    const eventTime = safeDate(parsed.timestamp);
    const doc = {
      source: 'linkedin' as const,
      stream: parsed.stream,
      timestamp: eventTime.toISOString(),
      epochMs: eventTime.getTime(),
      accountId: parsed.accountId || null,
      orgId: parsed.orgId || null,
      metrics: parsed.metrics,
      version: parsed.version || 'v1',
      receivedAt: receivedAt.toISOString(),
      headers: {
        'user-agent': req.get('user-agent') || null,
        'x-forwarded-for': req.get('x-forwarded-for') || null,
        'content-type': req.get('content-type') || null
      }
    };

    // Persistencia en Firestore
    const ref = await db.collection('linkedin_metrics').add(doc);

    // Logging estructurado
    logger.info('LinkedIn metrics ingestado', {
      docId: ref.id,
      stream: parsed.stream,
      accountId: parsed.accountId,
      orgId: parsed.orgId,
      epochMs: doc.epochMs
    });

    res.status(201).json({ ok: true, id: ref.id });
    return;
  } catch (err: any) {
    logger.error('Error al procesar payload de LinkedIn', { message: err?.message, stack: err?.stack });
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Payload inválido', issues: err.issues });
      return;
    }
    res.status(500).json({ error: 'Error interno' });
    return;
  }
});
