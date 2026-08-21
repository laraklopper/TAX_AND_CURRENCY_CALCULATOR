// UsersList.js
// Admin only: a table of every registered user, and a details panal showing the
// full record (everything except the password) of the user selected on the table.
import React, { useCallback, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/UserList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// ===========HELPER FUNCTIONS===========
// Shown in place of any detail the user has not supplied (address line2 and
// province are the only optional fields on the user schema)
const NOT_PROVIDED = 'NOT PROVIDED'

// Fall back to a placeholder when a detail is missing or blank
const orPlaceholder = (value) =>
  (typeof value === 'string' && value.trim()) || NOT_PROVIDED

// Format an ISO date string as e.g. 01 March 2025
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

// Join the first and last name, tolerating a missing half
const toFullName = (fullName) => {
  const name = [fullName?.firstName, fullName?.lastName].filter(Boolean).join(' ')
  return name || NOT_PROVIDED
}

// Row striping: STYLES.md 1.5. TABLES
const rowClass = (index) => (index % 2 === 0 ? 'evenRow' : 'oddRow')

export default function UsersList(
  {//PROPS PASSED FROM PARENT COMPONENT(Profile.js)
    users = [],
    setUsers,
    currentUser,
    setError
  }) {
  // ========STATE VARIABLES=====================
  /* The _id of the user selected on the table: the details panal is only
  rendered once a user has been selected */
  const [selectedUserId, setSelectedUserId] = useState(null)
  // Inline feedback shown inside the details panal: {type: 'error' | 'success', text: string}
  const [status, setStatus] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // The full record of the selected user, looked up on every render so the
  // panal always shows the latest details held in the users list
  const selectedUser = users.find(user => String(user._id) === String(selectedUserId)) || null

  /* Admin users cannot be removed, and an admin cannot delete their own
  account while logged in with it */
  const isCurrentUser = selectedUser && String(selectedUser._id) === String(currentUser?._id)
  const canDelete = Boolean(selectedUser) && !selectedUser.admin && !isCurrentUser

  // ======HANDLERS/REQUESTS===========
  // Open the details panal for the user selected on the table
  const selectUser = (id) => {
    setSelectedUserId(id)
    setStatus(null)// Clear feedback left over from the previously selected user
  }

  // Close the details panal
  const closePanal = () => {
    setSelectedUserId(null)
    setStatus(null)
  }

  /* Report a validation/request failure in one place: inline message and
     parent error state stay in sync */
  const failWith = useCallback((msg) => {
    setStatus({ type: 'error', text: msg });// Show the message inside the panal
    setError?.(msg);// Set the error state to display the error in the UI
  }, [setError])

  // DELETE /users/deleteUser/:id: remove the selected user
  const deleteUser = useCallback(async () => {
    //Conditional rendering to check that a deletable user is selected
    if (!selectedUser) return;

    // Admin users cannot be removed: guard the request as well as the button
    if (selectedUser.admin) {
      failWith('Admin users cannot be removed.');
      return;// Exit the function early
    }

    // An admin cannot delete the account they are logged in with
    if (String(selectedUser._id) === String(currentUser?._id)) {
      failWith('You cannot delete the account you are logged in with.');
      return;// Exit the function early
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${toFullName(selectedUser.fullName)}? This cannot be undone.`
    )

    if (!confirmDelete) return;// Exit the function early if the admin cancels

    setDeleteLoading(true)//Set the loading state while the request is in flight
    setStatus(null)// Clear feedback from the previous attempt
    try {
      const token = localStorage.getItem('token');// Retrieve the JWT token from localStorage

      //Conditional rendering to check if token exists
      if (!token) {
        failWith('User is not authenticated. Please log in again.');
        return;// Exit the function early
      }

      const response = await fetch(`http://localhost:3001/users/deleteUser/${selectedUser._id}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',// Specify the Content-Type in the request payload
          'Authorization': `Bearer ${token}`,// Attach JWT token for authorization
        }
      });

      const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)
      /* Conditional rendering to check if the response
         is not successful (status code is not in the range 200-299)*/
      if (!response.ok) {
        failWith(data.message || data.error || 'Failed to delete user.');//Default error message
        return;// Exit the function early
      }

      // Drop the deleted user from the list on screen and close the panal
      setUsers?.(prev => prev.filter(user => String(user._id) !== String(selectedUser._id)))
      setSelectedUserId(null)
      setError?.(null)//Clear any previous error messages
      console.log('[SUCCESS: UsersList.js, deleteUser] Deleted user:', selectedUser._id);// Log success message to console for debugging
    } catch (error) {
      const msg = error?.message || 'An error occurred while deleting the user.';// Default error message
      failWith(msg);
      console.error('[ERROR: UsersList.js, deleteUser]', msg);// Log the error message in the console for debugging
    } finally {
      setDeleteLoading(false)//Set Loading state to false
    }
  }, [selectedUser, currentUser, setUsers, setError, failWith])
  //===============JSX RENDERING=================
  return (
    <div id='users-list'>
        <div id='user-list'>
        {/* ------USER LIST TABLE------------- */}
        {users.length === 0 ? (
          <p className='infoText' aria-live='polite'>NO REGISTERED USERS TO DISPLAY</p>
        ) : (
          <table id='user-list-table' role='table' aria-label='Registered users'>
            <thead>
              <tr>
                <th scope='col'>FULL NAME</th>
                <th scope='col'>EMAIL</th>
                <th scope='col'>DATE OF BIRTH</th>
                <th scope='col'>ADMIN</th>
                <th scope='col'><span className='visually-hidden'>VIEW USER DETAILS</span></th>
              </tr>
            </thead>
            <tbody>
              {/* MAP EACH USER: selecting a row opens the details panal below */}
              {users.map((user, index) => {
                const isSelected = String(user._id) === String(selectedUserId)
                return (
                  <tr
                    key={user._id}
                    className={`${rowClass(index)}${isSelected ? ' selectedRow' : ''}`}
                    aria-selected={isSelected}
                  >
                    <th scope='row'>{toFullName(user.fullName)}</th>
                    <td className='user-email-cell'>{orPlaceholder(user.email)}</td>
                    <td>{toLongDate(user.dateOfBirth)}</td>
                    <td>{user.admin ? 'YES' : 'NO'}</td>
                    <td>
                      <Button
                        variant='light'
                        className='viewUserBtn'
                        type='button'
                        onClick={() => (isSelected ? closePanal() : selectUser(user._id))}
                        // ARIA ATTRIBUTES:
                        aria-label={`${isSelected ? 'Hide' : 'View'} details for ${toFullName(user.fullName)}`}
                        aria-pressed={isSelected}
                        aria-expanded={isSelected}
                        aria-controls='user-details-panal'
                      >
                        {isSelected ? 'HIDE' : 'VIEW'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        </div>

         {/* DETAILS PANAL IF THE USER IS SELECTED ON THE TABLE LIST (SHOW ALL USER DATA EXCEPT PASSWORD)*/}
         {selectedUser && (
         <div id='user-details-panal'>
         <Stack direction="horizontal" gap={3} id='user-panal-head-stack'>
      <div className="p-2">
        {/* USER FULL NAME */}
        <h5 id='user-panal-heading'>{toFullName(selectedUser.fullName)}</h5>
      </div>
      <div className="p-2 ms-auto">
        <Button
        variant='light'
        id='closeUserPanalBtn'
        type='button'
        onClick={closePanal}
        // ARIA ATTRIBUTES:
        aria-label='Close user details'
        aria-controls='user-details-panal'
        >CLOSE</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        {/* ADMIN: YES/NO */}
        <div className='details-group'>
          <span><p className='details-label'>ADMIN:</p></span>
          <p className='details-value'>{selectedUser.admin ? 'YES' : 'NO'}</p>
        </div>
      </div>
      </Stack>
      <div id='user-panal'>
              <Stack gap={3} id='user-details-stack1'>
      <div className="p-2">
        {/* FULL NAME */}
        <div className='details-group'>
          <span><p className='nested-details-label'>FULL NAME:</p></span>
          <div className='nested-details-group'>
            <span className='nested-details-span'>
              <p className='details-label'>FIRST NAME:</p>
              <p className='details-value'>{orPlaceholder(selectedUser.fullName?.firstName)}</p>
            </span>
            <span className='nested-details-span'>
              <p className='details-label'>LAST NAME:</p>
              <p className='details-value'>{orPlaceholder(selectedUser.fullName?.lastName)}</p>
            </span>
          </div>
        </div>
      </div>
      <div className="p-2">
        {/* DATE OF BIRTH */}
        <div className='details-group'>
          <span><p className='details-label'>DATE OF BIRTH:</p></span>
          <p className='details-value'>{toLongDate(selectedUser.dateOfBirth)}</p>
        </div>
      </div>
      <div className="p-2">
        {/* REGISTERED: createdAt timestamp on the user schema */}
        <div className='details-group'>
          <span><p className='details-label'>REGISTERED:</p></span>
          <p className='details-value'>{toLongDate(selectedUser.createdAt)}</p>
        </div>
      </div>

    </Stack>
<Stack gap={3} id='user-details-stack2'>
      <div className="p-2">
        {/* EMAIL */}
        <div className='details-group'>
          <span><p className='details-label'>EMAIL:</p></span>
          <p className='details-value email-value'>{orPlaceholder(selectedUser.email)}</p>
        </div>
      </div>
      <div className="p-2">
        {/* ADDRESS */}
        <div className='details-group'>
          <span><p className='nested-details-label'>ADDRESS:</p></span>
          <div className='nested-details-group'>
            <span className='nested-details-span'>
              <p className='details-label'>STREET:</p>
              <p className='details-value'>{orPlaceholder(selectedUser.address?.line1)}</p>
            </span>
            <span className='nested-details-span'>
              <p className='details-label'>LINE 2:</p>
              <p className='details-value'>{orPlaceholder(selectedUser.address?.line2)}</p>
            </span>
            <span className='nested-details-span'>
              <p className='details-label'>CITY/TOWN:</p>
              <p className='details-value'>{orPlaceholder(selectedUser.address?.city)}</p>
            </span>
            <span className='nested-details-span'>
              <p className='details-label'>PROVINCE:</p>
              <p className='details-value'>{orPlaceholder(selectedUser.address?.province)}</p>
            </span>
          </div>
        </div>
      </div>
      <div className="p-2">
        {/* LAST UPDATED: updatedAt timestamp on the user schema */}
        <div className='details-group'>
          <span><p className='details-label'>LAST UPDATED:</p></span>
          <p className='details-value'>{toLongDate(selectedUser.updatedAt)}</p>
        </div>
      </div>
    </Stack>
      </div>
      {/* Inline request feedback, announced to screen readers */}
      {status && (
        <div className="p-2" id='user-panal-status'>
          <p
            className='msgText'
            role={status.type === 'error' ? 'alert' : 'status'}
            aria-live={status.type === 'error' ? 'assertive' : 'polite'}
            style={{ color: status.type === 'error' ? '#C22419' : '#1B6E2F' }}
          >
            {status.text}
          </p>
        </div>
      )}
      <Stack direction="horizontal" gap={3} id='user-panal-footer-stack'>
      <div className="p-2">
        <h6>ADMIN USERS CANNOT BE REMOVED</h6>
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
        <Button
        variant='danger'
        id='deleteUserBtn'
        type='button'
        onClick={deleteUser}
        disabled={!canDelete || deleteLoading}
        // ARIA ATTRIBUTES:
        aria-disabled={!canDelete || deleteLoading}
        aria-label={deleteLoading ? 'DELETING...' : 'delete User'}
        >{deleteLoading ? 'DELETING...' : 'DELETE USER'}</Button>
      </div>
    </Stack>


         </div>
         )}
    </div>
  )
}
