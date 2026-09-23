import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the dashboard by default, which is protected by the (erp) layout
  // Or redirect to auth. The layout logic will handle unauthenticated users.
  redirect('/dashboard');
}
