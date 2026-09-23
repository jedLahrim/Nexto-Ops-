import { useQuery } from '@tanstack/react-query';
import { authService, User } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getMe,
    retry: false, // Do not retry on 401s
  });

  const isAuthenticated = !!user;

  const signOut = async () => {
    await authService.signOut();
    router.push('/');
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    signOut,
  };
}
