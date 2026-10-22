import React, { useCallback, useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/RegisForm.css'
import Stack from 'react-bootstrap/Stack';
// IMPORT ICONS FROM LUCIDE REACT
import { ShieldUser, X } from 'lucide-react';
import { ADMIN_STATUS } from '../utils/userFunc';
export default function AdminRegisForm(
    {
        currentUser,
        setCurrentUser,
        exitAdminForm,
        setError
    }
) {
    const [adminStatus, setAdminStatus] = useState('')
    const [submitting, setSubmitting] = useState('false')

    //Function to register an existing user as admin
    const setAdmin = useCallback(async () => {
        try {
      const token = localStorage.getItem('token');//Retrieve token from localStorage

      if(!token) return;
      //Send a PATCH request to the '/auth/setAdmin' endpoint
      const response = await fetch('http://localhost:3001/auth/setAdmin', {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })
       const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data?.message || 'Failed to register as admin');
      // Save the new token (contains the updated admin claim) and update the current user
      localStorage.setItem('token', data.token)
      setCurrentUser?.(data.user)
      setError(null)
      console.log('[SUCCESS: Home.js] User registered as admin');
    } catch (error) {
      console.error('[ERROR: Home.js] Error setting user as admin:', error.message);
      setError(`Error setting user as admin: ${error.message}`)
    }
    },[])

    // Function to exit register as admin
    /* if the user confirms, do not display the form again */
    const exitForm = () => {
        const confirmExit = window.confirm(
            'Are you sure you want to exit? This option is only available once'
        )
        if (!confirmExit) return;
        exitAdminForm?.()
    }
    //==============================
  return (
    <form id='registerAdminForm'>
    <p id='adminFormTitle' className='visually-hidden'>FORM TO REGISTER AS ADMIN</p>
        <Stack direction="horizontal" gap={3}>
      <div className="p-2" id='adminRegisBlock'>
        <label id='adminLabel' className='regis-label' htmlFor='regisAdmin'>REGISTER AS ADMIN</label> 
        <select>
            <option value={''}>SELECT</option>
            {ADMIN_STATUS.map((status) =>(
                <option key={status} value={status}>
                    {status}
                </option>
            ))}
        </select>
      </div>
      <div className="p-2 ms-auto">Second item</div>
      <div className="p-2">

      </div>
    </Stack>
    <div id='adminMessageDiv'>
            <Stack gap={2} className="col-md-5 mx-auto" id='adminMsgStack'>
                <p className='infoText' id='adminMsg'>THIS OPTION IS ONLY AVAILABLE ONCE</p>
                <p className='reqText'>Admin users must be 21 years or older</p>
            </Stack>
          </div>

    </form>
  )
}
