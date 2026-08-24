// userFunc.js
/* Utility(helper) functions relating to users: their records, and the forms
that register and edit them.

The user details are shown in two places (Profile.js and UsersList.js) and are
written to by four forms (RegistrationForm.js, LoginForm.js, EditUserForm.js,
EditPasswordForm.js). Both displays had their own copy of the same placeholder
and date formatting, and both of the nested-field forms had their own copy of
the same change handler, so those answers live here instead: what stands in for
a detail the user has not supplied, what counts as blank, what counts as a
strong password and how old a user has to be. */
import { toFullName, toLongDate } from './formatCalculations'
import { calculateAge } from './timeFunctions'

//===========================================================================
// DISPLAYING A USER RECORD (Profile.js, UsersList.js)
//===========================================================================
/* Shown in place of any detail the user has not supplied (address line2 and
province are the only optional fields on the user schema) */
const NOT_PROVIDED = 'NOT PROVIDED'

// Fall back to a placeholder when a detail is missing or blank
export const orPlaceholder = (value) =>
  (typeof value === 'string' && value.trim()) || NOT_PROVIDED

/* Format a user's date as e.g. 01 March 2025. The shared formatter does the
parsing; the user records only differ in saying NOT PROVIDED for a date that is
missing, because a user without one has not given it rather than having a record
that cannot carry it. */
export const toUserDate = (value) => toLongDate(value, NOT_PROVIDED)

// Join a user's first and last name, tolerating a missing half
export const toUserFullName = (fullName) => toFullName(fullName, NOT_PROVIDED)

//===========================================================================
// FORM INPUT
//===========================================================================
// Trim a form value, tolerating undefined/non-string values
const trimValue = (value) => (typeof value === 'string' ? value.trim() : '')

/* True when a value is missing, empty or only spaces. Used for the
required-field checks on the registration and login forms. */
export const isBlank = (value) => !String(value || '').trim()

/* Build the state updater for a changed input, given its `name` attribute.
A dotted name (e.g. 'fullName.firstName' or 'address.city') writes to the
matching nested object, keeping that object's other fields, and any other name
writes to a top-level field.

Returns an updater rather than the new state so it can be handed straight to a
setter: setNewUserData(applyFieldChange(name, value)). */
export const applyFieldChange = (name, value) => (prev) => {
  // Conditional rendering to check if the input name represents a nested object field
  if (name.includes('.')) {
    const [parent, field] = name.split('.');// Split the field name into parent and child keys
    return {
      ...prev,
      [parent]: {// Update the parent object, such as fullName or address
        ...prev[parent],
        [field]: value// Update only the specific nested field
      }
    }
  }
  // Update normal top-level fields, such as email, dateOfBirth or password
  return { ...prev, [name]: value }
}

/* The `touched` key for an input, given its `name` attribute. The touched state
is flat, so a nested field is tracked under its own name ('fullName.firstName'
is tracked as 'firstName'). */
export const touchedFieldKey = (name) =>
  name.includes('.') ? name.split('.')[1] : name

//===========================================================================
// AGE RULES (RegistrationForm.js)
//===========================================================================
// Admin users take on other people's records, so they are held to a higher age
export const ADMIN_MIN_AGE = 21
export const USER_MIN_AGE = 18

// The minimum age to register, which depends on the account being asked for
export const minAgeToRegister = (isAdmin) => (isAdmin === true ? ADMIN_MIN_AGE : USER_MIN_AGE)

/* True when the given date of birth is below the minimum age. A date of birth
that has not been entered yet is not too young: there is nothing to judge, and
saying so would show an age error before the user has typed anything. */
export const isUnderMinAge = (dateOfBirth, minAge) => {
  if (!dateOfBirth) return false;
  const age = calculateAge(dateOfBirth);
  if (age === null) return false;// An unreadable date is reported as required, not as too young
  return age < minAge;
}

//===========================================================================
// PASSWORDS (EditPasswordForm.js)
//===========================================================================
/* True when a password is at least 8 characters and includes at least one
special character. */
export const isStrongPassword = (pwd) => {
  //Regex pattern to check for at least 8 characters and one special character
  return /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/
    .test(
      String(pwd || '')// Ensure pwd is a string before testing
    );
}

//===========================================================================
// BLANK FORM SHAPES
//===========================================================================
/* A blank registration form. Rebuilt on each call because the form writes to
the nested objects, so a single shared object would be edited in place and the
next blank form would start off holding the last user's details. */
export const emptyNewUserData = () => ({
  fullName: { firstName: '', lastName: '' },
  email: '',
  dateOfBirth: '',
  address: { line1: '', line2: '', city: '', province: '' },
  admin: false,
  password: '',
})

/* The registration form's fields, none of them touched yet. Validation errors
are only shown for a field the user has already been in, so nothing is flagged
before it has been filled in. */
export const emptyTouchedFields = () => ({
  firstName: false,
  lastName: false,
  email: false,
  dateOfBirth: false,
  line1: false,
  city: false,
  province: false,
  password: false,
})

/* Blank edit form: reused for the initial state and after a successful update.
Left empty on purpose — the PATCH request only sends the fields the user
fills in, so any detail left blank keeps its stored value. */
export const emptyEditUserData = () => ({
  fullName: {
    firstName: '',
    lastName: '',
  },
  email: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    province: '',
  }
})

/* Assemble the PATCH /users/editUser body from the filled-in fields only. A
blank field is left out of the request so the stored value is kept as is, which
is why an empty object is a meaningful result: it means the user submitted the
form without filling anything in. */
export const buildEditUserPayload = (editUserData) => {
  const payload = {}

  const fullNameUpdates = {}
  if (trimValue(editUserData?.fullName?.firstName)) {
    fullNameUpdates.firstName = trimValue(editUserData.fullName.firstName)
  }
  if (trimValue(editUserData?.fullName?.lastName)) {
    fullNameUpdates.lastName = trimValue(editUserData.fullName.lastName)
  }
  if (Object.keys(fullNameUpdates).length) payload.fullName = fullNameUpdates

  if (trimValue(editUserData?.email)) payload.email = trimValue(editUserData.email)

  const addressUpdates = {}
  // line1 (street), line2, city and province all live on the nested address object
  for (const field of ['line1', 'line2', 'city', 'province']) {
    const value = trimValue(editUserData?.address?.[field])
    if (value) addressUpdates[field] = value
  }
  if (Object.keys(addressUpdates).length) payload.address = addressUpdates

  return payload
}
