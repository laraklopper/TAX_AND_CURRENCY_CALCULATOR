// timeFunctions.js
/* Utility(Helper) functions relating to date and time*/


// Format an ISO date string as e.g. 01 March 2025
/*Profile.js*/
const toLongDate = (value) => {
  if (!value) return NOT_PROVIDED
  const date = new Date(value)
  if (isNaN(date.getTime())) return NOT_PROVIDED
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}


