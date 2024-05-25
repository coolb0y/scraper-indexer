function getFormattedDateTime() {
  const now = new Date();

  // Format the date and time parts
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  // Combine and format as YYYY-MM-DDTHH-MM-SS-mmmZ (without dots)
  return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}-${milliseconds}Z`;
}

module.exports = getFormattedDateTime;
