-- CYTRACK Database Migration: 003_seed_symptoms.sql
-- Description: Core symptoms catalog reference data

INSERT INTO public.symptoms (id, name, category, icon_name, sort_order) VALUES
('cramps', 'Cramps', 'physical', 'Zap', 1),
('headache', 'Headache', 'physical', 'Brain', 2),
('bloating', 'Bloating', 'digestive', 'Wind', 3),
('fatigue', 'Fatigue', 'energy', 'BatteryLow', 4),
('back_pain', 'Back Pain', 'physical', 'Activity', 5),
('breast_tenderness', 'Breast Tenderness', 'physical', 'Heart', 6),
('acne', 'Acne / Skin', 'physical', 'Sparkles', 7),
('nausea', 'Nausea', 'digestive', 'AlertCircle', 8),
('cravings', 'Cravings', 'digestive', 'Coffee', 9),
('mood_swings', 'Mood Swings', 'emotional', 'Smile', 10),
('anxiety', 'Anxiety', 'emotional', 'ShieldAlert', 11),
('insomnia', 'Insomnia', 'energy', 'Moon', 12)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon_name = EXCLUDED.icon_name,
    sort_order = EXCLUDED.sort_order;
