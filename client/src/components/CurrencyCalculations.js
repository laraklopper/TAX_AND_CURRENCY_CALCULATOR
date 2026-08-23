//CurrencyCalculations.js
import React, { useEffect, useState } from 'react'
import '../css/componentCss/CalculationsList.css'
import '../css/componentCss/CurrencyList.css'
// import Button from 'react-bootstrap/Button';

//CurrencyCalculations.js function component
export default function CurrencyCalculations(
  {//PROPS PASSED FROM PARENT COMPONENT(CurrencyConverter.js)
    fetchConversions, 
    loggedIn, 
    conversions, 
    deleteConversion
  }) {
    const [selectConversionId, setSelectConversionId] = useState(null)
    const [status, setStatus] = useState(null)

   
  useEffect(() => {
    if (loggedIn) {
      fetchConversions()
    }
  },[fetchConversions, loggedIn])
  
    const selectedConversion = conversions.find(conversion => String(conversion._id) === String(selectConversionId)) || null

    const selectConversion = () => {
      setSelectConversionId(id)
      setStatus(null)
    }

    const closeConversionPanal = () => {
      setSelectConversionId(null)
      setStatus(null)
    }
    //=============JSX RENDERING===============
  return (
    <div consversions-list>
      {/* Display conversion calculations list in table format 
      with a details panal displayed after clicking on the conversion*/}
    </div>
  )
}
