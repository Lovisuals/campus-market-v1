"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';  // NEW: Import Link
import { usePathname } from 'next/navigation';  // NEW: For active tab highlighting
// @ts-ignore
import confetti from 'canvas-confetti';
import ProductCard from './ProductCard';
import StoriesRail from './StoriesRail';

// ... (paste your entire existing Marketplace code here, from const CAMPUSES = [ ... to the end)

