//CurrencyCalculations.js
import React, { useEffect } from 'react'
import '../css/componentCss/CalculationsList.css'
import '../css/componentCss/CurrencyList.css'

export default function CurrencyCalculations({fetchConversions, loggedIn, conversions, deleteConversion}) {

  useEffect(() => {
    if (loggedIn) {
      fetchConversions()
    }
  },[fetchConversions, loggedIn])
  
  //=============JSX RENDERING===============
  return (
    <div consversions-list>
      {/* Display conversion calculations list*/}
    </div>
  )
}
