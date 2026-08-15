// CurrencyList.js
import React from 'react'
import '../css/componentCss/CurrencyList.css'
import { currencyCountries } from '../dataArrays/currencyCountries';
// display all available currencies in the data array in table format
// add the country/s where the currency is used
export default function CurrencyList() {
  return (
    <div id='currency-list-block'>
        {/* Currency list table */}
        <table id='currency-list-table' role='table' aria-label='Available currencies and the countries where they are used'>
            <thead>
                <tr>
                    <th scope='col'>CODE</th>
                    <th scope='col'>CURRENCY</th>
                    <th scope='col'>COUNTRY/S</th>
                </tr>
            </thead>
            <tbody>
                {/* MAP EACH CURRENCY WITH ITS NAME AND COUNTRY/S */}
                {currencyCountries.map(({ code, name, countries }, index) => (
                    <tr key={code} className={index % 2 === 0 ? 'evenRow' : 'oddRow'}>
                        <th scope='row'>{code}</th>
                        <td>{name}</td>
                        <td>{countries.join(', ')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}
