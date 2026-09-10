import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LARIAN — Jelajahi Nusantara. Kejar Rekor.', description: 'Game 3D endless runner original bersama Raka di Kota Nusantara.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="id"><body>{children}</body></html>; }
