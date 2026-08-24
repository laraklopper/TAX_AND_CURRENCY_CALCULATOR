// timeFunctions.js
/* Utility(Helper) functions relating to date and time*/


// utilFunctions/dateFunction.js
//-----------DATE FUNCTIONS-----------
// Function to specify the date format
export const dateDisplay = (dateString) => {
    const options = {
        day: '2-digit',// Display day as two digit
        month: '2-digit',// Display month as two digits
        year: 'numeric',// Display year as four digits
        timeZone: 'Africa/Johannesburg'// Set the timezone
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-GB', options);
}

// Function to get the current date in 'DD/MM/YYYY' format
export const currentDate = () => {
    const options = {
        day: '2-digit', // Display day as two digit
        month: '2-digit',  // Display month as two digits
        year: 'numeric',// Display year as four digits
        timeZone: 'Africa/Johannesburg'// Set the timezone
    };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date());// Format the current date
};

//-----------AGE FUNCTIONS-----------
/* Age in whole years on today's date. A birthday that has not come round yet
this year has not been had, so the year difference is reduced by one.
Used by the registration form to hold users to a minimum age. */
export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;// Nothing to work out an age from
    const dob = new Date(dateOfBirth);// Convert the date of birth into a Date object
    if (isNaN(dob.getTime())) return null;// An unreadable date has no age
    const now = new Date();// Get the current date
    let age = now.getFullYear() - dob.getFullYear();// Calculate age based on year difference
    const monthDifference = now.getMonth() - dob.getMonth();// Calculate month difference
    // If the user's birthday has not happened yet this year,
    if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < dob.getDate())) {
        age--;// subtract 1 from the calculated age
    }
    return age;
};

/* The latest date of birth that still meets a minimum age, as 'YYYY-MM-DD' for
a date input's `max` attribute. Example: for a minimum age of 18, the date of
birth must be on or before today's date minus 18 years. */
export const maxDateOfBirth = (minAge) => {
    const today = new Date();// Get today's date
    return new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate()
    )
        .toISOString()
        .split('T')[0];// Keep the date half, dropping the time
};

//-----------TIME FUNCTIONS-----------
// Format time as hh:mm:ss
export const timeDisplay = (dateObj) => {
    return dateObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',// Display hour as two digits
        minute: '2-digit',// Display minute as two digits
        second: '2-digit',// Display second as two digits
        hour12: false,// Use 24-hour format
        timeZone: 'Africa/Johannesburg'// Set the timezone
    });
};



