import React from 'react'
import Header from '../components/Header'

export default function Users({currentUser}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser}/>
    </div>
  )
}
