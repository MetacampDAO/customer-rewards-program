export const getUnixTimestamp = (
  year: number,
  month: number,
  day: number,
  time: number
): number => {
  const date = new Date(
    year,
    month - 1,
    day,
    Math.floor(time / 100),
    time % 100
  );
  const unixTimestamp = Math.floor(date.getTime() / 1000);
  return unixTimestamp;
};
