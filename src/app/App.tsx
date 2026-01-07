import { useState } from 'react';
import { AppLayout } from './components/AppLayout';

function App() {
  const originalCode = `function checkAccess(user) {
  if (user.isAdmin && user.isActive) {
    grantAccess();
  }
}`;

  const gappedCode = `function checkAccess(user) {
  if (user.__1__ && user.__2__) {
    __3__();
  }
}`;

  const [gaps, setGaps] = useState([
    { id: 1, placeholder: '__1__', value: 'isAdmin' },
    { id: 2, placeholder: '__2__', value: 'isActive' },
    { id: 3, placeholder: '__3__', value: '' },
  ]);

  const handleGapChange = (id: number, value: string) => {
    setGaps((prev) => prev.map((gap) => (gap.id === id ? { ...gap, value } : gap)));
  };

  const handleShowAnswers = () => {
    console.log('Show answers clicked');
  };

  const correctGaps = [1, 2];
  const incorrectGaps = [3];
  const correctCount = 2;
  const totalCount = 3;
  const hint = 'Almost there! Review your last answer.';

  return (
    <AppLayout
      originalCode={originalCode}
      gappedCode={gappedCode}
      gaps={gaps}
      onGapChange={handleGapChange}
      correctCount={correctCount}
      totalCount={totalCount}
      correctGaps={correctGaps}
      incorrectGaps={incorrectGaps}
      hint={hint}
      onShowAnswers={handleShowAnswers}
    />
  );
}

export default App;
