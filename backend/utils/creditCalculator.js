
export const calculateCredits = (durationSec) => {
  const min = durationSec / 60;

  if (min <= 20) return 1;
  if (min <= 40) return 2;
  if (min <= 60) return 4;
  return 6;
};