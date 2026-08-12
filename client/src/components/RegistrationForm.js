import React, { useState } from 'react'
import '../css/componentCss/RegisForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
export default function RegistrationForm(
    {
        newUserData,
        setNewUserData
    }
    ) {
        const [showPassword, setShowPassword] = useState(false)
        const [passwordMsg, setPasswordMsg] = useState(false)
        const [emailMsg, setEmailMsg] = useState(false)
        

    // ========= IDs USED BY aria-labelledby / aria-describedby =========
    // Keeps ARIA references stable and readable
    const formTitleId = 'registrationFormTitle';
    // Error IDs (for aria-describedby)
  return (
    <form id='registration-form' method='POST' aria-labelledby={formTitleId}>
    <p className='visually-hidden' id={formTitleId}>REGISTRATION FORM</p>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>SIGN UP</h3>
        </div>
        <div id='regis-input-details'>
            <div id='regis-group1'>
               <Stack direction="horizontal" gap={3} id='regis-stack1'>
      <div className="p-2" id='regis-fullName-block'>
      <div id='regis-fullName'>
      <label className='regis-label'>FULL NAME:</label>
        <div className='input-div'>
            <label className='regis-label'></label>
            <input
                className='input'
                placeholder='firstName'
            />

        </div>
        <div className='input-div'>
            <label className='regis-label'></label>
            <input
                className='input'
                placeholder='LAST NAME'
            />
        </div>
        </div>
        {/* ERROR MESSAGE */}
        {/* <span className='error-span'><p>Full Name is required</p></span> */}
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2"></div>
    </Stack>

            </div>
            <div id='regis-group2'>
                <Stack direction="horizontal" gap={3} id='regis-stack2'>
                <div className="p-2">
                        <div className='input-div'>
                            <label className='regis-label'>EMAIL:</label>
                            <input
                                type='email'
                                className='input'
                                
                            />
                        </div>
                </div>
                {/* Error message */}
                {/* <div className="p-2">
                    <span><p>EMAIL IS REQUIRED</p></span>
                </div> */}
                {/* EMAIL MEssage */}
                {/* <div className="p-2 ms-auto">Second item</div> */}
                </Stack>
                  <Stack direction="horizontal" gap={3} id='regis-stack3'>
      <div className="p-2">
        <div className='input-div'>
        <label className='regis-label'>DATE OF BIRTH:</label>
            <input
                type='date'
                className='input'
                    // id=''
                />

        </div>
      </div>
      <div className="p-2"><p className='infoText'>USERS MUST BE ATLEAST 18 YEARS OLD</p></div>
      <div className="p-2 ms-auto">Second item</div>
      
    </Stack>


            </div>
            <div id='regis-group3'>
                <Stack direction="horizontal" gap={3} id='regis-stack4'>
      <div className="p-2" id='admin-reg-block'>
      <div id='checkbox-div'>
        <label className='regis-label'>REGISTER AS ADMIN:</label>
        <input
            type='checkbox'
            
        />
        </div>
      </div>
      <div className="p-2 ms-auto">
        <p className='infoText'>ADMIN USERS MUST BE AT LEAST 21 YEARS OLD</p>
      </div>
      <div className="p-2"></div>
    </Stack>
    <Stack direction="horizontal" gap={3} id='regis-stack5'>
      <div className="p-2" id='reg-pswd-block'>
        <label className='regis-label'>PASSWORD:</label>
        <div className='input-div'>
            <input
                className='input'
                placeholder='PASSWORD'
            />
        </div>
      </div>
      
      <div className="p-2">
        <Button variant='warning' id='showPasswrdBtn'>SHOW PASSWORD</Button>
      </div>
      <div className="p-2 ms-auto"></div>
    </Stack>
            </div>
        </div>
        <div id='regis-group4'>
        <Stack direction="horizontal" gap={3} id='regis-stack6'>
      <div className="p-2">First item</div>
      <div className="vr" />
      <div className="p-2 ms-auto">
        <Button>CLEAR FORM</Button>
      </div>
      
      <div className="p-2">
        <Button>REGISTER</Button>
      </div>
    </Stack>

        </div>

    </form>
  )
}
