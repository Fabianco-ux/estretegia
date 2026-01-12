export type StrategyMetrics = {
  analytics: {
    totalUsers: number;
    sessions: number;
    avgSessionDurationSec: number;
    activeUsers: number;
    events: number;
    keyEvents: number;
  };
  linkedin: {
    impressions: number;
    clicks: number;
    interactionRate: number; // 1.0298 => 102.98%
    searchAppearances: number;
    newFollowers: number;
    postImpressions: number;
    searchAppearancesTrendPct: number; // 1100
    postImpressionsTrendPct: number; // 737.5
  };
};

export type StrategyTask = {
  id: string;
  title: string;
  detail: string;
};

export function generateStrategy(metrics: StrategyMetrics): { message: string; tasks: StrategyTask[] } {
  const a = metrics.analytics;
  const l = metrics.linkedin;
  const ratePct = (l.interactionRate * 100).toFixed(2);

  const message = [
    `Fabián, con estos datos —aunque son pocos— ya se puede construir una estrategia comercial y de marketing clara.`,
    '',
    '🚀 1. Interpretación estratégica',
    `• LinkedIn rinde muy bien: ${l.impressions} impresiones, ${l.clicks} clics, ${ratePct}% de interacción, +${l.newFollowers} seguidores, búsquedas +${l.searchAppearancesTrendPct}%`,
    `• Web con tráfico bajo: ${a.totalUsers} usuarios, ${a.sessions} sesiones, ${a.avgSessionDurationSec}s por sesión, ${a.events} eventos, ${a.keyEvents} eventos clave`,
    '',
    '🎯 2. Estrategia de Marketing',
    '• Duplica formatos que funcionan en LinkedIn (educativo, casos, microhistorias) con CTA suave a tu landing',
    '• Optimiza perfil: banner, propuesta de valor, CTA “Agenda una consultoría”',
    '',
    '🤝 3. Estrategia Comercial',
    '• Funnel simple: LinkedIn → Landing → WhatsApp/llamada (diagnóstico 15m + mini-plan)',
    '',
    '🧩 4. Producto/Servicio',
    '• 3 niveles: diagnóstico (entrada), implementación (intermedio), transformación (premium)'
  ].join('\n');

  const tasks: StrategyTask[] = [
    { id: crypto.randomUUID(), title: 'Optimizar perfil de LinkedIn', detail: 'CTA claro, banner con propuesta, enlace a landing' },
    { id: crypto.randomUUID(), title: 'Publicar caso real', detail: `Contar cómo se logró ${ratePct}% de interacción y +${l.newFollowers} seguidores` },
    { id: crypto.randomUUID(), title: 'Crear landing de conversión', detail: 'Mensaje en 5s, botón “Agenda una llamada”, formulario corto' },
    { id: crypto.randomUUID(), title: 'Configurar funnel simple', detail: 'LinkedIn → Landing → WhatsApp/Calendly con diagnóstico 15m' },
  ];

  return { message, tasks };
}

export function defaultStrategyMetrics(): StrategyMetrics {
  return {
    analytics: {
      totalUsers: 2,
      sessions: 6,
      avgSessionDurationSec: 50,
      activeUsers: 2,
      events: 6,
      keyEvents: 0,
    },
    linkedin: {
      impressions: 67,
      clicks: 34,
      interactionRate: 1.0298,
      searchAppearances: 12,
      newFollowers: 34,
      postImpressions: 67,
      searchAppearancesTrendPct: 1100,
      postImpressionsTrendPct: 737.5,
    }
  };
}
