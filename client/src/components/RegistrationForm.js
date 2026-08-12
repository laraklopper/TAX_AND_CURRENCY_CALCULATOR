import React, { useState } from 'react'
import '../css/componentCss/RegisForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

export default function RegistrationForm(
    {
        newUserData,
        setNewUserData
    }
    ) {
        const [showPassword, setShowPassword] = useState(false)
        const [passwordMsg, setPasswordMsg] = useState(false)
        const [emailMsg, setEmailMsg] = useState(false)
        
          const handleInputChange = (event) => {
        const { name, value } = event.target;// Get the input name and value from the changed field
        if (name.includes('.')) {// Check if the input name represents a nested object field
            const [parent, field] = name.split('.');// Split the field name into parent and child keys
            setNewUserData((prevState) => ({// Update nested state without removing existing nested values
                ...prevState,
                [parent]: {// Update the parent object, such as fullName or preferences
                    ...prevState[parent],
                    [field]: value// Update only the specific nested field

                }
            }))
        } else {
            // Update normal top-level fields
            setNewUserData((prev) => ({  // Example: username, email, dateOfBirth, password
                ...prev,
                [name]: value
            }))
        }
    };

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
        {/* GROUP 1: FullName */}
            <div id='regis-group1'>
               <Stack direction="horizontal" gap={3} id='regis-stack1'>
      <div className="p-2" id='regis-fullName-block'>
      <div id='regis-fullName'>
      <label className='regis-label' htmlFor=''>FULL NAME:</label>
        <div className='input-div'>
            <label className='regis-label'></label>
            <input
                className='input'
                placeholder='firstName'
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>


        </div>
        <div className='input-div'>
            <label className='regis-label' htmlFor='' hidden>LAST NAME</label>
            <input
                className='input'
                placeholder='LAST NAME'
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
        </div>
        </div>
        {/* ERROR MESSAGE */}
        {/* <span className='error-span'><p>Full Name is required</p></span> */}
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2"></div>
    </Stack>
            </div>
            {/* GROUP 2: Email + Date of Birth */}
            <div id='regis-group2'>
            {/* STACK 2: Email */}
                <Stack direction="horizontal" gap={3} id='regis-stack2'>
                <div className="p-2" id='regis-email-block'>
                        <div className='input-div'>
                            <label className='regis-label'>EMAIL:</label>
                            <div className='input-div'>
                                <input
                                type='email'
                                className='input'
                                placeholder='EMAIL'
                                required
                                name='email'
                                value={newUserData.email}
                                onChange={handleInputChange}
                                onFocus={() => setEmailMsg(true)}
                                onBlur={() => setEmailMsg(false)}
                                // ARIA ATTRIBUTES:

                            />
                        </div>
                        <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
                            </div>
                </div>
                {/* Error message */}
                {/* <div className="p-2">
                    <span><p>EMAIL IS REQUIRED</p></span>
                </div> */}
                {/* EMAIL MEssage */}
                {emailMsg && (
                    <div className="p-2 ms-auto">
                        <p className='msgText'>WE WILL NEVER SHARE YOUR EMAIL</p>
                    </div> 
                )}
             
                </Stack>
                {/* STACK 3 */}
                  <Stack direction="horizontal" gap={3} id='regis-stack3'>
      <div className="p-2">
      {/* DATE OF BIRTH: required */}
        <div className='input-div'>
        <label className='regis-label'>DATE OF BIRTH:</label>
            <input
                type='date'
                className='input'
                    // id=''
                    required
                    name='dateOfBirth'
                    value={newUserData.dateOfBirth}
                    onChange={handleInputChange}
                />
                <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
        </div>
        {/* Error message */}
        {/* <div className="p-2 ms-auto"></div> */}
      </div>
      <div className="p-2"><p className='infoText'>USERS MUST BE ATLEAST 18 YEARS OLD</p></div>
      
    </Stack>
            </div>
            {/* GROUP 3: admin + Password */}
            <div id='regis-group3'>
            {/* STACK 4 */}
                <Stack direction="horizontal" gap={3} id='regis-stack4'>
      <div className="p-2" id='admin-reg-block'>
      <div id='checkbox-div'>
        <label className='regis-label' htmlFor=''>REGISTER AS ADMIN:</label>
        <input
            type='checkbox'
            id='adminRegisBox'
            name='admin'
            checked={newUserData.admin}
            onChange={(e) => setNewUserData(prev => (
                { ...prev, admin: e.target.checked }
                ))}
            // ARIA ATTRIBUTES:
            aria-required='false'
        />
        </div>
      </div>
      
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <p className='infoText'>ADMIN USERS MUST BE AT LEAST 21 YEARS OLD</p>
      </div>
    </Stack>
    {/* STACK 5 */}
    <Stack direction="horizontal" gap={3} id='regis-stack5'>
      <div className="p-2" id='reg-pswd-block'>
        
        <div className='input-div'>
        <label className='regis-label' htmlFor='regisPswdInput'>PASSWORD:</label>
            <input
                className='input'
                placeholder='PASSWORD'
                type={showPassword ? 'text' : 'password'}
                required
                id='regisPswdInput'
                name='password'
                value={newUserData.password}
                onChange={handleInputChange}
                onFocus={() => setPasswordMsg(true)}
                onBlur={() => setPasswordMsg(false)}
                // ARIA ATTRIBUTES:

            />
             <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
        </div>
        <div>

        </div>
           
      </div>
      
      <div className="p-2">
        <Button 
        variant='warning' 
        id='showPasswrdBtn' 
        onClick={() => setShowPassword(!showPassword)}
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={showPassword ? 'Hide Password' : 'Show Password'}
        aria-pressed={showPassword}
        aria-expanded={showPassword}
        aria-controls='regisPswdInput'
        >
             {/* BUTTON TEXT */}
                {showPassword ? (
                    <>
                        Hide Password
                        <EyeOff fontWeight={700} style={{marginLeft: 6}} aria-hidden='true' focusable='false'/>
                    </>
                ) : (
                    <>
                        Show Password
                        <Eye fontWeight={700} style={{marginLeft: 6}} aria-hidden='true' focusable='false'/>
                    </>
                )}
        </Button>
      </div>
      {passwordMsg && (
         <div className="p-2 ms-auto" id='msgBlock'>
            <p className='msgText' aria-live="polite"><strong>We will never share your password</strong></p>
        </div>
      )}
     
    </Stack>
            </div>
        </div>
        <div id='regis-group4'>
        <Stack direction="horizontal" gap={3} id='regis-stack6'>
      <div className="p-2" id='requiredInfo'>
                    <p className='infoText' aria-live='polite' aria-hidden='true'>
                        <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
                    </p>
                </div>
                <div className="p-2 ms-auto">
        <Button variant='light'
        id='regis-btn'
        type='submit'
        >REGISTER</Button>
      </div>
      <div className="vr" style={{color: '#404040', opacity: .50, width: '2px'}}/>
      <div className="p-2 ">
        <Button variant='danger' id='clearFormBtn'>CLEAR FORM</Button>
      </div>
      
      
    </Stack>

        </div>

    </form>
  )
}
