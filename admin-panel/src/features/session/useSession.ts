import { useContext } from 'react';
import { SessionContext } from './context';

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('SessionProvider is missing');
  }

  return context;
};
