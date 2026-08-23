// useCalculationsList.js
/* The behaviour shared by the three saved-calculation lists
(CurrencyCalculations.js, TaxCalculations.js, InterestCalculations.js).

All three do exactly the same things: load the history once the user is logged
in, remember which row's details panal is open, confirm a delete, report how it
went and close the panal on success. Only the columns and the details differ, so
that behaviour lives here and each component is left to render its own figures.

The parent owns the request itself and throws on failure, so the message shown
beside the delete button is the API's own reason. */
import { useCallback, useEffect, useState } from 'react'

export default function useCalculationsList({
  items = [],// The records currently on screen
  total = 0,// How many the user has in total, so a truncated view can say so
  loggedIn,// The history is scoped to the token: without one there is nothing to fetch
  fetchItems,// Loads the history
  deleteItem,// Removes one record, throwing its own message on failure
  confirmMessage,// Shown in the browser's confirm dialog before deleting
  successMessage,// Shown once a record has been removed
  setError,// Optional: the page's error state, kept in step with the panal's
  logLabel = 'useCalculationsList'// Names the component in console messages
} = {}) {
  /* The _id of the record selected on the table: the details panal is only
  rendered once a record has been selected */
  const [selectedId, setSelectedId] = useState(null)
  // Inline feedback shown above the table: {type: 'error' | 'success', text: string}
  const [status, setStatus] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* Load the saved calculations once the list is shown. Guarded on `loggedIn`
  because the history is scoped to the token. */
  useEffect(() => {
    if (loggedIn) {
      fetchItems?.()
    }
  }, [fetchItems, loggedIn])

  /* The full record of the selected row, looked up on every render so the panal
  always shows the latest details held in the list */
  const selected = items.find(item => String(item._id) === String(selectedId)) || null

  /* True when the user has more saved calculations than the history endpoint
  returns, so the list can say so rather than looking complete */
  const isTruncated = total > items.length

  // Open the details panal for the record selected on the table
  const selectItem = useCallback((id) => {
    setSelectedId(id)
    setStatus(null)// Clear feedback left over from the previously selected record
  }, [])

  // Close the details panal
  const closePanal = useCallback(() => {
    setSelectedId(null)
    setStatus(null)
  }, [])

  // Remove the selected record, reporting the outcome above the table
  const removeSelected = useCallback(async () => {
    //Conditional rendering to check a record is selected
    if (!selected) return;

    const confirmDelete = window.confirm(confirmMessage)

    if (!confirmDelete) return;// Exit the function early if the user cancels

    setDeleteLoading(true)//Set the loading state while the request is in flight
    setStatus(null)// Clear feedback from the previous attempt
    try {
      await deleteItem?.(selected._id)
      /* The parent has already dropped the record from the list, so the panal
      is closed and the outcome reported above the table instead */
      setSelectedId(null)
      setStatus({ type: 'success', text: successMessage })
      setError?.('')//Clear any previous error messages
    } catch (error) {
      const msg = error?.message || 'An error occurred while removing the calculation.';// Default error message
      setStatus({ type: 'error', text: msg })// Show the message above the table
      setError?.(msg)// Set the error state to display the error in the UI
      console.error(`[ERROR: ${logLabel}, removeSelected]`, msg);//Log an error message in the console for debugging purposes
    } finally {
      setDeleteLoading(false)//Set Loading state to false
    }
  }, [selected, deleteItem, confirmMessage, successMessage, setError, logLabel])

  return {
    selectedId,
    selected,
    status,
    deleteLoading,
    isTruncated,
    selectItem,
    closePanal,
    removeSelected
  }
}
