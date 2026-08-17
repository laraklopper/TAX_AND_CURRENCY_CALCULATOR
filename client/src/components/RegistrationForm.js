import React, { useMemo, useState } from 'react'
import '../css/componentCss/RegisForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';
import { Eye, EyeOff, MapPin  } from 'lucide-react';
import {provinces} from '../dataArrays/locations'
export default function RegistrationForm({
    newUserData,
    setNewUserData,
    addUser
}) {
    const [showPassword, setShowPassword] = useState(false)
    const [passwordMsg, setPasswordMsg] = useState(false)
    const [emailMsg, setEmailMsg] = useState(false)
    // Tracks whether each input field has been touched/blurred
    // This prevents validation errors from showing before the user interacts with a field
    const [touched, setTouched] = useState({
        firstName: false,    // Tracks if first name field was touched
        lastName: false,     // Tracks if last name field was touched
        email: false,        // Tracks if email field was touched
        dateOfBirth: false,  // Tracks if date of birth field was touched
        street: false,
        city: false,
        province:false,
        password: false,     // Tracks if password field was touched
    })

    // Minimum age: depends on whether the user registers as admin.
    //  21 for admin, 18 for regular user
    const minAge = newUserData.admin === true ? 21 : 18;

    // Latest acceptable date of birth for the minimum age requirement
    const today = new Date(); // Get today's date
    // Calculate the latest acceptable date of birth.
    // Example: If the minimum age is 18, the user's DOB must be on or before today's date minus 18 years.
    const maxDob = new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate()
    )
        .toISOString()
        .split('T')[0];

    //========== EMPTY FIELD VALIDATION ====================
    // Checks if first name is empty
    const firstNameEmpty = useMemo(
        () => !String(newUserData.fullName?.firstName || '').trim(), [newUserData.fullName?.firstName]
    )
    // Checks if last name is empty
    const lastNameEmpty = useMemo(
        () => !String(newUserData.fullName?.lastName || '').trim(), [newUserData.fullName?.lastName]
    );
    // Checks if email is empty
    const emailEmpty = useMemo(
        () => !String(newUserData.email || '').trim(), [newUserData.email]
    );

    // Checks if date of birth is empty
    const dateOfBirthEmpty = useMemo(
        () => !String(newUserData.dateOfBirth || '').trim(), [newUserData.dateOfBirth]
    );

    // Checks if password is empty
    const passwordEmpty = useMemo(
        () => !String(newUserData.password || '').trim(), [newUserData.password]
    );
    //========== AGE VALIDATION ====================
    // Checks whether the selected date of birth makes the user too young
    const dateOfBirthTooYoung = useMemo(() => {
        if (!newUserData.dateOfBirth) return false; // If no date of birth was selected, do not check age yet
        const dob = new Date(newUserData.dateOfBirth); // Convert the selected date of birth into a Date object
        const now = new Date(); // Get the current date
        let age = now.getFullYear() - dob.getFullYear(); // Calculate age based on year difference
        const m = now.getMonth() - dob.getMonth(); // Calculate month difference
        // If the user's birthday has not happened yet this year,
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
            age--; // subtract 1 from the calculated age
        }
        return age < minAge; // Return true if the user is younger than the required minimum age
    }, [newUserData.dateOfBirth, minAge]);

    // Only show validation errors AFTER field was touched
    // Show email error only if the email field was touched and is empty
    const showEmailError = touched.email && emailEmpty;
    // Show password error only if the password field was touched and is empty
    const showPasswordError = touched.password && passwordEmpty;
    // Show first name error only if the first name field was touched and is empty
    const showFirstNameError = touched.firstName && firstNameEmpty;
    // Show last name error only if the last name field was touched and is empty
    const showLastNameError = touched.lastName && lastNameEmpty;
    // Show date of birth required error only if the field was touched and empty
    const showDateOfBirthError = touched.dateOfBirth && dateOfBirthEmpty;
    // Show age error only if date of birth was touched, is not empty, and user is too young
    const showDateOfBirthAgeError =
        touched.dateOfBirth && !dateOfBirthEmpty && dateOfBirthTooYoung;

    //=========== EVENT LISTENERS=========================
    const handleRegistration = (e) => {
        e.preventDefault();
        // Mark every field as touched so validation errors show if the user submits an incomplete form
        setTouched({
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
            password: true,
        });
        const hasErrors =
            firstNameEmpty ||
            lastNameEmpty ||
            emailEmpty ||
            dateOfBirthEmpty ||
            dateOfBirthTooYoung ||
            passwordEmpty;
        if (hasErrors) return; // Block submission until all fields are valid
        console.log('[INFO: RegistrationForm.js]: Registering new user')
        addUser?.() //call the addUser function/request
    }

    const handleInputChange = (event) => {
        const { name, value } = event.target; // Get the input name and value from the changed field
        // Conditionl rendering to check if the input name represents a nested object field
        if (name.includes('.')) {
            const [parent, field] = name.split('.'); // Split the field name into parent and child keys
            setNewUserData((prevState) => ({ // Update nested state without removing existing nested values
                ...prevState,
                [parent]: { // Update the parent object, such as fullName or preferences
                    ...prevState[parent],
                    [field]: value // Update only the specific nested field

                }
            }))
        } else {
            // Update normal top-level fields
            setNewUserData((prev) => ({  // Example: email, dateOfBirth, password
                ...prev,
                [name]: value
            }))
        }
    };

    // Maps nested field names (e.g. fullName.firstName) to their flat touched key
    const handleBlur = (e) => {
        const { name } = e.target; // Get the input name
        const key = name.includes('.') ? name.split('.')[1] : name; // If the name is nested, use the second part as the touched key.
        setTouched(prev => ({ ...prev, [key]: true })); // Mark this field as touched
    };

    // Function to Clear/reset the registration form
    const clearForm = () => {
        const confirmClear = window.confirm( // Ask the user to confirm before clearing all input fields
            "Are you sure you want to clear the form?"
        );
        if (!confirmClear) return; // Stop if the user clicks Cancel
        // Reset the registration form data to its default values
        setNewUserData({
            fullName: { firstName: '', lastName: '' },
            email: '',
            dateOfBirth: '',
            admin: false,
            password: '',
        });
        setTouched({
            firstName: false,
            lastName: false,
            email: false,
            dateOfBirth: false,
            password: false,
        });
    }
    // ========= IDs USED BY aria-labelledby / aria-describedby =========
    // Keeps ARIA references stable and readable
    const formTitleId = 'registrationFormTitle';
    // Error IDs (for aria-describedby)
    const emailErrorId = 'registrationEmailError'; // ID used for email error message
    const passwordHelpId = 'registrationPasswordHelp'; // ID used for password help text
    const passwordErrorId = 'registrationPasswordError'; // ID used for password error message
    const firstNameErrorId = 'registrationFirstNameError'; // ID used for first name error message
    const lastNameErrorId = 'registrationLastNameError'; // ID used for last name error message
    const dateOfBirthErrorId = 'registrationDateOfBirthError'; // ID used for date of birth required error
    const dateOfBirthAgeHintId = 'registrationDateOfBirthAgeHint'; // ID used for date of birth age hint
    const dateOfBirthAgeErrorId = 'registrationDateOfBirthAgeError'; // ID used for date of birth age error

    // ===========JSX RENDERING==============
    return (
        <form id='registration-form' method='POST' aria-labelledby={formTitleId} onSubmit={handleRegistration}>
            <p className='visually-hidden' id={formTitleId}>REGISTRATION FORM</p>
            <div id='formHeadingBlock'>
                <h3 id='formHeading'>SIGN UP</h3>
            </div>
            {/* ============MAIN REGISTRATION INPUT BLOCK============ */}
            <div id='regis-input-details' aria-labelledby='mainInputDescrip'>
                {/* --------Screen Reader Heading----------- */}
                <p className='visually-hidden' id='mainInputDescrip'>
                    MAIN USER REGISTRATION DETAILS INPUT
                </p>
                {/* GROUP 1: FullName */}
                <div id='regis-group1'>
                    {/* STACK 1: */}
                    <Stack direction="horizontal" gap={3} id='regis-stack1'>
                        <div className="p-2" id='regis-fullName-block'>
                            {/* -------FULL NAME: First Name + Last Name---------- */}
                            <div id='regis-fullName'>
                                <label className='regis-label'>FULL NAME:</label>
                                {/* FIRST NAME */}
                                <div className='input-div'>
                                    {/* (Hidden Label) First Name Label */}
                                    <label className='regis-label' htmlFor='regisFirstName' hidden>FIRST NAME:</label>
                                    {/* First Name Input: value={newUserData.fullName.firstName} */}
                                    <input
                                        className='input'
                                        id='regisFirstName'
                                        type='text'
                                        required
                                        placeholder='FIRST NAME'
                                        autoComplete='given-name'
                                        name='fullName.firstName'
                                        value={newUserData.fullName.firstName}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        // ARIA ATTRIBUTES:
                                        aria-label='First Name Input'
                                        aria-required="true"
                                        aria-invalid={firstNameEmpty ? 'true' : 'false'}
                                        aria-describedby={showFirstNameError ? firstNameErrorId : null}
                                    />
                                    <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
                                </div>
                                {/* LAST NAME: required*/}
                                <div className='input-div'>
                                    {/* (Hidden Label) Last Name Label: value={newUserData.fullName.lastName} */}
                                    <label className='regis-label' htmlFor='regisLastName' hidden>LAST NAME:</label>
                                    {/* Last Name Input */}
                                    <input
                                        className='input'
                                        id='regisLastName'
                                        type='text'
                                        required
                                        placeholder='LAST NAME'
                                        autoComplete='family-name'
                                        name='fullName.lastName'
                                        value={newUserData.fullName.lastName}
                                        //EVENT HANDLERS:
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        // ARIA ATTRIBUTES:
                                        aria-label='Last Name Input'
                                        aria-required='true'
                                        aria-invalid={lastNameEmpty ? 'true' : 'false'}
                                        aria-describedby={showLastNameError ? lastNameErrorId : null}
                                    />
                                    <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
                                </div>
                            </div>
                            {/* ERROR MESSAGES: first and last Name */}
                            {showFirstNameError && (
                                <p id={firstNameErrorId} className="visually-hidden" role="alert">First name is required.</p>
                            )}
                            {showLastNameError && (
                                <p id={lastNameErrorId} className="visually-hidden" role="alert">Last name is required.</p>
                            )}
                        </div>
                        <div className="p-2 ms-auto"></div>
                        <div className="p-2"></div>
                    </Stack>
                </div>
                {/* GROUP 2: Email + Date of Birth */}
                <div id='regis-group2'>
                    {/* STACK 2: Email  */}
                    <Stack direction="horizontal" gap={3} id='regis-stack2'>
                        <div className="p-2" id='regis-email-block'>
                            {/* EMAIL: value={newUserData.email} */}
                            <div className='input-div'>
                                <label className='regis-label' htmlFor='regisEmailInput'>EMAIL:</label>
                                <div className='input-div'>
                                    <input
                                        type='email'
                                        className='input'
                                        id='regisEmailInput'
                                        placeholder='EMAIL'
                                        required
                                        autoComplete='email'
                                        name='email'
                                        value={newUserData.email}
                                        // EVENT HANDLERS:
                                        onChange={handleInputChange}
                                        onFocus={() => setEmailMsg(true)}
                                        onBlur={(e) => { setEmailMsg(false); handleBlur(e); }}
                                        // ARIA ATTRIBUTES:
                                        aria-label='Email Input'
                                        aria-required='true'
                                        aria-invalid={emailEmpty ? 'true' : 'false'}
                                        aria-describedby={showEmailError ? emailErrorId : null}
                                    />
                                </div>
                                <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
                            </div>
                        </div>
                        {/* Error message */}
                        {showEmailError && (
                            <div className="p-2" >
                                <p id={emailErrorId} className="visually-hidden" role="alert">EMAIL IS REQUIRED</p>
                            </div>
                        )}
                        {/* EMAIL MESSAGE */}
                        {emailMsg && (
                            <div className="p-2 ms-auto">
                                <p className='msgText'>WE WILL NEVER SHARE YOUR EMAIL</p>
                            </div>
                        )}
                    </Stack>
                    {/* STACK 3 */}
                    <Stack direction="horizontal" gap={3} id='regis-stack3'>
                        <div className="p-2">
                            {/* DATE OF BIRTH: value={newUserData.dateOfBirth} */}
                            <div className='input-div'>
                                <label className='regis-label' htmlFor='regisDateOfBirthInput'>DATE OF BIRTH:</label>
                                <input
                                    type='date'
                                    className='input'
                                    id='regisDateOfBirthInput'
                                    required
                                    max={maxDob}
                                    autoComplete='bday'
                                    name='dateOfBirth'
                                    value={newUserData.dateOfBirth}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    // ARIA ATTRIBUTES:
                                    aria-label='Date of Birth Input'
                                    aria-required='true'
                                    aria-invalid={(dateOfBirthEmpty || dateOfBirthTooYoung) ? 'true' : 'false'}
                                    aria-describedby={showDateOfBirthAgeError ? dateOfBirthAgeErrorId : dateOfBirthAgeHintId}
                                />
                                <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
                            </div>
                            {/* Error message */}
                            {showDateOfBirthError && (
                                <div className="p-2 ms-auto">
                                    <p id={dateOfBirthErrorId} className="visually-hidden" role="alert">
                                        Date of birth is required.
                                    </p>
                                </div>
                            )}
                            {showDateOfBirthAgeError && (
                                <div className="p-2 ms-auto">
                                    <p id={dateOfBirthAgeErrorId} className="visually-hidden" role="alert">
                                        You must be at least {minAge} years old to register{newUserData.admin === true ? ' as an admin' : ''}.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-2"><p className='infoText' id={dateOfBirthAgeHintId}>USERS MUST BE AT LEAST {minAge} YEARS OLD</p></div>
                    </Stack>
                </div>
                {/* GROUP 3:  */}
                <div id='regis-group3'>
                    <div id='regis-address-head'>   <span><h4 id='regisAddressHeading'>ADDRESS</h4><MapPin /></span></div>
                          
                          <Stack gap={3} id='regis-address-stack'>
      <div className="p-2" id='regis-streetaddress-block'>
        <div className='input-div'>
            <label className='regis-label'>STREET:</label>
            <textarea
                className='text-input'
                rows={2}
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
        <div className='input-div'>
            <label className='regis-label' htmlFor='addressLine2' hidden>LINE 2:</label>
            <textarea
                className='text-input'
                rows={2}
                id='addressLine2'
            />
        </div>      
        </div>
        {/* Error Message for street address */}
      {/* <div className="p-2">ERROR</div> */}
      <div className="p-2" id='regis-address-block2'>
        <div className='address-input-div'>
<label className='regis-label'>CITY/TOWN:</label>
<input
    className='input'
/>
<small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
        <div className='address-input-div'>
            <label className='regis-label'>PROVINCE:</label>
            <select
            className='input'
            >
            <option value=''>SELECT</option>
            {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
            ))}

            </select>
            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
        
      </div>
      <div className="p-2">
        <div>

        </div>
      </div>
    </Stack>  
                </div>
                {/* GROUP 4: admin + Password */}
                <div id='regis-group4'>
                    {/* STACK 4 */}
                    <Stack direction="horizontal" gap={3} id='regis-stack4'>
                        <div className="p-2" id='admin-reg-block'>
                            {/* ADMIN CHECKBOX: OPTIONAL (based on age restriction)*/}
                            {/* ADMIN: checked={newUserData.admin} */}
                            <div id='checkbox-div'>
                                <label className='regis-label' htmlFor='adminRegisBox'>REGISTER AS ADMIN:</label>
                                <input
                                    type='checkbox'
                                    id='adminRegisBox'
                                    name='admin'
                                    checked={newUserData.admin}
                                    onChange={(e) => setNewUserData(prev => (
                                        { ...prev, admin: e.target.checked }
                                    ))}
                                    // ARIA ATTRIBUTES:
                                    aria-label='Register as admin'
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
                            {/* PASSWORD : value={newUserData.password}*/}
                            <div className='input-div'>
                                <label className='regis-label' htmlFor='regisPswdInput'>PASSWORD:</label>
                                <input
                                    className='input'
                                    placeholder='PASSWORD'
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete='new-password'
                                    id='regisPswdInput'
                                    name='password'
                                    value={newUserData.password}
                                    // EVENT HANDLERS:
                                    onFocus={() => setPasswordMsg(true)}
                                    onBlur={(e) => { setPasswordMsg(false); handleBlur(e); }}
                                    onChange={handleInputChange}
                                    // ARIA ATTRIBUTES:
                                    aria-label='Registration Password'
                                    aria-required='true'
                                    aria-invalid={passwordEmpty ? 'true' : 'false'}
                                    aria-describedby={showPasswordError ? passwordErrorId : passwordHelpId}
                                />
                                <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /></small>
                            </div>
                            {/* ERROR MESSAGE */}
                            {showPasswordError && (
                                <p id={passwordErrorId} className="visually-hidden" role="alert">Password is required.</p>
                            )}
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
                                        <EyeOff fontWeight={700} style={{ marginLeft: 6 }} aria-hidden='true' focusable='false' />
                                    </>
                                ) : (
                                    <>
                                        Show Password
                                        <Eye fontWeight={700} style={{ marginLeft: 6 }} aria-hidden='true' focusable='false' />
                                    </>
                                )}
                            </Button>
                        </div>
                        {/* Pase */}
                        {passwordMsg && (
                            <div className="p-2 ms-auto" id='msgBlock'>
                                <p className='msgText' aria-live="polite"><strong>We will never share your password</strong></p>
                            </div>
                        )}
                    </Stack>
                </div>
            </div>
            {/* GROUP 5 */}
            <div id='regis-group5'>
                <Stack direction="horizontal" gap={3} id='regis-stack6'>
                    <div className="p-2" id='requiredInfo'>
                        <p className='infoText' aria-live='polite' aria-hidden='true'>
                            <small><Asterisk color="#C22419" fontWeight={700} size={12} aria-hidden='true' focusable='false' /> Indicates required information</small>
                        </p>
                    </div>
                    <div className="p-2 ms-auto">
                        <Button
                            variant='light'
                            id='regis-btn'
                            type='submit'
                            // ARIA ATTRIBUTES:
                            role='button'
                            aria-label='REGISTER'
                            aria-live='assertive'
                        >
                            REGISTER
                        </Button>
                    </div>
                    <div className="vr" style={{ color: '#404040', opacity: .50, width: '2px' }} />
                    <div className="p-2 ">
                        <Button
                            variant='danger'
                            id='clearFormBtn'
                            onClick={clearForm}
                            type='button'
                            // ARIA ATTRIBUTES:
                            aria-live='assertive'
                            aria-label='Clear form'
                        >CLEAR FORM</Button>
                    </div>
                </Stack>
            </div>
        </form>
    )
}
