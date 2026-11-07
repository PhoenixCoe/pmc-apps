'use client';
import { useEffect } from 'react';
import { startBridge } from '@/lib/embed';

/** When this page is open inside another (Coe), starts listening for it. Does nothing otherwise. */
export function EmbedBridge() {
  useEffect(() => { startBridge(); }, []);
  return null;
}
