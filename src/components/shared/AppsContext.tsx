'use client';
import { createContext, useContext } from 'react';
import type { AppEntry, GroupEntry } from '@/registry';

export interface AppsData { index: AppEntry[]; groups: GroupEntry[] }
const Ctx = createContext<AppsData>({ index: [], groups: [] });

/** The list of apps, handed down once from the layout so menus, search and the Try row never import the full registry. */
export const AppsProvider = Ctx.Provider;
export const useApps = () => useContext(Ctx);
