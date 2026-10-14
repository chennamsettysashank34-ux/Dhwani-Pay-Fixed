-- ==============================================================================
-- DHWANIPAY PRODUCTION SUPABASE SCHEMA (Process 1: Merchant Soundbox Ledger)
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up any existing tables (safe migrations)
-- DROP TABLE IF EXISTS public.devices CASCADE;
-- DROP TABLE IF EXISTS public.expenses CASCADE;
-- DROP TABLE IF EXISTS public.payment_events CASCADE;
-- DROP TABLE IF EXISTS public.merchants CASCADE;

-- ------------------------------------------------------------------------------
-- TABLE: public.merchants
-- Stores merchant business profiles, soundbox voice preferences & UPI settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT 'My Store',
    vpa TEXT NOT NULL DEFAULT 'merchant@upi',
    phone TEXT,
    spoken_language TEXT NOT NULL DEFAULT 'English',
    interface_language TEXT NOT NULL DEFAULT 'English',
    announcements_enabled BOOLEAN NOT NULL DEFAULT true,
    speech_rate NUMERIC(3, 2) NOT NULL DEFAULT 0.9,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);

-- ------------------------------------------------------------------------------
-- TABLE: public.payment_events
-- Records every payment intercepted by the Android Notification Listener
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    source TEXT NOT NULL DEFAULT 'UPI', -- e.g. PhonePe Merchant, Google Pay for Business, Paytm, BHIM
    payer_name TEXT,
    utr TEXT,
    note TEXT,
    state TEXT NOT NULL DEFAULT 'Played' CHECK (state IN ('Played', 'Pending', 'Failed')),
    raw_notification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON public.payment_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payment_events(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_merchant_utr ON public.payment_events(merchant_id, utr) WHERE utr IS NOT NULL AND utr <> '';

-- ------------------------------------------------------------------------------
-- TABLE: public.expenses
-- Merchant daily expense & shop supplier ledger
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL DEFAULT 'Inventory' CHECK (
        category IN ('Inventory', 'Food & Tea', 'Utilities', 'Rent', 'Salary', 'Supplies', 'Other')
    ),
    status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'pending')),
    payment_method TEXT NOT NULL DEFAULT 'UPI' CHECK (
        payment_method IN ('UPI', 'Cash', 'Card', 'Bank Transfer')
    ),
    date TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_merchant_id ON public.expenses(merchant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

-- ------------------------------------------------------------------------------
-- TABLE: public.devices
-- Tracks merchant's Android phone running the soundbox background service
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL DEFAULT 'Android Phone',
    notification_access_granted BOOLEAN NOT NULL DEFAULT false,
    battery_optimization_ignored BOOLEAN NOT NULL DEFAULT false,
    app_version TEXT DEFAULT '1.0.0',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_merchant_id ON public.devices(merchant_id);

-- ------------------------------------------------------------------------------
-- TABLE: public.vault_qrs
-- Merchant QR standee vault (PhonePe, GPay, Paytm, BharatPe standees)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_qrs (
    id TEXT PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    title TEXT NOT NULL,
    image_uri TEXT NOT NULL,
    vpa TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_qrs_merchant_id ON public.vault_qrs(merchant_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures merchants can ONLY view, insert, and update their own data
-- ==============================================================================

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_qrs ENABLE ROW LEVEL SECURITY;

-- 1. Merchants RLS: Users can read and update their own merchant record
CREATE POLICY "Users can view own merchant profile"
    ON public.merchants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own merchant profile"
    ON public.merchants FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own merchant profile"
    ON public.merchants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Payment Events RLS: Merchants can read and insert their own payments
CREATE POLICY "Merchants can view own payments"
    ON public.payment_events FOR SELECT
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can insert own payments"
    ON public.payment_events FOR INSERT
    WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can update own payments"
    ON public.payment_events FOR UPDATE
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can delete own payments"
    ON public.payment_events FOR DELETE
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 3. Expenses RLS: Merchants can manage their own expenses
CREATE POLICY "Merchants can view own expenses"
    ON public.expenses FOR SELECT
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can insert own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can update own expenses"
    ON public.expenses FOR UPDATE
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can delete own expenses"
    ON public.expenses FOR DELETE
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 4. Devices RLS
CREATE POLICY "Merchants can manage own devices"
    ON public.devices FOR ALL
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 5. Vault QRs RLS
CREATE POLICY "Merchants can manage own vault standees"
    ON public.vault_qrs FOR ALL
    USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- ==============================================================================
-- DATABASE TRIGGERS
-- ==============================================================================

-- Trigger: Automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_merchants_updated_at ON public.merchants;
CREATE TRIGGER tr_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_expenses_updated_at ON public.expenses;
CREATE TRIGGER tr_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Automatically create public.merchants row when user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.merchants (
        user_id,
        email,
        business_name,
        vpa,
        spoken_language
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Store'),
        COALESCE(NEW.raw_user_meta_data->>'vpa', 'merchant@upi'),
        COALESCE(NEW.raw_user_meta_data->>'spoken_language', 'English')
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
