export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ""; // Handle invalid date safely

  return date.toLocaleDateString("en-US", options);
};
