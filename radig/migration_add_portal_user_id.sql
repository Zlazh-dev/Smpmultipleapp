-- Migration: Add portal_user_id to guru table
-- This is the cross-app identity link to Portal (centralized identity)
-- Run this on existing databases. For new deployments, deepsync.sql already includes it.

ALTER TABLE guru ADD COLUMN portal_user_id VARCHAR(36) UNIQUE DEFAULT NULL;
