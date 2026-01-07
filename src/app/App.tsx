import { useEffect } from 'react';
import { AppLayout } from './components/AppLayout';
import { useGapStore } from '../store/useGapStore';

function App() {
  const setInputCode = useGapStore((state) => state.setInputCode);
  const generateGaps = useGapStore((state) => state.generateGaps);

  // Initialize with example code
  useEffect(() => {
    const exampleCode = `if (user.isAdmin && user.isActive) {
  grantAccess();
}`;
    setInputCode(exampleCode);
    // Auto-generate gaps on mount
    setTimeout(() => {
      generateGaps();
    }, 100);
  }, [setInputCode, generateGaps]);

  return <AppLayout />;
}

export default App;
