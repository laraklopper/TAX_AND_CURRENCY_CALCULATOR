import React, { useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { provinces } from '../dataArrays/locations';
import { MapPin } from 'lucide-react';

export default function EditUserForm() {
  const [showEmailMsg, setShowEmailMsg] = useState(false)
  return (
    <form id='edit-user-form' method='PATCH'>
    <div id='formHeadingBlock'>
        <h3 id='formHeading'>EDIT USER PROFILE</h3>
    </div>
    <div id='edit-user-input-details'>
      <div id='edit-user-group1'>
       <Stack direction="horizontal" gap={3} id='edit-user-stack1'>
      <div className="p-2" id='edit-user-block1'> <label className='edit-user-label'>FULL NAME:</label></div>
      <div className="p-2" >
        <div className='input-group'>
<div className='input-div'>
        <label className='edit-user-label'>FIRST NAME:</label>
        <input
          className='input'
          type='text'
          placeholder='FIRST NAME'
          // name=''
          // value={}
          // onChange={}
          // ARIA ATTRIBUTES:
        />
        </div>
        <div className='input-div'>
        <label className='edit-user-label'>LAST NAME:</label>
        <input
          className='input'
          placeholder='LAST NAME'
          // name=''
          // value={}
          // onChange={}
          // ARIA ATTRIBUTES:
        />
        </div>
      </div>
      </div>
      <div className="p-2"></div>
    </Stack>
 <Stack direction="horizontal" gap={3} id='edit-user-stack2'>
      <div className="p-2" id='edit-user-email-block'>
        <label className='edit-user-label'>EMAIL</label>
        <input
          className='input'
          type='email'
          placeholder='EMAIL'
          // name=''
          // value={}
          onFocus={() => setShowEmailMsg(true)}
          onBlur={() => setShowEmailMsg(false)}
          // onChange={}
        />
      </div>
      <div className="p-2 ms-auto"></div>
      {showEmailMsg && (<div className="p-2">
        <p>WE WILL NEVER SHARE YOUR EMAIL</p>
      </div>)}
    </Stack>
      </div>
      <div id='edit-user-group2'>
        <Stack gap={3} id='edit-user-stack3'>
        <div className="p-2" id='address-head-block'>
          <span id='address-head-span'><h5 id='address-heading'>ADDRESS</h5><MapPin/></span>
        </div>
      <div className="p-2" id='address-block2'>
        <div className='input-div'>
          <label className='edit-user-label'>STREET:</label>
          <textarea
            rows={2}
            className='text-input'
          />
        </div>
        <div className='input-div'>
          <label className='edit-user-label'>LINE 2:</label>
          <textarea
          className='text-input'
            rows={2}
          />
        </div>
      </div>
      <div className="p-2" id='address-block3'>
        <div className='input-div'>
          <label className='edit-user-label'>CITY/TOWN:</label>
          <input
            className='input'
          />
        </div>
        <div className='input-div'>
          <label className='edit-user-label'>PROVINCE:</label>
          <select
            className='input'

            // name=''
            // value={}
            // onChange={}
          >
             <option value=''>SELECT</option>
                        {provinces.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
          </select>
        </div>
      </div>
      
    </Stack>
      </div>
    </div>
    <div id='edit-user-group3'>
      <Stack direction="horizontal" gap={3} id='edit-user-stack4'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button variant='danger' id='clearFormBtn'>CLEAR</Button>
      </div>
      <div className="p-2">
        <Button
        variant='light'
        id='edit-userBtn'
        >EDIT USER</Button>
      </div>
    </Stack>
    </div>

    </form>
  )
}
