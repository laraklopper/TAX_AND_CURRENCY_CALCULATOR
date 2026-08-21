import React from 'react'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
export default function UsersList() {
  return (
    <div id='users-list'>
        <div id='user-list'>
            {/* display a table showing list of users
            show userFullName, Email, Date of birth and admin status
         */}
        </div>
        
         {/* DETAILS PANAL IF THE USER IS SELECTED ON THE TABLE LIST (SHOW ALL USER DATA EXCEPT PASSWORD)*/}
         <div id='user-details-panal'>
         <Stack direction="horizontal" gap={3} id='user-panal-head-stack'>
      <div className="p-2">
        {/* USER FULL NAME */}
      </div>
      <div className="p-2 ms-auto">
        <Button>CLOSE</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        {/* ADMIN: YES/NO */}
      </div>
      </Stack>
      <div id='user-panal'>
              <Stack gap={3} id='user-details-stack1'>
      <div className="p-2">
        {/* FULL NAME */}
      </div>
      <div className="p-2">
        {/* DATE OF BIRTH */}
      </div>
      <div className="p-2">
        
      </div>
      
    </Stack>
<Stack gap={3} id='user-details-stack2'>
      <div className="p-2">EMAIL</div>
      <div className="p-2">ADDRESS</div>
      <div className="p-2"/>
    </Stack>
      </div>
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
        // onClick={}
        aria-label='delete User'
        >DELETE USER</Button>
      </div>
    </Stack>
    

         </div>
    </div>
  )
}
