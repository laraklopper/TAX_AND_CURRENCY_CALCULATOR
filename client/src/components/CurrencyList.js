// CurrencyList.js
import React from 'react'
import '../css/componentCss/CurrencyList.css'
import { currencyCountries } from '../dataArrays/currencyCountries';

/* Country lookup by currency code, built once from the static data rather than
searched through for every row. */
const COUNTRIES_BY_CODE = currencyCountries.reduce((lookup, { code, countries }) => {
  lookup[code] = countries;
  return lookup;
}, {});

/* Displays every currency the converter can work with in table format.

The codes, names and symbols come from `currencyOptions`, which the page loaded
from GET /api/currencies, so the table lists exactly what Frankfurter supports.
The countries a currency is used in are not something the API reports, so they
are looked up in the local currencyCountries data and left blank for codes it
does not cover. */
export default function CurrencyList({ currencyOptions = [] }) {
  return (
    <div id='currency-list-block'>
        {/* Currency list table */}
        <table id='currency-list-table' role='table' aria-label={`${currencyOptions.length} available currencies and the countries where they are used`}>
            <thead>
                <tr>
                    <th scope='col' style={{textAlign: 'center'}}>CODE</th>
                    <th scope='col' style={{textAlign: 'center'}}>CURRENCY</th>
                    <th scope='col' style={{textAlign: 'center'}}>SYMBOL</th>
                    <th scope='col' style={{textAlign: 'center'}}>COUNTRY/S</th>
                </tr>
            </thead>
            <tbody>
                {/* MAP EACH CURRENCY WITH ITS NAME, SYMBOL AND COUNTRY/S */}
                {currencyOptions.map(({ code, name, symbol }, index) => (
                    <tr key={code} className={index % 2 === 0 ? 'evenRow' : 'oddRow'}>
                        <th scope='row'>{code}</th>
                        <td>{name || code}</td>
                        <td>{symbol || '—'}</td>
                        <td>{COUNTRIES_BY_CODE[code] ? COUNTRIES_BY_CODE[code].join(', ') : '—'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}
