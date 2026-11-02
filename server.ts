import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // AI Avito analysis / optimization endpoint
  app.post('/api/ai-analyze', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY не задан. Настройте ключ в панели Secrets для генерации через нейросеть.',
          fallback: true
        });
      }

      const { mode, listing, profileSummary } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      let systemPrompt = `Ты — профессиональный эксперт-авитолог, специализирующийся на продвижении любых видов товаров, услуг и оборудования на Авито.
Твоя задача — давать практичные, высококонверсионные рекомендации без воды с учётом специфики ниши (товары, ритейл, B2B-оборудование или услуги мастеров). Отвечай на русском языке с четкой структурой, буллетами и готовыми текстами для копирования.`;

      let userContent = '';

      if (mode === 'optimize-listing' && listing) {
        userContent = `Проведи полный аудит и сформируй продающую оптимизацию для следующего объявления на Авито:
Заголовок: "${listing.title}"
Текущая цена: ${listing.price} ₽
Категория: ${listing.categoryFull || listing.productGroup}
Просмотров всего: ${listing.viewsTotal}, сегодня: ${listing.viewsToday}
Платные услуги: ${listing.paidServices}
Количество фото: ${listing.photoCount}
Текущее описание:
${listing.descriptionText.slice(0, 1500)}

Предоставь ответ в следующем формате:
1. 🎯 ТОП-3 ТОЧКИ РОСТА (Что прямо сейчас срезает конверсию).
2. 📝 3 ВАРИАНТА ПРОДАЮЩИХ ЗАГОЛОВКОВ (до 50 символов, с ключевыми словами под алгоритмы поиска Авито).
3. 📦 ГОТОВОЕ ПРОДАЮЩЕЕ ОПИСАНИЕ ПО СТРУКТУРЕ AIDA (с цепляющим первым абзацем, выгодами, условиями опта/розницы, доставкой и призывом к действию).
4. 📸 РЕКОМЕНДАЦИИ ПО ФОТОКОНТЕНТУ И ИНФОГРАФИКЕ (что вынести на слайды).
5. 💡 СТРАТЕГИЯ ПРОДВИЖЕНИЯ (в какие дни и часы запускать платные услуги).`;
      } else if (mode === 'cluster-fix' && listing) {
        userContent = `Как максимально эффективно упаковать размерную линейку объявлений "${listing.productGroup}" для сбора точного низкочастотного трафика с поиска Авито?
Дай рекомендации:
1. Как оформить главное фото с инфографикой размера, чтобы покупатель сразу видел нужный размер в ленте.
2. Как усилить заголовок под кейсы использования (для мелких товаров, аксессуаров, маркетплейсов).
3. Как правильно распределить платные услуги (продвигать только 2-3 ходовых размера, не распыляя бюджет на микро-размеры).
4. Какую перелинковку добавить в текст на остальные размеры.`;
      } else {
        userContent = `Проанализируй сводный профиль магазина упаковочных материалов:
Всего объявлений: ${profileSummary?.totalListings || 42}
Всего просмотров: ${profileSummary?.totalViews || 53000}
Просмотров сегодня: ${profileSummary?.viewsToday || 120}
Доля продвигаемых: ${profileSummary?.promoPercentage || 70}%
Спящих объявлений со сливом продвижения: ${profileSummary?.promotedZeroViewsCount || 10}

Сформируй стратегический план авитолога на 30 дней по увеличению выручки и снижению стоимости лида.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userContent}` }]
          }
        ]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.json({ result: text });
    } catch (err: any) {
      console.error('AI analysis error:', err);
      return res.status(500).json({
        error: err.message || 'Ошибка обработки запроса нейросетью',
        fallback: true
      });
    }
  });

  // Serve static or Vite in dev
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
